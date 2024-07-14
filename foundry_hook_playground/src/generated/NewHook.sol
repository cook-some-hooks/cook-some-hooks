// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import {IPoolManager} from "@uniswap/v4-core/contracts/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/contracts/libraries/Hooks.sol";
import {BaseHook} from "../../BaseHook.sol";
import {PoolKey} from "@uniswap/v4-core/contracts/types/PoolKey.sol";

contract WhitelistHook is BaseHook, Ownable {

    mapping(address => bool) public whitelisted;

    event AddedToWhitelist(address indexed addr);
    event RemovedFromWhitelist(address indexed addr);

    constructor(IPoolManager _poolManager) BaseHook(_poolManager) {}

    function addToWhitelist(address _address) external onlyOwner {
        whitelisted[_address] = true;
        emit AddedToWhitelist(_address);
    }

    function removeFromWhitelist(address _address) external onlyOwner {
        whitelisted[_address] = false;
        emit RemovedFromWhitelist(_address);
    }

    function beforeModifyPosition(address sender, PoolKey calldata, IPoolManager.ModifyPositionParams calldata)
    external
    override
    poolManagerOnly
    returns (bytes4)
    {
        require(whitelisted[sender], "WhitelistHook: Not whitelisted");
        return WhitelistHook.beforeModifyPosition.selector;
    }

    function beforeSwap(address sender, PoolKey calldata, IPoolManager.SwapParams calldata)
    external
    override
    poolManagerOnly
    returns (bytes4)
    {
        require(whitelisted[sender], "WhitelistHook: Not whitelisted");
        return WhitelistHook.beforeSwap.selector;
    }

    function getHooksCalls() public pure override returns (Hooks.Calls memory) {
        return Hooks.Calls({
            beforeInitialize: false,
            afterInitialize: false,
            beforeModifyPosition: true,
            afterModifyPosition: false,
            beforeSwap: true,
            afterSwap: false,
            beforeDonate: false,
            afterDonate: false
        });
    }
}