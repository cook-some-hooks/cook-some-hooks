// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {BaseHook} from "v4-periphery/BaseHook.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "v4-core/src/types/BeforeSwapDelta.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenRewardHook is BaseHook {
    // Define the token that is awarded upon a swap
    ERC20 public rewardToken;

    // Reward amount per swap
    uint256 public rewardAmount;

    // Initialize BaseHook parent contract in the constructor
    constructor(IPoolManager _poolManager, address _rewardToken, uint256 _rewardAmount)
        BaseHook(_poolManager)
    {
        rewardToken = ERC20(_rewardToken);
        rewardAmount = _rewardAmount;
    }

    // Required override function for BaseHook to let the PoolManager know which hooks are implemented
    function getHookPermissions()
        public
        pure
        override
        returns (Hooks.Permissions memory)
    {
        return
            Hooks.Permissions({
                beforeInitialize: false,
                afterInitialize: false,
                beforeAddLiquidity: false,
                beforeRemoveLiquidity: false,
                afterAddLiquidity: false,
                afterRemoveLiquidity: false,
                beforeSwap: true,
                afterSwap: false,
                beforeDonate: false,
                afterDonate: false,
                beforeSwapReturnDelta: false,
                afterSwapReturnDelta: false,
                afterAddLiquidityReturnDelta: false,
                afterRemoveLiquidityReturnDelta: false
            });
    }

    // Hook function that is called before a swap
    function beforeSwap(
        address user,
        PoolKey calldata,
        IPoolManager.SwapParams calldata,
        bytes calldata
    )
        external
        override
        onlyByManager
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        // Send the reward token to the user
        rewardToken.transfer(user, rewardAmount);

        return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

   function validateHookAddress(BaseHook _this) internal pure override {
            }
        }