//The MultiSigSwapHook contract is a specialized implementation designed to integrate with Uniswap v4's innovative hook system. In line with Uniswap's vision for v4, this contract allows for a flexible and customized approach to swaps by enforcing multiple signature approvals before a swap can occur.

pragma solidity ^0.8.15;

import {BaseHook} from "v4-periphery/BaseHook.sol";
import {Hooks} from "@uniswap/v4-core/contracts/libraries/Hooks.sol";
import {IPoolManager} from "@uniswap/v4-core/contracts/interfaces/IPoolManager.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/contracts/libraries/PoolId.sol";
import {BalanceDelta} from "@uniswap/v4-core/contracts/types/BalanceDelta.sol";

contract MultiSigSwapHook is BaseHook {
    struct SwapApproval {
        uint256 count;
        mapping(address => bool) signers;
    }

    using PoolIdLibrary for IPoolManager.PoolKey;


    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    address public owner;

    mapping(bytes32 => SwapApproval) public swapApprovals;
    mapping(address => bool) public authorizedSigners;
    uint256 public requiredSignatures;

    event ApprovalAdded(address indexed signer, bytes32 indexed swapHash);
    event SwapCompleted(bytes32 indexed swapHash);

    constructor(IPoolManager _poolManager, address[] memory _signers, uint256 _requiredSignatures) BaseHook(_poolManager) {
        require(_signers.length >= _requiredSignatures, "Invalid signers or required signatures");
        require(_requiredSignatures > 0, "At least one signature is required");

        for (uint i = 0; i < _signers.length; i++) {
            require(!authorizedSigners[_signers[i]], "Duplicate signers are not allowed");
            authorizedSigners[_signers[i]] = true;
        }

        requiredSignatures = _requiredSignatures;
        owner = msg.sender;
    }

    function approveSwap(bytes32 swapHash) public {
        require(authorizedSigners[msg.sender], "Not an approved signer");
        require(!swapApprovals[swapHash].signers[msg.sender], "Signer has already approved this swap");

        swapApprovals[swapHash].count++;
        swapApprovals[swapHash].signers[msg.sender] = true;

        emit ApprovalAdded(msg.sender, swapHash);
    }

    function beforeSwap(address, IPoolManager.PoolKey calldata, IPoolManager.SwapParams calldata swapParams)
    external
    override
    returns (bytes4)
    {
        bytes32 swapHash = keccak256(abi.encode(swapParams));
        require(swapApprovals[swapHash].count >= requiredSignatures, "Insufficient approvals for swap");

        return BaseHook.beforeSwap.selector;
    }

    function afterSwap(address, IPoolManager.PoolKey calldata, IPoolManager.SwapParams calldata swapParams, BalanceDelta)
    external
    override
    returns (bytes4)
    {
        bytes32 swapHash = keccak256(abi.encode(swapParams));
        delete swapApprovals[swapHash]; // Clears the swap approval for the swapHash

        emit SwapCompleted(swapHash);
        return BaseHook.afterSwap.selector;
    }


    function addSigner(address signer) public onlyOwner {
        require(!authorizedSigners[signer], "Signer is already authorized");
        authorizedSigners[signer] = true;
    }


    function removeSigner(address signer) public onlyOwner {
        require(authorizedSigners[signer], "Signer is not authorized");
        authorizedSigners[signer] = false;
    }


    function setRequiredSignatures(uint256 _requiredSignatures) public onlyOwner {
        require(_requiredSignatures > 0, "At least one signature is required");
        requiredSignatures = _requiredSignatures;
    }

    function getApprovalDetails(bytes32 swapHash) public view returns (uint256 approvalCount, bool hasSigned) {
        return (swapApprovals[swapHash].count, swapApprovals[swapHash].signers[msg.sender]);
    }
}