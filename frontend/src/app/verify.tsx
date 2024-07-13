'use client'; // for Next.js app router
import { IDKitWidget, VerificationLevel, ISuccessResult } from '@worldcoin/idkit';

const handleVerify = async (proof: ISuccessResult) => {
    const res = await fetch("/api/verify", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(proof),
    });
    if (!res.ok) {
        throw new Error("Verification failed.");
    }
};

const onSuccess = () => {
    window.location.href = "/success";
};

const Verify = () => (
    <IDKitWidget
        app_id={process.env.NEXT_PUBLIC_WLD_APP_ID!} // obtained from the Developer Portal
        action={process.env.NEXT_PUBLIC_WLD_ACTION!} // obtained from the Developer Portal
        onSuccess={onSuccess} // callback when the modal is closed
        handleVerify={handleVerify} // callback when the proof is received
        verification_level={VerificationLevel.Orb}
    >
        {({ open }) => 
            <button onClick={open}>Verify with World ID</button>
        }
    </IDKitWidget>
);

export default Verify;