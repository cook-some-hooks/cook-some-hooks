import React, { useState } from "react";
import solc from "solc";

export default function CompileCode({ code }: any) {
  const [output, setOutput] = useState("");

  const compile = () => {
    const input = {
      language: "Solidity",
      sources: {
        "contract.sol": {
          content: code,
        },
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["*"],
          },
        },
      },
    };

    const compiledCode = JSON.parse(solc.compile(JSON.stringify(input)));
    setOutput(JSON.stringify(compiledCode, null, 2));
  };

  return (
    <div>
      <button onClick={compile} style={styles.button}>
        Compile
      </button>
      {output && <pre style={styles.pre}>{output}</pre>}
    </div>
  );
}

const styles = {
  button: {
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "20px",
  },
  pre: {
    backgroundColor: "#282c34",
    color: "#61dafb",
    padding: "15px",
    borderRadius: "5px",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    marginTop: "20px",
  },
};
