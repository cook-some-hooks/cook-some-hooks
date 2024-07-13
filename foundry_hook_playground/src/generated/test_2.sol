// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {BaseHook} from "v4-periphery/BaseHook.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Counters} from "@openzeppelin/contracts/utils/Counters.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "v4-core/src/types/BeforeSwapDelta.sol";

contract SwapNFTMinter is BaseHook, ERC721, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;
    mapping(address => bool) public whitelist;

    event WhitelistUpdated(address user, bool status);

    constructor(IPoolManager _poolManager) BaseHook(_poolManager) ERC721("SwapNFT", "SNFT") {}

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function beforeSwap(address sender, PoolKey calldata, IPoolManager.SwapParams calldata, bytes calldata)
        external
        view
        override
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        require(whitelist[sender], "Sender not whitelisted");
        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function afterSwap(address sender, PoolKey calldata, IPoolManager.SwapParams calldata, BalanceDelta, bytes calldata)
        external
        override
        returns (bytes4, int128)
    {
        _mintNFT(sender);
        return (BaseHook.afterSwap.selector, 0);
    }

    function _mintNFT(address recipient) internal {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _safeMint(recipient, newTokenId);
    }

    function updateWhitelist(address user, bool status) external onlyOwner {
        whitelist[user] = status;
        emit WhitelistUpdated(user, status);
    }
}