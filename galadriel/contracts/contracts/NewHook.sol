// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {BaseHook} from "v4-periphery/BaseHook.sol";
import {Hooks} from "@uniswap/v4-core/contracts/libraries/Hooks.sol";
import {IPoolManager} from "@uniswap/v4-core/contracts/interfaces/IPoolManager.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @title ERC721OwnershipHook
contract ERC721OwnershipHook is BaseHook {
    /// @notice NFT contract
    IERC721 public immutable nftContract;

    error NotNftOwner();

    constructor(
        IPoolManager _poolManager,
        IERC721 _nftContract
    ) BaseHook(_poolManager) {
        nftContract = _nftContract;
    }

    function getHooksCalls() public pure override returns (Hooks.Calls memory) {
        return
            Hooks.Calls({
                beforeInitialize: false,
                afterInitialize: false,
                beforeModifyPosition: false,
                afterModifyPosition: false,
                beforeSwap: true,
                afterSwap: false,
                beforeDonate: false,
                afterDonate: false
            });
    }

    function beforeSwap(
        address sender,
        IPoolManager.PoolKey calldata,
        IPoolManager.SwapParams calldata
    ) external override returns (bytes4) {
        if (nftContract.balanceOf(sender) == 0) {
            revert NotNftOwner();
        }

        return BaseHook.beforeSwap.selector;
    }
}