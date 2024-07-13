## axiom-std

This repo contains Foundry testing utilities for applications integrating Axiom V2. To learn more about how to integrate Axiom into your application, see the [developer docs](https://docs.axiom.xyz). For the complete Axiom V2 smart contract code, see the smart contract repo [here](https://github.com/axiom-crypto/axiom-v2-contracts).

## Installation

To use smart contracts or test utilities from this repo in your **external Foundry project**, run:

```bash
forge install axiom-crypto/axiom-std
```

Add `@axiom-crypto/axiom-std/=lib/axiom-std/src` in `remappings.txt`.

## Usage

Once installed, you can use the contracts in this library by importing them. All interfaces are available under `@axiom-crypto/v2-periphery/interfaces`. For security, you should use the installed code **as-is**; we do not recommend copy-pasting from other sources or modifying yourself.

See our [quickstart repo](https://github.com/axiom-crypto/axiom-quickstart) for a minimal example using both `AxiomV2Client` and `AxiomTest`.

#### Implementing a client for Axiom V2

To integrate your application with Axiom, you should inherit from `AxiomV2Client` in your contract:

```solidity
pragma solidity ^0.8.0;

import { AxiomV2Client } from "@axiom-crypto/v2-periphery/client/AxiomV2Client.sol";

contract AverageBalance is AxiomV2Client {
    bytes32 immutable QUERY_SCHEMA;
    uint64 immutable SOURCE_CHAIN_ID;

    constructor(address _axiomV2QueryAddress, uint64 _callbackSourceChainId, bytes32 _querySchema)
        AxiomV2Client(_axiomV2QueryAddress)
    {
        QUERY_SCHEMA = _querySchema;
        SOURCE_CHAIN_ID = _callbackSourceChainId;
    }

    function _validateAxiomV2Call(
        AxiomCallbackType, // callbackType,
        uint64 sourceChainId,
        address, // caller,
        bytes32 querySchema,
        uint256, // queryId,
        bytes calldata // extraData
    ) internal view override {
        require(sourceChainId == SOURCE_CHAIN_ID, "Source chain ID does not match");
        require(querySchema == QUERY_SCHEMA, "Invalid query schema");
    }

    function _axiomV2Callback(
        uint64, // sourceChainId,
        address, // caller,
        bytes32, // querySchema,
        uint256, // queryId,
        bytes32[] calldata axiomResults,
        bytes calldata // extraData
    ) internal override {
        // <Implement your application logic with axiomResults>
    }
}
```

#### Testing with `AxiomTest` Foundry tests

To test your code, you can use `AxiomTest.sol` in place of `forge-std/Test.sol`. This extension to the standard Foundry test library provides Axiom-specific cheatcodes accessible to your Foundry tests. Using these cheatcodes requires Node to be installed.

Once you have written an Axiom circuit, you can test it against your client smart contract by specifying your circuit input struct `AxiomInput`, constructing a `Query`, and then using the `Query.send()` and `Query.prankFulfill()` cheatcodes:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@axiom-crypto/axiom-std/AxiomTest.sol";

import { AverageBalance } from "./example/AverageBalance.sol";

contract AverageBalanceTest is AxiomTest {
    using Axiom for Query;

    struct AxiomInput {
        uint64 blockNumber;
        address address;
    }

    AverageBalance public averageBalance;
    AxiomInput public input;
    bytes32 public querySchema;

    function setUp() public {
        _createSelectForkAndSetupAxiom("sepolia", 5_103_100);

        input =
            AxiomInput({ blockNumber: 4_205_938, _address: address(0x8018fe32fCFd3d166E8b4c4E37105318A84BA11b) });
        querySchema = axiomVm.readCircuit("test/circuit/average.circuit.ts");
        averageBalance = new AverageBalance(axiomV2QueryAddress, uint64(block.chainid), querySchema);
    }

    function test_simple_example() public {
        // create a query into Axiom with default parameters
        Query memory q = query(querySchema, abi.encode(input), address(averageBalance));

        // send the query to Axiom
        q.send();

        // prank fulfillment of the query, returning the Axiom results
        bytes32[] memory results = q.prankFulfill();

        // parse Axiom results and verify length is as expected
        assertEq(results.length, 3);
        uint256 blockNumber = uint256(results[0]);
        address addr = address(uint160(uint256(results[1])));
        uint256 avg = uint256(results[2]);

        // verify the average balance recorded in AverageBalance is as expected
        assertEq(avg, averageBalance.provenAverageBalances(blockNumber, addr));
    }
}

```

## Running this repo for development

This repo contains both Foundry and Javascript packages. To install, run:

```bash
forge install
npm install     # or `pnpm install` or `yarn install`
```

The `build` folder contains a bundled version of the Typescript portions of axiom-std for convenience. During development, if the Typescript files in `cli` are changed, run

```bash
npm build      # or `pnpm build` or `yarn build`
```

prior to committing to update the file `build/axiom-std-cli-build.js`.
