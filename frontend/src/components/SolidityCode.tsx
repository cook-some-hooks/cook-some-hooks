import React from "react";
import TypewriterEffect from "./ui/typewriter-effect";

const SolidityCode = ({ code }: any) => {
  // const words = code
  //   .split(/\s+/)
  //   .filter((word: any) => word.length > 0)
  //   .map((word: any) => ({ text: word }));

  return (
    <pre style={styles.pre} className="h-[75vh]">
      {/* {code} */}
      <TypewriterEffect text={code} speed={30} />
      {/* {code} */}
    </pre>
  );
};

const styles = {
  pre: {
    backgroundColor: "#282c34",
    color: "#61dafb",
    padding: "15px",
    borderRadius: "5px",
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
  },
};

export default SolidityCode;
