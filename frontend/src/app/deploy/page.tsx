"use client";

import React, { useEffect, useState } from "react";
import { DeployContract } from "./deploy";
import { NavbarApp } from "@/components/NavbarApp";
import { HeroHighlight } from "@/components/ui/hero-highlight";

export default function DeployPage() {
  const [sourceCode, setSourceCode] = useState("");
  useEffect(() => {}, [sourceCode]);
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-black">
      <NavbarApp />
      <HeroHighlight className="w-full">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-white">
            Deploy Your Smart Contract
          </h1>
          <textarea
            className="text-black w-full h-40"
            placeholder="Enter your code here "
            value={sourceCode}
            onChange={(e) => {
              setSourceCode(e.target.value);
            }}
          ></textarea>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            {sourceCode && <DeployContract sourceCode={sourceCode} />}
          </div>
        </div>
      </HeroHighlight>
    </main>
  );
}
