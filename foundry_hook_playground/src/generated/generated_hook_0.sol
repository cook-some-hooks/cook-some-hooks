// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {BaseHook} from "v4-periphery/BaseHook.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MintRewardHook is BaseHook {
    using PoolIdLibrary for PoolKey;

    // Reward token
    IERC20 public immutable rewardToken;
    
    // Reward amount per mint
    uint256 public constant REWARD_AMOUNT = 100 * 10**18; // 100 tokens

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
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function beforeAddLiquidity(
        address sender,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        bytes calldata
    ) external override returns (bytes4) {
        // Reward the minter
        require(rewardToken.transfer(sender, REWARD_AMOUNT), "Reward transfer failed");
        
        return BaseHook.beforeAddLiquidity.selector;
    }

   function validateHookAddress(BaseHook _this) internal pure override {
            }
        }