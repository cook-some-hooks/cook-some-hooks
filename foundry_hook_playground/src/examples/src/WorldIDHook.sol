// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {BaseHook} from "v4-periphery/BaseHook.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "v4-core/src/types/BeforeSwapDelta.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {Currency, CurrencyLibrary} from "v4-core/src/types/Currency.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {TickMath} from "v4-core/src/libraries/TickMath.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {FixedPointMathLib} from "solmate/utils/FixedPointMathLib.sol";

// import {Initializable} from "../lib/openzeppelin-upgrades/packages/core/contracts/Initializable.sol";

interface WorldIDRouterImplV1 {
    function verifyProof(
        uint256 root,
        uint256 groupId,  // 1
        uint256 signalHash,  // abi.encodePacked(signal).hashToField(),
        uint256 nullifierHash,
        uint256 externalNullifierHash,
        uint256[8] calldata proof
    ) external;
}

contract WorldIDKyc is BaseHook {
    // Use the PoolIdLibrary for PoolKey to add the `.toId()` function on a PoolKey
    // which hashes the PoolKey struct into a bytes32 value
    using PoolIdLibrary for PoolKey;

    // Use the CurrencyLibrary for the Currency struct
    using CurrencyLibrary for Currency;

    // Use the FixedPointMathLib for doing math operations on uint256 values
    using FixedPointMathLib for uint256;

    // Create a mapping to store the last known tickLower value for a given Pool
    mapping(PoolId poolId => int24 tickLower) public tickLowerLasts;

    struct SwapData {
        address swapper;
        int256 amount0;
        uint160 tick;
    }

    mapping(address => bool) public isKyced;
    mapping(address => mapping(address => mapping(address => SwapData)))
        public SwappedAmount;

    address public worldIDRouterImplV1Address =
        0x719683F13Eeea7D84fCBa5d7d17Bf82e03E3d260;

    uint24 GroupID = 1;

    bytes internal constant ZERO_BYTES = bytes("");

    constructor(
        IPoolManager _poolManager,
        string memory _uri
    ) BaseHook(_poolManager) {}

    // function initialize( IPoolManager _poolManager,
    //     string memory _uri) public initializer BaseHook(_poolManager) {}

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: true,
            beforeAddLiquidity: false,
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

    // Hooks
    function afterInitialize(
        address,
        PoolKey calldata key,
        uint160,
        int24 tick,
        bytes calldata
    ) external override onlyByManager returns (bytes4) {
        _setTickLowerLast(key.toId(), _getTickLower(tick, key.tickSpacing));
        return WorldIDKyc.afterInitialize.selector;
    }

    function beforeSwap(address sender, PoolKey calldata key, IPoolManager.SwapParams calldata params, bytes calldata)
        external
        override
        returns (bytes4, BeforeSwapDelta, uint24){

        require(isKyced[sender], "You are not KYCed");

        _handleSwap(key, params);

        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function _handleSwap(
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params
    ) public returns (BalanceDelta) {
        BalanceDelta delta = manager.swap(key, params, ZERO_BYTES);

        int256 initAmount = SwappedAmount[msg.sender][
            Currency.unwrap(key.currency0)
        ][Currency.unwrap(key.currency1)].amount0;

        int256 finalAmount = initAmount + delta.amount0();

        SwappedAmount[msg.sender][Currency.unwrap(key.currency0)][
            Currency.unwrap(key.currency1)
        ] = SwapData(msg.sender, finalAmount, params.sqrtPriceLimitX96);

        return delta;
    }

    // World ID verify function
    function doKyc(
        uint256 root,
        uint256 groupId,
        uint256 signalHash,
        uint256 nullifierHash,
        uint256 externalNullifierHash,
        uint256[8] calldata proof
    ) external {

        require(groupId == GroupID, "Invalid Group ID");

        WorldIDRouterImplV1(worldIDRouterImplV1Address).verifyProof(
            root,
            groupId,
            signalHash,
            nullifierHash,
            externalNullifierHash,
            proof
        );

        isKyced[msg.sender] = true;
    }

    // Utility Helpers
    function _setTickLowerLast(PoolId poolId, int24 tickLower) private {
        tickLowerLasts[poolId] = tickLower;
    }

    function _getTickLower(
        int24 actualTick,
        int24 tickSpacing
    ) private pure returns (int24) {
        int24 intervals = actualTick / tickSpacing;
        if (actualTick < 0 && actualTick % tickSpacing != 0) intervals--; // round towards negative infinity
        return intervals * tickSpacing;
    }
}