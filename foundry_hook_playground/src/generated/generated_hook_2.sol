// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseHook} from "@uniswap/v4-periphery/contracts/BaseHook.sol";
import {Hooks} from "@uniswap/v4-core/contracts/libraries/Hooks.sol";
import {IPoolManager} from "@uniswap/v4-core/contracts/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/contracts/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/contracts/types/PoolId.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MintRewardHook is BaseHook {
    using PoolIdLibrary for PoolKey;

    IERC20 public immutable rewardToken;
    
    uint256 public constant REWARD_AMOUNT = 10 * 10**18;

    constructor(IPoolManager _poolManager, IERC20 _rewardToken) BaseHook(_poolManager) {
        rewardToken = _rewardToken;
    }

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: true,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: false,
            afterSwap: false,
            beforeDonate: false,
            afterDonate: false
        });
    }

    function beforeAddLiquidity(
        address sender,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        bytes calldata
    ) external override returns (bytes4) {
        require(rewardToken.transfer(sender, REWARD_AMOUNT), "Reward transfer failed");
        
        return BaseHook.beforeAddLiquidity.selector;
    }
   function validateHookAddress(BaseHook _this) internal pure override {
            }
        }