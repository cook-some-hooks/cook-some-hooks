import { useWeb3Modal } from "@web3modal/wagmi/react";

export default function ConnectButton() {
  const modal = useWeb3Modal();

  return (
    <button className="inline-flex h-12 animate-shimmer items-center justify-center rounded-md border border-slate-800 bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
      {/* <button onClick={() => modal.open()}>Connect Wallet</button> */}

      <button
        className="cursor-pointer inline-flex h-12 animate-shimmer items-center justify-center rounded-md border border-white/[0.2] bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-slate-50"
        onClick={() => modal.open()}
      >
        Connect Wallet
      </button>
    </button>
  );
}
