// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "forge-std/console.sol";

// 🧩 MODULES
import { AxiomVm, Query, Axiom, QueryArgs, FulfillCallbackArgs } from "./AxiomVm.sol";
import { IAxiomV2Core } from "@axiom-crypto/v2-periphery/interfaces/core/IAxiomV2Core.sol";
import { IAxiomV2Query } from "@axiom-crypto/v2-periphery/interfaces/query/IAxiomV2Query.sol";
import { IAxiomV2Client } from "@axiom-crypto/v2-periphery/interfaces/client/IAxiomV2Client.sol";
import {
    AxiomV2Addresses,
    MAINNET_CHAIN_ID,
    SEPOLIA_CHAIN_ID,
    BASE_SEPOLIA_CHAIN_ID,
    BASE_CHAIN_ID
} from "./AxiomV2Addresses.sol";

// ⭐️ TEST
/// @title AxiomTest
/// @dev An extension to the Foundry test contract that sets up an Axiom environment and provides
///      cheatcodes for testing Axiom client contracts
abstract contract AxiomTest is Test {
    /// @dev The address of the AxiomV2Core contract
    address public axiomV2CoreAddress;

    /// @dev The address of the AxiomV2Query contract
    address public axiomV2QueryAddress;

    /// @dev The AxiomV2Core contract
    IAxiomV2Core public axiomV2Core;

    /// @dev The AxiomV2Query contract
    IAxiomV2Query public axiomV2Query;

    /// @dev The AxiomVm contract
    AxiomVm axiomVm;

    /// @dev Dummy address for AxiomV2Core used when Axiom is not yet deployed on a chain
    address public constant DUMMY_AXIOM_V2_CORE_ADDRESS = 0xDeaDBEefDeaDBEEfdEadBEEFdEaDbEefCCcccccc;

    /// @dev Dummy address for AxiomV2Query used when Axiom is not yet deployed on a chain
    address public constant DUMMY_AXIOM_V2_QUERY_ADDRESS = 0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF;

    /// @dev Event emitted when a query is initiated on-chain
    event QueryInitiatedOnchain(
        address indexed caller,
        bytes32 indexed queryHash,
        uint256 indexed queryId,
        bytes32 userSalt,
        address refundee,
        address target,
        bytes extraData
    );

    /// @dev Event emitted when a query is initiated on-chain
    event QueryFeeInfoRecorded(
        uint256 indexed queryId,
        address indexed payor,
        uint32 deadlineBlockNumber,
        uint64 maxFeePerGas,
        uint32 callbackGasLimit,
        uint256 amount
    );

    /// @dev Create a forked test environment from the latest block and set up Axiom contracts
    /// @param urlOrAlias The URL or alias of the fork to create
    function _createSelectForkAndSetupAxiom(
        string memory urlOrAlias
    ) internal {
        vm.createSelectFork(urlOrAlias);
        _setupAxiomFromFork(block.number);

        axiomVm = new AxiomVm(axiomV2QueryAddress, urlOrAlias);
    }

    /// @dev Create a forked test environment from a specified block and set up Axiom contracts
    /// @param urlOrAlias The URL or alias of the fork to create
    /// @param forkBlock The block number to fork from
    function _createSelectForkAndSetupAxiom(string memory urlOrAlias, uint256 forkBlock) internal {
        vm.createSelectFork(urlOrAlias, forkBlock);
        _setupAxiomFromFork(forkBlock);

        axiomVm = new AxiomVm(axiomV2QueryAddress, urlOrAlias);
    }

    /// @dev Set up Axiom contracts
    /// @param forkBlock The block number that the fork was created from
    function _setupAxiomFromFork(
        uint256 forkBlock
    ) private {
        uint64 chainId = uint64(block.chainid);

        if (chainId == MAINNET_CHAIN_ID || chainId == BASE_CHAIN_ID) {
            axiomV2CoreAddress = AxiomV2Addresses.axiomV2CoreAddress(chainId);
            axiomV2QueryAddress = AxiomV2Addresses.axiomV2QueryAddress(chainId);

            require(
                forkBlock >= AxiomV2Addresses.axiomV2CoreDeployBlock(chainId),
                "AxiomV2Core not yet deployed at forkBlock"
            );
            require(
                forkBlock >= AxiomV2Addresses.axiomV2QueryDeployBlock(chainId),
                "AxiomV2Query not yet deployed at forkBlock"
            );
            axiomV2Core = IAxiomV2Core(axiomV2CoreAddress);
            axiomV2Query = IAxiomV2Query(axiomV2QueryAddress);
        } else if (chainId == SEPOLIA_CHAIN_ID || chainId == BASE_SEPOLIA_CHAIN_ID) {
            axiomV2CoreAddress = AxiomV2Addresses.axiomV2CoreMockAddress(chainId);
            axiomV2QueryAddress = AxiomV2Addresses.axiomV2QueryMockAddress(chainId);

            require(
                forkBlock >= AxiomV2Addresses.axiomV2CoreMockDeployBlock(chainId),
                "AxiomV2CoreMock not yet deployed at forkBlock"
            );
            require(
                forkBlock >= AxiomV2Addresses.axiomV2QueryMockDeployBlock(chainId),
                "AxiomV2QueryMock not yet deployed at forkBlock"
            );
            axiomV2Core = IAxiomV2Core(axiomV2CoreAddress);
            axiomV2Query = IAxiomV2Query(axiomV2QueryAddress);
        } else {
            axiomV2CoreAddress = DUMMY_AXIOM_V2_CORE_ADDRESS;
            axiomV2QueryAddress = DUMMY_AXIOM_V2_QUERY_ADDRESS;
        }

        vm.makePersistent(axiomV2CoreAddress);
        vm.makePersistent(axiomV2QueryAddress);
    }

    /// @dev Create a query into Axiom with default parameters
    /// @param _querySchema The query schema to use
    /// @param input The input data for the query
    /// @param callbackTarget The address of the contract to send a callback to
    function query(bytes32 _querySchema, bytes memory input, address callbackTarget)
        internal
        view
        returns (Query memory)
    {
        uint64 maxFeePerGas = 25 gwei;
        if (block.chainid == BASE_CHAIN_ID || block.chainid == BASE_SEPOLIA_CHAIN_ID) {
            maxFeePerGas = 0.75 gwei;
        }
        return query(
            _querySchema,
            input,
            callbackTarget,
            bytes(""),
            IAxiomV2Query.AxiomV2FeeData({
                maxFeePerGas: maxFeePerGas,
                callbackGasLimit: 1_000_000,
                overrideAxiomQueryFee: 0
            }),
            msg.sender
        );
    }

    /// @dev Create a query into Axiom with advanced parameters
    /// @param _querySchema The query schema to use
    /// @param input The input data for the query
    /// @param callbackTarget The address of the contract to send a callback to
    /// @param callbackExtraData Extra data to include in the callback
    /// @param feeData The fee data for the query
    /// @param caller the address of the caller
    function query(
        bytes32 _querySchema,
        bytes memory input,
        address callbackTarget,
        bytes memory callbackExtraData,
        IAxiomV2Query.AxiomV2FeeData memory feeData,
        address caller
    ) internal view returns (Query memory) {
        return Query({
            querySchema: _querySchema,
            input: input,
            callbackTarget: callbackTarget,
            callbackExtraData: callbackExtraData,
            feeData: feeData,
            axiomVm: axiomVm,
            outputString: "",
            caller: caller
        });
    }
}
