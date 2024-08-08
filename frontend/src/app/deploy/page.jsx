"use client";
import * as React from "react";
import { useSignMessage } from "wagmi";
import { recoverMessageAddress } from "viem";

export default function SignMessage() {
  const recoveredAddress = React.useRef("");
  const {
    data: signMessageData,
    error,
    isLoading,
    signMessage,
    variables,
  } = useSignMessage();

  React.useEffect(() => {
    (async () => {
      if (variables?.message && signMessageData) {
        const recoveredAddress = await recoverMessageAddress({
          message: variables?.message,
          signature: signMessageData,
        });
        // setRecoveredAddress(recoveredAddress);
      }
    })();
  }, [signMessageData, variables?.message]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        const options = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: '{"contractAddress":"0x3fe705dB02B0B269980D5680966Bb0F02ea5f906","operatorAddress":"0xe8c00218344F0e48eF3D41A0c5539E7eF04157a6"}',
        };

        fetch(
          "https://waitlist-api.develop.testblast.io/v1/dapp-auth/challenge",
          options
        )
          .then((response) => response.json())
          .then((response) => {
            console.log(response);
            signChallengeData(wallet, response.challengeData)
              .then((signature) => {
                console.log("Signature:", signature);
              })
              .catch((error) => {
                console.error("Error signing message:", error);
              });
          })
          .catch((err) => console.error(err));
      }}
    >
      <label htmlFor="message">Enter a message to sign</label>
      <textarea
        id="message"
        name="message"
        placeholder="The quick brown fox…"
      />
      <button disabled={isLoading}>
        {isLoading ? "Check Wallet" : "Sign Message"}
      </button>

      {signMessageData && (
        <div>
          <div>Recovered Address: {recoveredAddress.current}</div>
          <div>Signature: {signMessageData}</div>
        </div>
      )}

      {error && <div>{error.message}</div>}
    </form>
  );
}
