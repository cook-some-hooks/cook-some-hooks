"use client";

import Connect from "../../components/connect";
import { useAccount, useDisconnect } from "wagmi";
import React, { useState } from "react";

import { cn } from "../../../lib/utils";
import { FollowerPointerCard } from "@/components/ui/following-pointer";
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

export default function Home() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  console.log(address);

  const [isTransitioned, setIsTransitioned] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState<Token[]>([]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted");
    console.log("Selected Tokens:", selectedTokens);
  };

  const handleButtonClick = () => {
    setIsTransitioned(true);
  };

  const handleTokenSelect = (tokens: Token[]) => {
    setSelectedTokens(tokens);
  };

  return (
    <main className="">
      <NavbarApp />
      <HeroHighlight className="w-full">
        <div
          className={`flex flex-row items-center justify-center transition-all duration-500 ${
            isTransitioned
              ? "justify-start mx-auto max-w-screen-xl flex flex-row items-center gap-2 p-4"
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
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
                <LabelInputContainer>
                  <CoinSelector onSelectTokens={handleTokenSelect} />
                </LabelInputContainer>
                <LabelInputContainer>
                  <Select>
                    <option value="1">1</option>
                  </Select>
                </LabelInputContainer>
              </div>
              <LabelInputContainer className="mb-4">
                <Label htmlFor="prompt">Hook prompt</Label>
                <TextArea
                  id="prompt"
                  placeholder="Enter your prompt here for cooking your hook"
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
              {/* <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" /> */}
            </form>
          </div>
          {isTransitioned && (
            <div className="w-[60%] rounded-md border border-white/[0.2] h-[80vh] mt-10 flex items-center justify-center bg-gray-200 dark:bg-black transition-opacity duration-500">
              <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
                New Content Here
              </h2>
            </div>
          )}
        </div>
      </HeroHighlight>
    </main>
  );
}

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