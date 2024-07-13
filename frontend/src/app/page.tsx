"use client";
import { HeroHighlightComponent } from "@/components/hero-highlight";
import Connect from "../components/connect";
import { useAccount, useDisconnect } from "wagmi";
import { NavbarComp } from "@/components/Navbar";
import { FollowerPointerCard } from "@/components/ui/following-pointer";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  console.log(address);
  return (
    <main className="">
      <FollowerPointerCard>
        <NavbarComp />
        <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
          {/* <p>My dApp</p> */}
        </div>
        <div>
          {/* {isConnected && (
          <button className="border p-2 rounded" onClick={() => disconnect()}>
            Disconnect
          </button>
        )} */}
        </div>
        {/* <div className="relative z-[-1] flex place-items-center before:absolute before:h-[300px] before:w-full before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 sm:before:w-[480px] sm:after:w-[240px] before:lg:h-[360px]">
        {isConnected ? (
          <div>{address}</div>
        ) : (
          <div>
            <p>please connect lol</p>
          </div>
        )}
      </div> */}
        <HeroHighlightComponent />
      </FollowerPointerCard>
    </main>
  );
}
