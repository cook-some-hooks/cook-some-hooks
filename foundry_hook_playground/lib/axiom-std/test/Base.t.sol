// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../src/AxiomTest.sol";
import { AxiomV2Client } from "@axiom-crypto/v2-periphery/client/AxiomV2Client.sol";

contract MockClient is AxiomV2Client {
    /// @dev The chain ID of the chain whose data the callback is expected to be called from.
    uint64 public callbackSourceChainId;

    /// @dev The query schema of the query the client is expecting.
    bytes32 public immutable QUERY_SCHEMA;

    /// @dev Error returned if the `sourceChainId` does not match.
    error SourceChainIdDoesNotMatch();

    /// @dev Error returned if the `querySchema` does not match.
    error QuerySchemaDoesNotMatch();

    /// @notice Emitted after callback is made.
    /// @param  queryId The unique ID identifying the query.
    /// @param  axiomResults The results of the query.
    /// @param  extraData Additional data passed to the callback.
    event MockClientEvent(uint256 indexed queryId, bytes32[] axiomResults, bytes extraData);

    /// @notice Construct a new MockClient contract.
    /// @param  _axiomV2QueryAddress The address of the AxiomV2Query contract.
    /// @param  _callbackSourceChainId The ID of the chain the query reads from.
    /// @param  querySchema The query schema the client is expecting.
    constructor(address _axiomV2QueryAddress, uint64 _callbackSourceChainId, bytes32 querySchema)
        AxiomV2Client(_axiomV2QueryAddress)
    {
        callbackSourceChainId = _callbackSourceChainId;
        QUERY_SCHEMA = querySchema;
    }

    /// @inheritdoc AxiomV2Client
    function _validateAxiomV2Call(
        AxiomCallbackType callbackType,
        uint64 sourceChainId,
        address caller,
        bytes32 querySchema,
        uint256 queryId,
        bytes calldata extraData
    ) internal override {
        if (sourceChainId != callbackSourceChainId) {
            revert SourceChainIdDoesNotMatch();
        }

        if (querySchema != QUERY_SCHEMA) {
            revert QuerySchemaDoesNotMatch();
        }
    }

    /// @inheritdoc AxiomV2Client
    function _axiomV2Callback(
        uint64 sourceChainId,
        address caller,
        bytes32 querySchema,
        uint256 queryId,
        bytes32[] calldata axiomResults,
        bytes calldata extraData
    ) internal override {
        emit MockClientEvent(queryId, axiomResults, extraData);
    }
}

contract BaseArrayTest is AxiomTest {
    using Axiom for Query;

    struct AxiomInput {
        uint64[] blockNumbers;
        uint256[] slots;
        address _address;
    }

    AxiomInput public input;
    bytes32 public querySchema;

    MockClient public client;

    function setUp() public {
        _createSelectForkAndSetupAxiom("base", 13_500_000);

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
        client = new MockClient(axiomV2QueryAddress, BASE_CHAIN_ID, querySchema);
    }

    /// @dev Simple demonstration of testing an Axiom client contract using Axiom cheatcodes
    function test_base() public {
        // create a query into Axiom with default parameters
        Query memory q = query(querySchema, abi.encode(input), address(client));

        // send the query to Axiom
        q.send();

        // prank fulfillment of the query, returning the Axiom results
        bytes32[] memory results = q.prankFulfill();
    }
}
