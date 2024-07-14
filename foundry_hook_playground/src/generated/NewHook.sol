// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@uniswap/v4-core/src/types/PoolId.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {BaseHook} from "v4-periphery/BaseHook.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol"; // Added import for Hooks

contract SwapCounterHook is BaseHook {
    using PoolIdLibrary for PoolKey;

    mapping(PoolId => uint256) public afterSwapCount;

    constructor(IPoolManager _poolManager) BaseHook(_poolManager) {}

    // Function to satisfy BaseHook's abstract function requirement
    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: false,
            afterSwap: true, // Only afterSwap is true as it's used in this contract
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function afterSwap(
        address, 
        PoolKey calldata key, 
        IPoolManager.SwapParams calldata, 
        BalanceDelta, 
        bytes calldata
    )
        external
        override
        returns (bytes4, int128)
    {
        afterSwapCount[key.toId()]++;
        return (BaseHook.afterSwap.selector, 0);
    }
}