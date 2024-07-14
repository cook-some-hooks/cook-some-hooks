// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../src/AxiomTest.sol";

contract ArrayTest is AxiomTest {
    using Axiom for Query;

    struct AxiomInput {
        uint64[] blockNumbers;
        uint256[] slots;
        address _address;
    }

    AxiomInput public input;
    bytes32 public querySchema;

    function setUp() public {
        _createSelectForkAndSetupAxiom("sepolia", 5_103_100);

        uint64[] memory blockNumbers = new uint64[](3);
        uint256[] memory slots = new uint256[](3);
        for (uint256 i = 0; i < 3; i++) {
            blockNumbers[i] = 4_205_938;
            slots[i] = i;
        }
        input = AxiomInput({
            blockNumbers: blockNumbers,
            slots: slots,
            _address: address(0x8018fe32fCFd3d166E8b4c4E37105318A84BA11b)
        });

        querySchema = axiomVm.readCircuit("test/circuit/array.circuit.ts");
    }

    /// @dev Simple demonstration of testing an Axiom client contract using Axiom cheatcodes
    function test_simple_example() public {
        // create a query into Axiom with default parameters
        Query memory q = query(querySchema, abi.encode(input), address(0x8018fe32fCFd3d166E8b4c4E37105318A84BA11b));

        // send the query to Axiom
        q.send();
    }
}
