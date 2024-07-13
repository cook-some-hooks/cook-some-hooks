"use client";

import { useAccount, useDisconnect } from "wagmi";
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

export default function Home() {
  const { address, isConnected } = useAccount();

  const { disconnect } = useDisconnect();
  console.log(address);

  const [isTransitioned, setIsTransitioned] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState<Token[]>([]);

  const handleButtonClick = () => {
    setIsTransitioned(true);
  };

  const handleTokenSelect = (tokens: Token[]) => {
    setSelectedTokens(tokens);
  };

  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");

  function formatSolidityCode(code: any) {
    // Add line breaks after certain keywords and symbols
    code = code.replace(/(\{|\}|;)/g, "$1\n");
    code = code.replace(
      /(function|contract|modifier|event|struct|enum|library|interface|if|else|for|while|return|mapping|emit|require|assert|revert)/g,
      "\n$1"
    );

    // Remove excess white spaces and new lines
    code = code.replace(/\n\s*\n/g, "\n");
    code = code.replace(/\s*\n\s*/g, "\n");

    // Indentation logic
    let indent = 0;
    let formattedCode = "";
    const lines = code.split("\n");

    lines.forEach((line: any) => {
      line = line.trim();
      if (line) {
        if (line.includes("}")) {
          indent -= 1;
        }
        formattedCode += "    ".repeat(indent) + line + "\n";
        if (line.includes("{")) {
          indent += 1;
        }
      }
    });

    return formattedCode;
  }

  // Example usage
  const solidityCode =
    'contract HelloWorld { function sayHello() public pure returns (string memory) { return "Hello, World!"; } }';

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const res = await fetch("/api/chat", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    // const res = await fetch("/api/chat", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ prompt }),
    // });

    // const data = await res.json();

    setResponse(data.res);
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
              {selectedTokens.length === 2 && (
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-200">
                    Selected Pair:
                  </h3>
                  <div className="flex flex-col space-y-2">
                    {selectedTokens.map((token) => (
                      <div
                        key={token.address}
                        className="flex items-center space-x-2"
                      >
                        <div className="token-icon">
                          <Image
                            src={token.logoURI}
                            alt={token.name}
                            width={24}
                            height={24}
                          />
                        </div>
                        <span>
                          {token.name} ({token.symbol})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                className="bg-gradient-to-br relative group/btn from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
                type="submit"
                onClick={handleButtonClick}
              >
                Generate with OpenAI &rarr;
                <BottomGradient />
              </button>
            </form>
          </div>
          {isTransitioned && (
            <div className="h-[80vh] w-[60%]  overflow-scroll rounded-md border border-white/[0.2]  mt-10 flex items-center justify-center bg-gray-200 dark:bg-black transition-opacity duration-500">
              <div className="w-full h-full">
                {/* {response && response} */}
                <SolidityCode code={response} />
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
