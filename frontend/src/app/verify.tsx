'use client'; // for Next.js app router
import { IDKitWidget, VerificationLevel, ISuccessResult } from '@worldcoin/idkit';
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

const verifyEndpoint = `${process.env.NEXT_PUBLIC_WLD_API_BASE_URL}/api/v1/verify/${process.env.NEXT_PUBLIC_WLD_APP_ID}`;

interface VerifyProps {
  onSuccess: () => void;
}

const Verify: React.FC<VerifyProps> = ({ onSuccess }) => {
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
        onSuccess(); // Call the onSuccess prop when verification is successful
      } else {
        throw new Error(wldResponse.detail || "Verification failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      throw new Error("Verification failed");
    }
  };

  return (
    <IDKitWidget
      app_id={process.env.NEXT_PUBLIC_WLD_APP_ID!} // obtained from the Developer Portal
      action={process.env.NEXT_PUBLIC_WLD_ACTION!} // obtained from the Developer Portal
      onSuccess={onSuccess} // callback when the modal is closed
      handleVerify={handleVerify} // callback when the proof is received
      verification_level={VerificationLevel.Orb}
    >
      {({ open }) => (
        <button onClick={open}>Verify with World ID</button>
      )}
    </IDKitWidget>
  );
};

export default Verify;