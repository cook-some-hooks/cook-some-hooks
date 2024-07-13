"use client";
import Connect from "../components/connect";
import { useAccount, useDisconnect } from "wagmi";

import { NavbarComp } from "@/components/Navbar";
import { FollowerPointerCard } from "@/components/ui/following-pointer";


import { IDKitWidget, VerificationLevel, ISuccessResult } from "@worldcoin/idkit";
import type { VerifyReply } from "./api/verify";
import { HeroHighlightComponent } from "@/components/hero-highlight";

const handleProof = async (result: ISuccessResult) => {
  console.log("Proof received from IDKit:\n", JSON.stringify(result)); 
  const reqBody = {
    merkle_root: result.merkle_root,
    nullifier_hash: result.nullifier_hash,
    proof: result.proof,
    verification_level: result.verification_level,
    action: process.env.NEXT_PUBLIC_WLD_ACTION,
    signal: "",
  };
  console.log("Sending proof to backend for verification:\n", JSON.stringify(reqBody));
  const res: Response = await fetch("/api/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reqBody),
  });
  const data: VerifyReply = await res.json();
  if (res.status == 200) {
    console.log("Successful response from backend:\n", data); 
  } else {
    throw new Error(`Error code ${res.status} (${data.code}): ${data.detail}` ?? "Unknown error.");
  }
};

const onSuccess = () => {
  window.location.href = "/success";
};

export default function Home() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  console.log(address);
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">      <FollowerPointerCard>
    <NavbarComp />

      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p>My dApp</p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:size-auto lg:bg-none">
          <Connect />
        </div>
      </div>
      <div>
        {isConnected && (
          <button className="border p-2 rounded" onClick={() => disconnect()}>
            Disconnect
          </button>
        )}
      </div>
        )} */}
        </div>
        {/* <div className="relative z-[-1] flex place-items-center before:absolute before:h-[300px] before:w-full before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 sm:before:w-[480px] sm:after:w-[240px] before:lg:h-[360px]">        {isConnected ? (
          <div>{address}</div>
        ) : (
          <div>
            <p>please connect lol</p>
          </div>
        )}

      </div>        <HeroHighlightComponent />
      </FollowerPointerCard>
    </main>
  );
}
