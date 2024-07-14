"use client"; // for Next.js app router
import {
  IDKitWidget,
  VerificationLevel,
  ISuccessResult,
} from "@worldcoin/idkit";
import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    externalResolver: true,
  },
};

export type VerifyReply = {
  code: string;
  detail: string;
};
interface Props {
  setIsWorldcoinVerified: boolean;
  isWorldcoinVerified: boolean;
}

const verifyEndpoint = `${process.env.NEXT_PUBLIC_WLD_API_BASE_URL}/api/v1/verify/${process.env.NEXT_PUBLIC_WLD_APP_ID}`;

const Verify: React.FC<Props> = ({
  setIsWorldcoinVerified,
  isWorldcoinVerified,
}) => {
  const handleVerify = async (proof: ISuccessResult) => {
    console.log("Received request to verify credential:\n", proof);
    const reqBody = {
      nullifier_hash: proof.nullifier_hash,
      merkle_root: proof.merkle_root,
      proof: proof.proof,
      verification_level: proof.verification_level,
      action: process.env.NEXT_PUBLIC_WLD_ACTION,
    };
    console.log("Sending request to World ID /verify endpoint:\n", reqBody);

    try {
      const verifyRes = await fetch(verifyEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reqBody),
      });

      const wldResponse = await verifyRes.json();
      console.log(
        `Received ${verifyRes.status} response from World ID /verify endpoint:\n`,
        wldResponse
      );

      if (verifyRes.status === 200) {
        console.log(
          "Credential verified! This user's nullifier hash is: ",
          wldResponse.nullifier_hash
        );
        setIsWorldcoinVerified(true);
      } else {
        throw new Error(wldResponse.detail || "Verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      throw new Error("Verification failed");
    }
  };
  const verifyProof = async (proof: any) => {
    throw new Error("TODO: verify proof server route");
  };

  // // TODO: Functionality after verifying
  // const onSuccess = () => {
  //   console.log("Success");
  // };

  return (
    <IDKitWidget
      app_id={process.env.NEXT_PUBLIC_WLD_APP_ID!} // obtained from the Developer Portal
      action={process.env.NEXT_PUBLIC_WLD_ACTION!} // obtained from the Developer Portal
      verification_level={VerificationLevel.Device}
      // handleVerify={verifyProof}
      onSuccess={() => {
        setIsWorldcoinVerified(true);
      }}
    >
      {({ open }) => (
        <button
          className={`inline-flex h-10 w-full mt-10  animate-shimmer items-center justify-center rounded-md border border-white/[0.2] bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-slate-50 ${isWorldcoinVerified ? "hidden" : ""}`}
          onClick={open}
        >
          Verify with worldID to deploy
        </button>
      )}
    </IDKitWidget>
  );
};

export default Verify;
