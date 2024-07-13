// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {BaseHook} from "v4-periphery/BaseHook.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "v4-core/src/types/BeforeSwapDelta.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title A custom Uniswap v4 Hook that restricts trading to users who own a specific NFT
 * and only allows trading during even-numbered hours.
 */
contract KYCAndTradingHoursHook is BaseHook, Ownable {
    IERC721 public immutable nftContract;

    constructor(IPoolManager _poolManager, IERC721 _nftContract) BaseHook(_poolManager) {
        nftContract = _nftContract;
    }

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

    /**
     * @dev Ensures the sender owns the required NFT and current hour is even.
     */
    function beforeSwap(address sender, PoolKey calldata, IPoolManager.SwapParams calldata, bytes calldata)
        external
        view
        override
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        // Check if the sender owns the required NFT
        require(nftContract.balanceOf(sender) > 0, "Sender does not own the required NFT");

        // Check if the current hour is even
        uint256 hour = (block.timestamp / 60 / 60) % 24;
        require(hour % 2 == 0, "Trading is only allowed during even-numbered hours");

        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }
}
