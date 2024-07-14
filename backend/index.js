const fs = require("fs");
const solc = require("solc");
const path = require("path");
const express = require("express");
const cors = require("cors");
const compileContract = require("./compileContract");

// Express server setup
const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

app.post("/compile", (req, res) => {
  const { sourceCode } = req.body;

  if (!sourceCode) {
    return res.status(400).json({ error: "No source code provided" });
  }

  try {
    const compiledContract = compileContract(
      JSON.parse(JSON.stringify(sourceCode[0]))
    );

    res.json({
      message: "Compilation successful",
      files: {
        abi: compiledContract.abi,
        bytecode: compiledContract.bytecode,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
