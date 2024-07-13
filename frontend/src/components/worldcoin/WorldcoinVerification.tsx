"use client";
import { IDKitWidget, VerificationLevel, ISuccessResult } from "@worldcoin/idkit";
import type { VerifyReply } from "@/app/api/verify";

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

export default function WorldcoinVerification() {
  return (
    <IDKitWidget
      action={process.env.NEXT_PUBLIC_WLD_ACTION!}
      app_id={process.env.NEXT_PUBLIC_WLD_APP_ID as `app_${string}`}
      onSuccess={onSuccess}
      handleVerify={handleProof}
      verification_level={VerificationLevel.Orb}
    >
      {({ open }) => (
        <button className="border p-2 rounded" onClick={open}>
          Verify with World ID
        </button>
      )}
    </IDKitWidget>
  );
}