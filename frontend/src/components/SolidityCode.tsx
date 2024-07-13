import React from "react";

const SolidityCode = ({ code }: any) => {
  return <pre style={styles.pre}>{code}</pre>;
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
