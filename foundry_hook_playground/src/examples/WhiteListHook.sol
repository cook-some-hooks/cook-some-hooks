// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {BaseHook} from "v4-periphery/BaseHook.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "v4-core/src/types/BeforeSwapDelta.sol";

contract WhitelistHook is BaseHook, Ownable {

    mapping(address => bool) public whitelisted;

    event AddedToWhitelist(address indexed addr);
    event RemovedFromWhitelist(address indexed addr);

    constructor(IPoolManager _poolManager) BaseHook(_poolManager) {}

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: true,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
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

    function addToWhitelist(address _address) external onlyOwner {
        whitelisted[_address] = true;
        emit AddedToWhitelist(_address);
    }

    function removeFromWhitelist(address _address) external onlyOwner {
        whitelisted[_address] = false;
        emit RemovedFromWhitelist(_address);
    }

    function beforeAddLiquidity(
        address sender,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        bytes calldata
    ) external override view returns (bytes4) {
        require(whitelisted[sender], "WhitelistHook: Not whitelisted");
        return BaseHook.beforeAddLiquidity.selector;
    }

    function beforeSwap(address sender, PoolKey calldata, IPoolManager.SwapParams calldata, bytes calldata)
        external
        override
        view
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        require(whitelisted[sender], "WhitelistHook: Not whitelisted");
        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

}