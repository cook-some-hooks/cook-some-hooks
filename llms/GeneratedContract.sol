// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.19;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {BaseHook} from "v4-periphery/BaseHook.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "v4-core/src/types/BeforeSwapDelta.sol";

/**
 * @title An interface for checking whether an address has a valid kycNFT token
 */
interface IKycValidity {
    /// @dev Check whether a given address has a valid kycNFT token
    /// @param _addr Address to check for tokens
    /// @return valid Whether the address has a valid token
    function hasValidToken(address _addr) external view returns (bool valid);
}

/**
 * Only KYC'ed people can trade on the V4 hook'ed pool.
 * Caveat: Relies on external oracle for info on an address's KYC status.
 */
contract MyCustomHook is BaseHook, Ownable {
    IKycValidity public kycValidity;
    address private _preKycValidity;
    uint256 private _setKycValidityReqTimestamp;

    constructor(
        IPoolManager _poolManager,
        address _kycValidity
    ) BaseHook(_poolManager) {
        kycValidity = IKycValidity(_kycValidity);
    }

    modifier onlyPermitKYC() {
        require(
            kycValidity.hasValidToken(tx.origin),
            "Swaps available for valid KYC token holders"
        );
        _;
    }

    /// Sorta timelock
    function setKycValidity(address _kycValidity) external onlyOwner {
        if (
            block.timestamp - _setKycValidityReqTimestamp >= 7 days &&
            _kycValidity == _preKycValidity
        ) {
            kycValidity = IKycValidity(_kycValidity);
        } else {
            _preKycValidity = _kycValidity;
            _setKycValidityReqTimestamp = block.timestamp;
        }
    }

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

    function beforeSwap(
        address,
        PoolKey calldata,
        IPoolManager.SwapParams calldata,
        bytes calldata
    ) external view override onlyByManager onlyPermitKYC returns (bytes4, BeforeSwapDelta, uint24) {
        return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }
}
