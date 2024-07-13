// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { FulfillCallbackArgs, QueryArgs } from "../src/AxiomVm.sol";
import { AxiomTest } from "../src/AxiomTest.sol";

import { IAxiomV2Query } from "@axiom-crypto/v2-periphery/interfaces/query/IAxiomV2Query.sol";

import { AverageBalance } from "./example/AverageBalance.sol";

contract AxiomStdTest is AxiomTest {
    struct Input {
        uint256 blockNumber;
        uint256 _address;
    }

    AverageBalance public averageBalance;
    Input public defaultInput;
    bytes32 public querySchema;

    bytes public callbackExtraData;
    IAxiomV2Query.AxiomV2FeeData public feeData;

    function setUp() public {
        _createSelectForkAndSetupAxiom("sepolia", 5_103_100);

        defaultInput =
            Input({ blockNumber: 4_205_938, _address: uint256(uint160(0x8018fe32fCFd3d166E8b4c4E37105318A84BA11b)) });
        querySchema = axiomVm.readCircuit("test/circuit/average.circuit.ts");
        averageBalance = new AverageBalance(axiomV2QueryAddress, uint64(block.chainid), querySchema);

        callbackExtraData = bytes("");
        feeData = IAxiomV2Query.AxiomV2FeeData({
            maxFeePerGas: 25 gwei,
            callbackGasLimit: 1_000_000,
            overrideAxiomQueryFee: 0
        });
    }

    function test_SendQuery() public {
        axiomVm.getArgsAndSendQuery(querySchema, abi.encode(defaultInput), address(averageBalance));
    }

    function test_SendQueryWithArgs() public {
        (QueryArgs memory args,) = axiomVm.sendQueryArgs(
            querySchema, abi.encode(defaultInput), address(averageBalance), callbackExtraData, feeData
        );
        axiomV2Query.sendQuery{ value: args.value }(
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

    function test_callback() public {
        axiomVm.prankCallback(
            querySchema, abi.encode(defaultInput), address(averageBalance), callbackExtraData, feeData, msg.sender
        );
    }

    function test_callbackWithArgs() public {
        FulfillCallbackArgs memory args = axiomVm.fulfillCallbackArgs(
            querySchema, abi.encode(defaultInput), address(averageBalance), callbackExtraData, feeData, msg.sender
        );
        axiomVm.prankCallback(args);
    }

    function test_offchainCallback() public {
        axiomVm.prankOffchainCallback(
            querySchema, abi.encode(defaultInput), address(averageBalance), callbackExtraData, feeData, msg.sender
        );
    }

    function test_offchainCallbackWithArgs() public {
        FulfillCallbackArgs memory args = axiomVm.fulfillCallbackArgs(
            querySchema, abi.encode(defaultInput), address(averageBalance), callbackExtraData, feeData, msg.sender
        );
        axiomVm.prankOffchainCallback(args);
    }

    function test_mockQuerySchema() public {
        bytes32 mockQuerySchema = axiomVm.readCircuit("test/circuit/average.circuit.ts", "aaaa");
        assertEq(mockQuerySchema, bytes32(0xdeadbeefaaaa0000000000000000000000000000000000000000000000000000));
    }

    // function test_compileNotMocked() public {
    //     axiomVm.setMock(false);
    //     bytes32 querySchema = axiomVm.readCircuit("test/circuit/average.circuit.ts", inputPath);
    //     require(
    //         querySchema != bytes32(0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef), "compile failed"
    //     );
    // }
}
