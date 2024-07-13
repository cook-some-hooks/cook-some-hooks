import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";

import { cookieStorage, createStorage } from "wagmi";
import { mainnet, sepolia, baseSepolia, optimismSepolia } from "wagmi/chains";

// Get projectId from https://cloud.walletconnect.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) throw new Error("Project ID is not defined");

const metadata = {
  name: "Cook a Hook",
  description: "Let them cook",
  url: "https://web3modal.com", // origin must match your domain & subdomain
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// Create wagmiConfig
const chains = [mainnet, sepolia, baseSepolia, optimismSepolia ] as const;
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  auth: {
    email: true, // default to true
    socials: ['google', 'x', 'github', 'discord', 'apple'],
    showWallets: false, // default to true
    walletFeatures: false // default to true
  },
  storage: createStorage({
    storage: cookieStorage,
  }),
});
