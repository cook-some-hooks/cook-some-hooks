"use client";
import React, { useState } from "react";
import { HoveredLink, Menu, MenuItem, ProductItem } from "./ui/navbar-menu";
import { cn } from "../../lib/utils";
import ConnectButton from "./connect";
import { useRouter } from "next/navigation";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { useAccount, useDisconnect } from "wagmi";

export function NavbarApp() {
  const modal = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const navigate = useRouter();
  const { disconnect } = useDisconnect();
  function shortenAddress(address: string) {
    if (!address) return "";
    const start = address.slice(0, 6);
    const end = address.slice(-4);
    return `${start}...${end}`;
  }
  return (
    <nav className="bg-white border-gray-200 dark:bg-black bg-opacity-15 bg-transparent backdrop-blur-sm">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <a className="flex items-center ">
          <img src="/logo.png" className="h-14" alt=" Logo" />
          <span className="self-center text-2xl font-Jetmono whitespace-nowrap dark:text-white">
            'Cook some Hook
          </span>
        </a>

        <div className=" w-full md:block md:w-auto" id="navbar-default">
          <ul className="font-Jetmono font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-black dark:border-gray-700">
            <li>
              {/* <a
                href="#"
                className="block py-2 px-3 text-black rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
              >
                About
              </a> */}
              {!isConnected && (
                <button
                  className="cursor-pointer inline-flex h-12 animate-shimmer items-center justify-center rounded-md border border-white bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-slate-50"
                  onClick={() => modal.open()}
                >
                  Connect Wallet
                </button>
              )}
              {isConnected && (
                <div>
                  {shortenAddress(address || "")}{" "}
                  <span
                    className="text-red-500 px-5"
                    onClick={() => disconnect()}
                  >
                    X
                  </span>
                </div>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
