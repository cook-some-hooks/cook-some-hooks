// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {BaseHook} from "v4-periphery/BaseHook.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "v4-core/src/types/BeforeSwapDelta.sol";

/// @title KYCAndEvenHoursHook
contract KYCAndEvenHoursHook is BaseHook {
    /// @notice NFT contract which is used for KYC check
    IERC721 public immutable nftContract;

    error NotNftOwner();
    error MarketClosed();

    constructor(IPoolManager _poolManager, IERC721 _nftContract) BaseHook(_poolManager) {
        nftContract = _nftContract;
    }

    // Permissions this hook requires
    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
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

    function beforeSwap(
        address sender, 
        PoolKey calldata, 
        IPoolManager.SwapParams calldata, 
        bytes calldata
    ) 
        external 
        view 
        override 
        returns (bytes4, BeforeSwapDelta, uint24) 
    {
        // Check if sender holds the required NFT
        if (nftContract.balanceOf(sender) == 0) {
            revert NotNftOwner();
        }

        // Check if the current hour is even
        uint256 hour = (block.timestamp / 3600) % 24;
        if (hour % 2 != 0) {
            revert MarketClosed();
        }

        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }
}
