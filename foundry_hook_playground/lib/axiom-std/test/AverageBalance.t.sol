// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../src/AxiomTest.sol";
import "forge-std/console.sol";

import { AverageBalance } from "./example/AverageBalance.sol";

contract AverageBalanceTest is AxiomTest {
    using Axiom for Query;

    event AverageBalanceStored(uint256 blockNumber, address _address, uint256 averageBalance);

    struct AxiomInput {
        uint64 blockNumber;
        address _address;
    }

    AverageBalance public averageBalance;
    AxiomInput public input;
    bytes32 public querySchema;

    function setUp() public {
        _createSelectForkAndSetupAxiom("sepolia", 5_103_100);

        input = AxiomInput({ blockNumber: 4_205_938, _address: address(0x8018fe32FCFd3d166e8B4c4e37105318a84ba11d) });

        querySchema = axiomVm.readCircuit("test/circuit/average.circuit.ts", "aaaa");
        averageBalance = new AverageBalance(axiomV2QueryAddress, uint64(block.chainid), querySchema);
    }

    /// @dev Simple demonstration of testing an Axiom client contract using Axiom cheatcodes
    function test_simple_example() public {
        // create a query into Axiom with default parameters
        Query memory q = query(querySchema, abi.encode(input), address(averageBalance));

        // send the query to Axiom
        q.send();

        // prank fulfillment of the query, returning the Axiom results
        vm.expectEmit();
        emit AverageBalanceStored(input.blockNumber, input._address, 0);
        bytes32[] memory results = q.prankFulfill();

        // parse Axiom results and verify length is as expected
        assertEq(results.length, 3);
        uint256 blockNumber = uint256(results[0]);
        address addr = address(uint160(uint256(results[1])));
        uint256 avg = uint256(results[2]);

        // verify the average balance recorded in AverageBalance is as expected
        assertEq(avg, averageBalance.provenAverageBalances(blockNumber, addr));
    }

    /// @dev Testing an Axiom client contract using Axiom cheatcodes with advanced parameters
    function test_advanced_example() public {
        // set up optional parameters for the query callback and fees
        bytes memory callbackExtraData = bytes("deadbeef00000000000000000000000000000000000000000000000000000000");
        IAxiomV2Query.AxiomV2FeeData memory feeData = IAxiomV2Query.AxiomV2FeeData({
            maxFeePerGas: 35 gwei,
            callbackGasLimit: 1_000_000,
            overrideAxiomQueryFee: 0
        });

        // create a query into Axiom with custom `callbackExtraData`, `feeData`, and `caller`
        address caller = address(123);
        vm.deal(caller, 1 ether);
        Query memory q =
            query(querySchema, abi.encode(input), address(averageBalance), callbackExtraData, feeData, caller);

        // send the query to Axiom
        vm.expectEmit(false, false, false, false);
        emit QueryFeeInfoRecorded(0, address(0), 0, 0, 0, 0);
        vm.expectEmit(true, false, false, false);
        emit QueryInitiatedOnchain(caller, bytes32(0), 0, bytes32(0), caller, address(averageBalance), hex"");
        q.send();

        // peek at the callback results without pranking fulfillment
        bytes32[] memory peekedResults = q.peekResults();

        // prank fulfillment of the query, returning the Axiom results
        vm.expectEmit();
        emit AverageBalanceStored(input.blockNumber, input._address, 0);
        bytes32[] memory results = q.prankFulfill();

        // check that peekedResults and results are the same
        assertEq(peekedResults.length, results.length);
        for (uint256 i = 0; i < results.length; i++) {
            assertEq(peekedResults[i], results[i]);
        }

        // parse Axiom results and verify length is as expected
        assertEq(results.length, 3);
        uint256 blockNumber = uint256(results[0]);
        address addr = address(uint160(uint256(results[1])));
        uint256 avg = uint256(results[2]);

        // verify the average balance recorded in AverageBalance is as expected
        assertEq(avg, averageBalance.provenAverageBalances(blockNumber, addr));
    }
}
