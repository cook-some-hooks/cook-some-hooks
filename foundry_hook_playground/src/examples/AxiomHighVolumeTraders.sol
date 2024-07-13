// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseHook} from "v4-periphery/BaseHook.sol";

import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {AxiomV2Client} from "axiom-v2-periphery/src/client/AxiomV2Client.sol";
import {CurrencyLibrary, Currency} from "v4-core/src/types/Currency.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";

contract RoyaltyHook is BaseHook, AxiomV2Client {
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;

    /// @dev Source chain id for the Axiom V2 callback.
    uint64 immutable SOURCE_CHAIN_ID;

    uint24 constant DEFAULT_FEE = 3000;

    /// @notice User trade volume for a given pool and user.
    /// @dev Always in token0 terms.
    mapping(PoolId poolId => mapping(address user => uint256 tradeVolume)) public userTradeVolume;

    /// @dev Axiom V2 Query Schema.
    bytes32 QUERY_SCHEMA;

    /// @dev Used internally to store the pool balance of token0 before a swap.
    /// TODO: Should be replaced with transient storage in the future.
    uint256 internal balanceToken0Before;

    /// @dev Used internally to store the address of the message sender.
    /// TODO: Should be replaced with transient storage in the future.
    address internal msgSender;

    PoolId _poolId;

    struct FeeRebate {
        uint24 amount;
        uint232 expiry;
    }

    mapping(PoolId poolId => mapping(address user => FeeRebate feeRebate)) public userSpecificFeeRebate;

    // NOTE: ---------------------------------------------------------
    // state variables should typically be unique to a pool
    // a single hook contract should be able to service multiple pools
    // ---------------------------------------------------------------

    constructor(
        IPoolManager _poolManager,
        address _axiomV2QueryAddress,
        uint64 _callbackSourceChainId,
        bytes32 _querySchema
    ) BaseHook(_poolManager) AxiomV2Client(_axiomV2QueryAddress) {
        QUERY_SCHEMA = _querySchema;
        SOURCE_CHAIN_ID = _callbackSourceChainId;
    }

    function setQUERY_SCHEMA(bytes32 _querySchema) external {
        QUERY_SCHEMA = _querySchema;
    }

    /// #region Axiom V2 Callbacks

    function _validateAxiomV2Call(
        AxiomCallbackType ,
        uint64 sourceChainId,
        address ,
        bytes32 querySchema,
        uint256 ,
        bytes calldata 
    ) internal view override {
        require(sourceChainId == SOURCE_CHAIN_ID, "Source chain ID does not match");
        require(querySchema == QUERY_SCHEMA, "Invalid query schema");

        // <Add any additional desired validation>
    }

    /// @dev Callback function for Axiom V2.
    /// In here, we update the user-specific fee rebate for the given pool and user.
    /// Fee rebates include an expiry timestamp, so the rebate amount is only valid until the expiry.
    function _axiomV2Callback(
        uint64 ,
        address ,
        bytes32 ,
        uint256 ,
        bytes32[] calldata axiomResults,
        bytes calldata 
    ) internal override {
        // First axiom result is the poolId
        PoolId poolId = PoolId.wrap(axiomResults[0]);
        // Second axiom result is the user address
        address userAddress = address(uint160(uint256(axiomResults[1])));
        // Third axiom result is the new fee rebate amount
        uint24 newFeeRebateAmount = uint24(uint256(axiomResults[2]));
        // Fourth axiom result is the new fee rebate expiry
        uint232 newFeeRebateExpiry = uint232(uint256(axiomResults[3]));

        // Update the user-specific fee rebate
        userSpecificFeeRebate[poolId][userAddress] = FeeRebate({amount: newFeeRebateAmount, expiry: newFeeRebateExpiry});
    }

    function testUpdateFee(uint24 newFeeRebateAmount, uint232 newFeeRebateExpiry, address userAddress) external {
        userSpecificFeeRebate[_poolId][userAddress] = FeeRebate({amount: newFeeRebateAmount, expiry: newFeeRebateExpiry});
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
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }


    /// #region Uniswap V4 Hooks

    function getUserSpecificFee(PoolKey calldata key, address user) public view returns (uint24) {
        FeeRebate memory rebate = userSpecificFeeRebate[key.toId()][user];
        if (block.number < rebate.expiry) {
            if (rebate.amount >= DEFAULT_FEE) {
                return 1; // Minimum non-zero fee
            } else {
                return DEFAULT_FEE - rebate.amount;
            }
        } else {
            return DEFAULT_FEE;
        }
    }

    function beforeSwap(address, PoolKey calldata key, IPoolManager.SwapParams calldata, bytes calldata data)
        external
        override
        returns (bytes4, BeforeSwapDelta, uint24)
    {
        msgSender = abi.decode(data, (address));
        /// @dev The following line is a blatant security vulnerability. Please don't use it in production.
        balanceToken0Before = key.currency0.balanceOfSelf();
        manager.updateDynamicLPFee(key, getUserSpecificFee(key, msgSender));
        _poolId = key.toId();
        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function afterSwap(address, PoolKey calldata key, IPoolManager.SwapParams calldata, BalanceDelta, bytes calldata)
        external
        override
        returns (bytes4, int128)
    {
        uint256 balanceToken0After = key.currency0.balanceOfSelf();
        if (balanceToken0After >= balanceToken0Before) {
            userTradeVolume[key.toId()][msgSender] += balanceToken0After - balanceToken0Before;
        } else {
            userTradeVolume[key.toId()][msgSender] += balanceToken0Before - balanceToken0After;
        }

        manager.updateDynamicLPFee(key, DEFAULT_FEE);
        balanceToken0Before = 0;
        msgSender = address(0);

        return (BaseHook.afterSwap.selector, 0);
    }

    function beforeAddLiquidity(address, PoolKey calldata, IPoolManager.ModifyLiquidityParams calldata, bytes calldata)
        external
        pure
        override
        returns (bytes4)
    {
        return BaseHook.beforeAddLiquidity.selector;
    }

    function beforeRemoveLiquidity(
        address,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        bytes calldata
    ) external pure override returns (bytes4) {
        return BaseHook.beforeRemoveLiquidity.selector;
    }
}