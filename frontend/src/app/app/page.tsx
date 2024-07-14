"use client";
import datajson from "./data.json";

import {
  useAccount,
  useDeployContract,
  useDisconnect,
  useWaitForTransactionReceipt,
} from "wagmi";
import React, { useState } from "react";
import Image from "next/image";
import { cn } from "../../../lib/utils";

import { NavbarApp } from "@/components/NavbarApp";

import { HeroHighlight } from "@/components/ui/hero-highlight";
import {
  IconBrandGithub,
  IconBrandGoogle,
  IconBrandOnlyfans,
} from "@tabler/icons-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Option } from "@/components/ui/option";
import { TextArea } from "@/components/ui/textarea";
import CoinSelector from "@/components/tokens/CoinSelector";

interface Token {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
}

import SolidityCode from "@/components/SolidityCode";
import { Loader } from "@/components/Loader";

export default function Home() {
  const { address, isConnected } = useAccount();

  const { disconnect } = useDisconnect();
  // console.log(address);

  const [isTransitioned, setIsTransitioned] = useState(false);
  const [loader, setloader] = useState(false);
  const [loaderText, setloaderText] = useState("");
  const [selectedTokens, setSelectedTokens] = useState<Token[]>([]);

  const handleButtonClick = () => {
    setIsTransitioned(true);
    setloader(true);
    setloaderText("AI is cooking");
  };

  const handleTokenSelect = (tokens: Token[]) => {
    setSelectedTokens(tokens);
  };

  const [prompt, setPrompt] = useState("");

  const [generatedData, setGenereatedData] = useState<any>({});
  const [response, setResponse] = useState("");
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    // const res = await fetch("/api/chat", {
    //   method: "GET",
    //   headers: { "Content-Type": "application/json" },
    // });

    // const data = await res.json();

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, address }),
    });

    const data = await res.json();

    setGenereatedData(data.res);
    setResponse(data.res.solidity_code);
    // setResponse(datajson.res.solidity_code);
    // setGenereatedData(datajson.res);

    setloader(false);
    setloaderText("");
  };

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
      const responseJson = await fetch("http://localhost:3001/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceCode: response }),
      });

      if (!responseJson.ok) {
        throw new Error("Compilation failed");
      }

      const result = await responseJson.json();
      return result;
    } catch (error) {
      console.error("Compilation error:", error);
    }
  };
  const handleDeploy = async () => {
    // const files = await compileContract();
    // console.log(files);
    const abi = generatedData.abi;
    const bytecode = generatedData.bytecode as `0x${string}`;
    // const abi = files.files.abi;
    // const bytecode = files.files.bytecode as `0x${string}`;

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
    <main className="">
      <NavbarApp />
      <HeroHighlight className="w-full">
        <div
          className={`flex flex-row items-center justify-center transition-all duration-[4s] ${
            isTransitioned
              ? "justify-start mx-auto max-w-screen-xl flex flex-row items-center gap-2 p-4   "
              : ""
          }`}
        >
          <div
            className={`w-[400px] mt-10 rounded-md border border-white/[0.2]  p-4 md:p-8 shadow-input bg-white dark:bg-black ${
              isTransitioned ? "w-[40%] h-[80vh]" : ""
            }`}
          >
            <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
              Cook your Hook
            </h2>
            <form className="my-8 mb-0" onSubmit={handleSubmit}>
              <div className="flex flex-col space-y-2 mb-4">
                <LabelInputContainer>
                  <CoinSelector onSelectTokens={handleTokenSelect} />
                </LabelInputContainer>
              </div>

              <LabelInputContainer className="mb-4">
                <Label htmlFor="prompt">Hook prompt</Label>
                <TextArea
                  id="prompt"
                  placeholder="Enter your prompt here for cooking your hook "
                  onChange={(e) => setPrompt(e.target.value)}
                  value={prompt}
                />
              </LabelInputContainer>
              <button
                disabled={!isConnected}
                className={`cursor-pointer bg-gradient-to-br relative group/btn from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset] ${isConnected ? "" : " opacity-50 cursor-not-allowed"}`}
                type="submit"
                onClick={handleButtonClick}
              >
                {!loader && <>Generate with AI &rarr;</>}
                {loader && (
                  <>
                    <Loader text={loaderText} />
                  </>
                )}
                <BottomGradient />
              </button>
            </form>
          </div>
          {isTransitioned && (
            <div className="h-[80vh] w-[60%]  flex-col  overflow-scroll rounded-md border border-white/[0.2]  mt-10 flex items-center justify-center bg-gray-200 dark:bg-black transition-opacity duration-500">
              <div className="w-full h-full items-end flex flex-col">
                {/* {response && response} */}
                <div
                  className={
                    deployHash
                      ? "flex flex-row justify-evenly w-full p-1 items-center"
                      : " flex justify-end w-full p-1 items-end"
                  }
                >
                  {!deployHash && (
                    <button
                      className=" inline-flex h-10  animate-shimmer items-center justify-center rounded-md border border-white/[0.2] bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-slate-50"
                      onClick={() => {
                        handleDeploy();
                      }}
                    >
                      Compile & Deploy
                    </button>
                  )}
                  {isSuccess && (
                    <div className="mt-4 text-center">
                      {/* <p className="mt-2">Transaction Hash: {deployHash}</p> */}
                      {isReceiptSuccess && (
                        <>
                          <p className="mt-2">
                            Status:{" "}
                            {txReceipt?.status === "success"
                              ? "Success"
                              : "Failed"}
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
                  {deployHash && (
                    <div className="mt-4 ">
                      <a
                        href={`https://sepolia.etherscan.io/tx/${deployHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        View on Etherscan
                      </a>
                    </div>
                  )}
                  {isError && (
                    <div className="mt-4 text-center text-red-500">
                      <h3 className="text-xl font-bold">
                        Error Deploying Contract
                      </h3>
                      <p className="mt-2">{error?.message}</p>
                    </div>
                  )}
                </div>
                <div className={"w-full h-[10vh]"}>
                  <SolidityCode code={response} />
                </div>
              </div>
            </div>
          )}
        </div>
      </HeroHighlight>
    </main>
  );
}
const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f4f4f4",
    margin: "0",
    padding: "0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: "50px",
  },
};

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {children}
    </div>
  );
};
