// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {GasSnapshot} from "forge-gas-snapshot/GasSnapshot.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {TickMath} from "v4-core/src/libraries/TickMath.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {Deployers} from "v4-core/test/utils/Deployers.sol";
import {CurrencyLibrary, Currency} from "v4-core/src/types/Currency.sol";
import {HookTest} from "./utils/HookTest.sol";
import {HookExample} from "../src/generated/GeneratedContract.sol";
import {HookMiner} from "./utils/HookMiner.sol";

contract HookExampleTest is HookTest, Deployers, GasSnapshot {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;

    HookExample hook;
    PoolKey poolKey;
    PoolId poolId;

    function setUp() public {
        // creates the pool manager, test tokens, and other utility routers
        HookTest.initHookTestEnv();

        // Deploy the hook to an address with the correct flags
        uint160 flags = uint160(
            Hooks.BEFORE_SWAP_FLAG |
                Hooks.AFTER_SWAP_FLAG |
                Hooks.BEFORE_ADD_LIQUIDITY_FLAG |
                Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG
        );
        (address hookAddress, bytes32 salt) = HookMiner.find(
            address(this),
            flags,
            0,
            type(HookExample).creationCode,
            abi.encode(address(manager))
        );
        hook = new HookExample{salt: salt}(IPoolManager(address(manager)));
        require(
            address(hook) == hookAddress,
            "HookExampleTest: hook address mismatch"
        );

        // Create the pool
        poolKey = PoolKey(
            Currency.wrap(address(token0)),
            Currency.wrap(address(token1)),
            3000,
            60,
            IHooks(address(hook))
        );
        poolId = poolKey.toId();
        manager.initialize(poolKey, SQRT_RATIO_1_1, ZERO_BYTES);

        // Provide liquidity to the pool
        modifyPositionRouter.modifyPosition(
            poolKey,
            IPoolManager.ModifyPositionParams(-60, 60, 10 ether),
            ZERO_BYTES
        );
        modifyPositionRouter.modifyPosition(
            poolKey,
            IPoolManager.ModifyPositionParams(-120, 120, 10 ether),
            ZERO_BYTES
        );
        modifyPositionRouter.modifyPosition(
            poolKey,
            IPoolManager.ModifyPositionParams(
                TickMath.minUsableTick(60),
                TickMath.maxUsableTick(60),
                10 ether
            ),
            ZERO_BYTES
        );
    }

    function testHookFunctions() public {
        assertEq(hook.beforeSwapCount(poolId), 0);
        assertEq(hook.afterSwapCount(poolId), 0);

        // Perform a test swap
        int256 amount = 100;
        bool zeroForOne = true;
        swap(poolKey, amount, zeroForOne, ZERO_BYTES);

        assertEq(hook.beforeSwapCount(poolId), 1);
        assertEq(hook.afterSwapCount(poolId), 1);

        // Test liquidity addition
        modifyPositionRouter.modifyPosition(
            poolKey,
            IPoolManager.ModifyPositionParams(-30, 30, 5 ether),
            ZERO_BYTES
        );
        assertEq(hook.beforeAddLiquidityCount(poolId), 1);

        // Test liquidity removal
        modifyPositionRouter.modifyPosition(
            poolKey,
            IPoolManager.ModifyPositionParams(-30, 30, -5 ether),
            ZERO_BYTES
        );
        assertEq(hook.beforeRemoveLiquidityCount(poolId), 1);
    }
}
