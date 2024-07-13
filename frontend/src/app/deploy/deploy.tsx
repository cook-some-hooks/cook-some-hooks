"use client"
import React from 'react'
import { useDeployContract, useWaitForTransactionReceipt, useConfig } from 'wagmi'
import contractAbi from './abi.json'

export function DeployContract() {
  const config = useConfig()
  const { deployContract, data: deployHash, error, isError, isPending, isSuccess } = useDeployContract({
    config,
  })

  const { data: txReceipt } = useWaitForTransactionReceipt({
    hash: deployHash,
  })

  const handleDeploy = async () => {
    try {
      await deployContract({
        abi: contractAbi,
        bytecode: '0x608060405234801561000f575f80fd5b5060043610610034575f3560e01c80632e64cec1146100385780636057361d14610056575b5f80fd5b610040610072565b60405161004d919061009b565b60405180910390f35b610070600480360381019061006b91906100e2565b61007a565b005b5f8054905090565b805f8190555050565b5f819050919050565b61009581610083565b82525050565b5f6020820190506100ae5f83018461008c565b92915050565b5f80fd5b6100c181610083565b81146100cb575f80fd5b50565b5f813590506100dc816100b8565b92915050565b5f602082840312156100f7576100f66100b4565b5b5f610104848285016100ce565b9150509291505056fea264697066735822122053e03bedfcd3bc64823abeaa29abf68928a8d90dcb9300816e202c8795c675bd64736f6c63430008190033' as `0x${string}`,
        args: [], // No constructor arguments
      })
    } catch (err) {
      console.error('Deployment error:', err)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleDeploy}
        disabled={isPending}
        className="px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700 focus:outline-none focus:shadow-outline disabled:opacity-50"
      >
        {isPending ? 'Deploying...' : 'Deploy Contract'}
      </button>
      
      {isSuccess && txReceipt && (
        <div className="mt-4 text-center">
          <h3 className="text-xl font-bold">
            Contract Deployment {txReceipt.status === 'success' ? 'Successful' : 'Failed'}
          </h3>
          <p className="mt-2">Transaction Hash: {deployHash}</p>
          {txReceipt.status === 'success' && (
            <p className="mt-2">Contract Address: {txReceipt.contractAddress}</p>
          )}
        </div>
      )}
      
      {isError && (
        <div className="mt-4 text-center text-red-500">
          <h3 className="text-xl font-bold">Error Deploying Contract</h3>
          <p className="mt-2">{error?.message}</p>
        </div>
      )}
    </div>
  )
}