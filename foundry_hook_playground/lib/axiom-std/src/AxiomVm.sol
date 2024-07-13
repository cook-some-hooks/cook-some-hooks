// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import { IAxiomV2Query } from "@axiom-crypto/v2-periphery/interfaces/query/IAxiomV2Query.sol";
import { IAxiomV2Client } from "@axiom-crypto/v2-periphery/interfaces/client/IAxiomV2Client.sol";
import {
    AxiomV2Addresses,
    MAINNET_CHAIN_ID,
    SEPOLIA_CHAIN_ID,
    BASE_CHAIN_ID,
    BASE_SEPOLIA_CHAIN_ID
} from "./AxiomV2Addresses.sol";

import { AxiomCli } from "./AxiomCli.sol";

/// @dev Arguments for constructing a query into Axiom
/// @param sourceChainId The chain ID of the chain that the query is being sent from
/// @param dataQueryHash The hash of the data query
/// @param computeQuery The compute query
/// @param callback The callback
/// @param feeData The fee data
/// @param userSalt The user salt
/// @param refundee The refundee
/// @param dataQuery The data query
/// @param value The value to send with the query
struct QueryArgs {
    uint64 sourceChainId;
    bytes32 dataQueryHash;
    IAxiomV2Query.AxiomV2ComputeQuery computeQuery;
    IAxiomV2Query.AxiomV2Callback callback;
    IAxiomV2Query.AxiomV2FeeData feeData;
    bytes32 userSalt;
    address refundee;
    bytes dataQuery;
    uint256 value;
}

/// @dev Arguments for pranking a callback from Axiom
/// @param sourceChainId The chain ID of the chain that the query is being sent from
/// @param caller The address of the caller of the original query into Axiom
/// @param querySchema The query schema
/// @param queryId The query ID
/// @param axiomResults The results of the query
/// @param callbackExtraData The extra data to be passed to the callback contract
/// @param gasLimit The gas limit for the callback
/// @param callbackTarget The address of the callback contract
struct FulfillCallbackArgs {
    uint64 sourceChainId;
    address caller;
    bytes32 querySchema;
    uint256 queryId;
    bytes32[] axiomResults;
    bytes callbackExtraData;
    uint256 gasLimit;
    address callbackTarget;
}

/// @dev A query into Axiom
/// @param querySchema The query schema
/// @param input The input data for the query
/// @param callbackTarget The address of the contract to send a callback to
/// @param callbackExtraData Extra data to include in the callback
/// @param feeData The fee data for the query
/// @param axiomVm The AxiomVm contract
/// @param outputString The output string from the query
/// @param caller The address of the caller of the original query into Axiom
struct Query {
    bytes32 querySchema;
    bytes input;
    address callbackTarget;
    bytes callbackExtraData;
    IAxiomV2Query.AxiomV2FeeData feeData;
    AxiomVm axiomVm;
    string outputString;
    address caller;
}

/// @title Axiom
/// @dev A library to handle interactions between Query and the AxiomV2Query contract
library Axiom {
    /// @dev Sends a query to Axiom, is a no-op if Axiom is not deployed on the current chain
    /// @param self The query to send
    function send(Query memory self) public {
        if (
            block.chainid == MAINNET_CHAIN_ID || block.chainid == SEPOLIA_CHAIN_ID || block.chainid == BASE_CHAIN_ID
                || block.chainid == BASE_SEPOLIA_CHAIN_ID
        ) {
            self.outputString = self.axiomVm.getArgsAndSendQuery(
                self.querySchema, self.input, self.callbackTarget, self.callbackExtraData, self.feeData, self.caller
            );
        } else {
            console.log("Query.send() is a no-op: Axiom is not deployed on chain ", block.chainid);
        }
    }

    /// @dev Pranks a callback from Axiom
    /// @param self The query to fulfill the callback for
    /// @return results The results of the query
    function prankFulfill(Query memory self) public returns (bytes32[] memory results) {
        FulfillCallbackArgs memory args = self.axiomVm.fulfillCallbackArgs(
            self.querySchema, self.input, self.callbackTarget, self.callbackExtraData, self.feeData, self.caller
        );
        self.axiomVm.prankCallback(args);
        results = args.axiomResults;
    }

    /// @dev Returns results from a callback to Axiom, without pranking the fulfillment
    /// @param self The query to peek results for
    /// @return results The results of the query
    function peekResults(Query memory self) public returns (bytes32[] memory results) {
        FulfillCallbackArgs memory args = self.axiomVm.fulfillCallbackArgs(
            self.querySchema, self.input, self.callbackTarget, self.callbackExtraData, self.feeData, self.caller
        );
        results = args.axiomResults;
    }
}

/// @title AxiomVm
/// @dev A contract that provides cheatcodes for testing the AxiomV2Query contract
contract AxiomVm is Test {
    /// @dev Path to the Axiom CLI
    string CLI_PATH;

    /// @dev Command to run node scripts
    string NODE_PATH;

    /// @dev The URL or alias of the JSON RPC provider
    string urlOrAlias;

    address public axiomV2QueryAddress;
    mapping(bytes32 => string) compiledStrings;

    constructor(address _axiomV2QueryAddress, string memory _urlOrAlias) {
        axiomV2QueryAddress = _axiomV2QueryAddress;
        urlOrAlias = _urlOrAlias;

        string[] memory checkNpm = new string[](3);
        checkNpm[0] = "sh";
        checkNpm[1] = "-c";
        checkNpm[2] = "command -v npm >/dev/null 2>&1 && echo 1 || echo 0";
        bytes memory npmOutput = vm.ffi(checkNpm);
        require(_parseBoolean(string(npmOutput)), "NPM is required to run tests. Please install NPM and try again ");
        NODE_PATH = "node";

        string[] memory getDirectory = new string[](3);
        getDirectory[0] = "sh";
        getDirectory[1] = "-c";
        getDirectory[2] = "find . -name axiom-std-marker -exec dirname {} \\;";
        bytes memory directory = vm.ffi(getDirectory);

        string[] memory bunInstall = new string[](3);
        bunInstall[0] = "sh";
        bunInstall[1] = "-c";
        bunInstall[2] = string(abi.encodePacked("cd ", string(directory), " && npm install 2>/dev/null"));
        vm.ffi(bunInstall);

        string[] memory cliPathFind = new string[](4);
        cliPathFind[0] = "find";
        cliPathFind[1] = ".";
        cliPathFind[2] = "-name";
        cliPathFind[3] = "axiom-std-cli-build.js";
        bytes memory path = vm.ffi(cliPathFind);
        require(path.length > 0, "Axiom CLI not found.");
        CLI_PATH = string(path);

        string[] memory checkCli = new string[](3);
        checkCli[0] = "sh";
        checkCli[1] = "-c";
        checkCli[2] = string(abi.encodePacked("shasum -a 256 ", CLI_PATH, " | awk '{print $1}'"));
        bytes memory sha = vm.ffi(checkCli);
        require(
            keccak256(abi.encodePacked(sha)) == keccak256(abi.encodePacked(AxiomCli.CLI_SHASUM)),
            "Wrong CLI shasum. Make sure that there are no conflicting axiom-vm-cli.bin files in your folder."
        );

        string[] memory checkAxiomInputStruct = new string[](3);
        checkAxiomInputStruct[0] = "sh";
        checkAxiomInputStruct[1] = "-c";
        checkAxiomInputStruct[2] =
            "grep -rl \"AxiomInput\\\"\" . --include \\*.json >/dev/null 2>&1 && echo 1 || echo 0";
        bytes memory axiomInputStruct = vm.ffi(checkAxiomInputStruct);
        require(
            _parseBoolean(string(axiomInputStruct)),
            "AxiomInput struct not found. Make sure that your circuit input struct is named AxiomInput in your test file."
        );
    }

    /**
     * @dev Logs FFI logs and reverts if stderr is not empty
     * @param phase a string indicating the phase of circuit processing, one of `Compile` or `Prove`
     * @param logs any logs from ffi to log
     * @param errors any errors from ffi to log
     * @param message the revert message
     */
    function logOutput(string memory phase, string memory logs, string memory errors, string memory message)
        public
        view
    {
        if (bytes(logs).length > 0) {
            console.log(string.concat(phase, " - Circuit stdout:"));
            console.log(logs);
        }
        if (bytes(errors).length > 0) {
            console.log(string.concat(phase, " - Circuit stderr:"));
            console.log(errors);
            revert(message);
        }
    }

    /**
     * @dev Compiles a circuit using the Axiom CLI via FFI
     * @param _circuitPath path to the circuit file
     * @return querySchema
     */
    function readCircuit(string memory _circuitPath) public returns (bytes32 querySchema) {
        string[] memory cli = new string[](5);
        cli[0] = NODE_PATH;
        cli[1] = CLI_PATH;
        cli[2] = "readCircuit";
        cli[3] = _circuitPath;
        cli[4] = vm.rpcUrl(urlOrAlias);
        bytes memory axiomOutput = vm.ffi(cli);
        (string memory logs, string memory errors, string memory build) =
            abi.decode(axiomOutput, (string, string, string));
        logOutput("Compile", logs, errors, "Circuit compilation failed");
        querySchema = bytes32(vm.parseJson(build, ".querySchema"));
        compiledStrings[querySchema] = build;
    }

    /**
     * @dev Compiles a circuit using the Axiom CLI via FFI
     * @param _circuitPath path to the circuit file
     * @param suffix the suffix to append to the query schema
     * @return querySchema
     */
    function readCircuit(string memory _circuitPath, string memory suffix) public returns (bytes32 querySchema) {
        string[] memory cli = new string[](7);
        cli[0] = NODE_PATH;
        cli[1] = CLI_PATH;
        cli[2] = "readCircuit";
        cli[3] = _circuitPath;
        cli[4] = vm.rpcUrl(urlOrAlias);
        cli[5] = "--override-query-schema";
        cli[6] = suffix;
        bytes memory axiomOutput = vm.ffi(cli);
        (string memory logs, string memory errors, string memory build) =
            abi.decode(axiomOutput, (string, string, string));
        logOutput("Compile", logs, errors, "Circuit compilation failed");
        querySchema = bytes32(vm.parseJson(build, ".querySchema"));
        compiledStrings[querySchema] = build;
    }

    /**
     * @dev Generates args for the sendQuery function
     * @param querySchema the query schema
     * @param input path to the input file
     * @param callbackTarget the callback contract address
     * @param callbackExtraData extra data to be passed to the callback contract
     * @param feeData the fee data
     * @return args the sendQuery args
     * @return queryString the query string
     */
    function sendQueryArgs(
        bytes32 querySchema,
        bytes memory input,
        address callbackTarget,
        bytes memory callbackExtraData,
        IAxiomV2Query.AxiomV2FeeData memory feeData
    ) public returns (QueryArgs memory args, string memory queryString) {
        queryString = _run(querySchema, input, callbackTarget, callbackExtraData, feeData);
        args = parseQueryArgs(queryString);
    }

    /**
     * @dev Generates args for the sendQuery function with defaults for `callbackExtraData` and `feeData`
     * @param querySchema the query schema
     * @param input path to the input file
     * @param callbackTarget the callback contract address
     * @return args the sendQuery args
     * @return queryString the query string
     */
    function sendQueryArgs(bytes32 querySchema, bytes memory input, address callbackTarget)
        public
        returns (QueryArgs memory args, string memory queryString)
    {
        uint64 maxFeePerGas = 25 gwei;
        if (block.chainid == BASE_CHAIN_ID || block.chainid == BASE_SEPOLIA_CHAIN_ID) {
            maxFeePerGas = 0.75 gwei;
        }
        IAxiomV2Query.AxiomV2FeeData memory feeData = IAxiomV2Query.AxiomV2FeeData({
            maxFeePerGas: maxFeePerGas,
            callbackGasLimit: 1_000_000,
            overrideAxiomQueryFee: 0
        });
        bytes memory callbackExtraData = bytes("");
        return sendQueryArgs(querySchema, input, callbackTarget, callbackExtraData, feeData);
    }

    /**
     * @dev Generates arguments for the fulfillCallback function
     * @param querySchema the query schema
     * @param _queryString the query string
     * @param callbackTarget the callback contract address
     * @param feeData the fee data
     * @param caller the address of the caller
     * @return args the fulfillCallback args
     */
    function fulfillCallbackArgs(
        bytes32 querySchema,
        string memory _queryString,
        address callbackTarget,
        IAxiomV2Query.AxiomV2FeeData memory feeData,
        address caller
    ) public view returns (FulfillCallbackArgs memory args) {
        uint64 sourceChainId = uint64(block.chainid);

        QueryArgs memory _query = parseQueryArgs(_queryString);
        args = FulfillCallbackArgs({
            sourceChainId: sourceChainId,
            caller: caller,
            querySchema: abi.decode(vm.parseJson(compiledStrings[querySchema], ".querySchema"), (bytes32)),
            queryId: vm.parseJsonUint(_queryString, ".queryId"),
            axiomResults: abi.decode(vm.parseJson(_queryString, ".computeResults"), (bytes32[])),
            callbackExtraData: _query.callback.extraData,
            gasLimit: feeData.callbackGasLimit,
            callbackTarget: callbackTarget
        });
    }

    /**
     * @dev Generates arguments for the fulfillCallback function
     * @param querySchema the query schema
     * @param input path to the input file
     * @param callbackTarget the callback contract address
     * @param callbackExtraData extra data to be passed to the callback contract
     * @param feeData the fee data
     * @param caller the address of the caller
     * @return args the fulfillCallback args
     */
    function fulfillCallbackArgs(
        bytes32 querySchema,
        bytes memory input,
        address callbackTarget,
        bytes memory callbackExtraData,
        IAxiomV2Query.AxiomV2FeeData memory feeData,
        address caller
    ) public returns (FulfillCallbackArgs memory args) {
        string memory queryString = _run(querySchema, input, callbackTarget, callbackExtraData, feeData);
        return fulfillCallbackArgs(querySchema, queryString, callbackTarget, feeData, caller);
    }

    /**
     * @dev Fulfills the callback for an onchain query
     * @param args the arguments for the callback
     */
    function prankCallback(FulfillCallbackArgs memory args) public {
        vm.prank(axiomV2QueryAddress);
        IAxiomV2Client(args.callbackTarget).axiomV2Callback{ gas: args.gasLimit }(
            args.sourceChainId, args.caller, args.querySchema, args.queryId, args.axiomResults, args.callbackExtraData
        );
    }

    /**
     * @dev Generates the fulfill callback args and and fulfills the onchain query
     * @param querySchema the query schema
     * @param input path to the input file
     * @param callbackTarget the callback contract address
     * @param callbackExtraData extra data to be passed to the callback contract
     * @param feeData the fee data
     * @param caller the address of the caller
     */
    function prankCallback(
        bytes32 querySchema,
        bytes memory input,
        address callbackTarget,
        bytes memory callbackExtraData,
        IAxiomV2Query.AxiomV2FeeData memory feeData,
        address caller
    ) public {
        FulfillCallbackArgs memory args =
            fulfillCallbackArgs(querySchema, input, callbackTarget, callbackExtraData, feeData, caller);
        prankCallback(args);
    }

    /**
     * @dev Fulfills the callback for an offchain query
     * @param args the arguments for the callback
     */
    function prankOffchainCallback(FulfillCallbackArgs memory args) public {
        vm.prank(axiomV2QueryAddress);
        IAxiomV2Client(args.callbackTarget).axiomV2OffchainCallback{ gas: args.gasLimit }(
            args.sourceChainId, args.caller, args.querySchema, args.queryId, args.axiomResults, args.callbackExtraData
        );
    }

    /**
     * @dev Generates the fulfill callback args and fulfills the offchain query
     * @param querySchema the query schema
     * @param input path to the input file
     * @param callbackTarget the callback contract address
     * @param callbackExtraData extra data to be passed to the callback contract
     * @param feeData the fee data
     * @param caller the address of the caller
     */
    function prankOffchainCallback(
        bytes32 querySchema,
        bytes memory input,
        address callbackTarget,
        bytes memory callbackExtraData,
        IAxiomV2Query.AxiomV2FeeData memory feeData,
        address caller
    ) public {
        FulfillCallbackArgs memory args =
            fulfillCallbackArgs(querySchema, input, callbackTarget, callbackExtraData, feeData, caller);
        prankOffchainCallback(args);
    }

    /**
     * @dev Generates Query and sends a query to the AxiomV2Query contract.
     * @param querySchema the query schema
     * @param input path to the input file
     * @param callbackTarget the callback contract address
     * @return queryString the query string
     */
    function getArgsAndSendQuery(bytes32 querySchema, bytes memory input, address callbackTarget)
        public
        returns (string memory queryString)
    {
        (QueryArgs memory args, string memory _queryString) = sendQueryArgs(querySchema, input, callbackTarget);
        queryString = _queryString;
        vm.prank(msg.sender);
        IAxiomV2Query(axiomV2QueryAddress).sendQuery{ value: args.value }(
            args.sourceChainId,
            args.dataQueryHash,
            args.computeQuery,
            args.callback,
            args.feeData,
            args.userSalt,
            args.refundee,
            args.dataQuery
        );
    }

    /**
     * @dev Generates Query and sends a query to the AxiomV2Query contract.
     * @param querySchema the query schema
     * @param input path to the input file
     * @param callbackTarget the callback contract address
     * @param callbackExtraData extra data to be passed to the callback contract
     * @param feeData the fee data
     * @param caller the address of the caller
     * @return queryString the query string
     */
    function getArgsAndSendQuery(
        bytes32 querySchema,
        bytes memory input,
        address callbackTarget,
        bytes memory callbackExtraData,
        IAxiomV2Query.AxiomV2FeeData memory feeData,
        address caller
    ) public returns (string memory queryString) {
        (QueryArgs memory args, string memory _queryString) =
            sendQueryArgs(querySchema, input, callbackTarget, callbackExtraData, feeData);
        queryString = _queryString;
        vm.prank(caller);
        IAxiomV2Query(axiomV2QueryAddress).sendQuery{ value: args.value }(
            args.sourceChainId,
            args.dataQueryHash,
            args.computeQuery,
            args.callback,
            args.feeData,
            args.userSalt,
            args.refundee,
            args.dataQuery
        );
    }

    function _parseBoolean(string memory value) internal pure returns (bool) {
        return vm.parseUint(value) == 1;
    }

    function _run(
        bytes32 querySchema,
        bytes memory input,
        address callbackTarget,
        bytes memory callbackExtraData,
        IAxiomV2Query.AxiomV2FeeData memory feeData
    ) internal returns (string memory output) {
        require(bytes(compiledStrings[querySchema]).length > 0, "Circuit has not been compiled. Run `compile` first.");
        string[] memory cli = new string[](13);
        cli[0] = NODE_PATH;
        cli[1] = CLI_PATH;
        cli[2] = "prove";
        cli[3] = compiledStrings[querySchema];
        cli[4] = vm.toString(input);
        cli[5] = vm.rpcUrl(urlOrAlias);
        cli[6] = vm.toString(block.chainid);
        cli[7] = vm.toString(callbackTarget);
        cli[8] = vm.toString(callbackExtraData);
        cli[9] = vm.toString(msg.sender);
        cli[10] = vm.toString(feeData.maxFeePerGas);
        cli[11] = vm.toString(feeData.callbackGasLimit);
        cli[12] = vm.toString(msg.sender);

        bytes memory axiomOutput = vm.ffi(cli);
        (string memory logs, string memory errors, string memory build) =
            abi.decode(axiomOutput, (string, string, string));
        logOutput("Prove", logs, errors, "Circuit proving failed");
        output = build;
    }

    /**
     * @dev Parses AxiomQuery from the CLI calldata bytes output
     * @param _queryString the string output from the CLI
     * @return args the AxiomQuery
     */
    function parseQueryArgs(string memory _queryString) public pure returns (QueryArgs memory args) {
        args.sourceChainId = uint64(vm.parseJsonUint(_queryString, ".args.sourceChainId"));
        args.dataQueryHash = vm.parseJsonBytes32(_queryString, ".args.dataQueryHash");

        args.computeQuery.k = uint8(vm.parseJsonUint(_queryString, ".args.computeQuery.k"));
        args.computeQuery.resultLen = uint16(vm.parseJsonUint(_queryString, ".args.computeQuery.resultLen"));
        args.computeQuery.vkey = vm.parseJsonBytes32Array(_queryString, ".args.computeQuery.vkey");
        args.computeQuery.computeProof = vm.parseJsonBytes(_queryString, ".args.computeQuery.computeProof");

        args.callback.target = vm.parseJsonAddress(_queryString, ".args.callback.target");
        args.callback.extraData = vm.parseJsonBytes(_queryString, ".args.callback.extraData");

        args.feeData.maxFeePerGas = uint64(vm.parseJsonUint(_queryString, ".args.feeData.maxFeePerGas"));
        args.feeData.callbackGasLimit = uint32(vm.parseJsonUint(_queryString, ".args.feeData.callbackGasLimit"));
        args.feeData.overrideAxiomQueryFee = vm.parseJsonUint(_queryString, ".args.feeData.overrideAxiomQueryFee");

        args.userSalt = vm.parseJsonBytes32(_queryString, ".args.userSalt");
        args.refundee = vm.parseJsonAddress(_queryString, ".args.refundee");
        args.dataQuery = vm.parseJsonBytes(_queryString, ".args.dataQuery");
        args.value = vm.parseJsonUint(_queryString, ".value");
    }
}
