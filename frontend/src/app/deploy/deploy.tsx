"use client";
import React, { useEffect, useState } from "react";
import { useDeployContract, useWaitForTransactionReceipt } from "wagmi";
import contractAbi from "./abi.json";
import { parseEther } from "viem";

export function DeployContract(sourceCode: any) {
  useEffect(() => {}, [sourceCode]);
  const {
    deployContract,
    data: deployHash,
    error,
    isError,
    isPending,
    isSuccess,
  } = useDeployContract();

  const { data: txReceipt, isSuccess: isReceiptSuccess } =
    useWaitForTransactionReceipt({
      hash: deployHash,
    });

  const compileContract = async () => {
    try {
      console.log(sourceCode);
      const response = await fetch("http://localhost:3001/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceCode }),
      });

      if (!response.ok) {
        throw new Error("Compilation failed");
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Compilation error:", error);
    }
  };
  const handleDeploy = async () => {
    const files = await compileContract();
    console.log(files);
    const abi = files.files.abi;
    const bytecode = files.files.bytecode as `0x${string}`;

    try {
      await deployContract({
        // abi: contractAbi,
        // bytecode:
        //   "6080604052348015600e575f80fd5b506101438061001c5f395ff3fe608060405234801561000f575f80fd5b5060043610610034575f3560e01c80632e64cec1146100385780636057361d14610056575b5f80fd5b610040610072565b60405161004d919061009b565b60405180910390f35b610070600480360381019061006b91906100e2565b61007a565b005b5f8054905090565b805f8190555050565b5f819050919050565b61009581610083565b82525050565b5f6020820190506100ae5f83018461008c565b92915050565b5f80fd5b6100c181610083565b81146100cb575f80fd5b50565b5f813590506100dc816100b8565b92915050565b5f602082840312156100f7576100f66100b4565b5b5f610104848285016100ce565b9150509291505056fea264697066735822122040e2a5eb0d57763a4fd5140f6529dc33e85957975bc1bcc24112580767a2e03264736f6c634300081a0033" as `0x${string}`,

        abi: abi,
        bytecode: bytecode,
        args: [],
      });
    } catch (err) {
      console.error("Deployment error:", err);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleDeploy}
        disabled={isPending}
        className="px-4 py-2 font-bold text-white bg-blue-500 rounded-full hover:bg-blue-700 focus:outline-none focus:shadow-outline disabled:opacity-50"
      >
        {isPending ? "Deploying..." : "Deploy Contract"}
      </button>

      {isSuccess && (
        <div className="mt-4 text-center">
          <h3 className="text-xl font-bold">Transaction Submitted</h3>
          <p className="mt-2">Transaction Hash: {deployHash}</p>
          {isReceiptSuccess && (
            <>
              <p className="mt-2">
                Status: {txReceipt?.status === "success" ? "Success" : "Failed"}
              </p>
              {txReceipt?.status === "success" && (
                <p className="mt-2">
                  Contract Address: {txReceipt.contractAddress}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {isError && (
        <div className="mt-4 text-center text-red-500">
          <h3 className="text-xl font-bold">Error Deploying Contract</h3>
          <p className="mt-2">{error?.message}</p>
        </div>
      )}

      {deployHash && (
        <div className="mt-4 text-center">
          <a
            href={`https://eth-sepolia.blockscout.com/tx/${deployHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700"
          >
            View on Blockscout
          </a>
        </div>
      )}
    </div>
  );
}
