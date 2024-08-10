// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
pragma solidity ^0.8.24;

import {BaseHook} from "v4-periphery/BaseHook.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RewardMintHook is BaseHook, ERC20 {
    uint256 public constant REWARD_AMOUNT = 1000 * 10 ** 18;

    constructor(
        IPoolManager _poolManager,
        string memory _name,
        string memory _symbol
    ) BaseHook(_poolManager) ERC20(_name, _symbol) {}

    function getHookPermissions()
        public
        pure
        override
        returns (Hooks.Permissions memory)
    {
        return
            Hooks.Permissions({
                beforeInitialize: false,
                afterInitialize: true,
                beforeAddLiquidity: false,
                beforeRemoveLiquidity: false,
                afterRemoveLiquidity: false,
                beforeSwap: false,
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

    function afterInitialize(
        address,
        PoolKey calldata,
        uint160,
        int24,
        bytes calldata
    ) external override onlyByManager returns (bytes4) {
        // Mint reward tokens to the minter
        _mint(tx.origin, REWARD_AMOUNT);
        return BaseHook.afterInitialize.selector;
    }

    function validateHookAddress(BaseHook _this) internal pure override {}
}
