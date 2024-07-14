// solc compiler
solc = require("solc");

// file reader
fs = require("fs");

// Creation of Web3 class
Web3 = require("web3");

// Setting up a HttpProvider
// web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

// Reading the file

const compileContract = (file) => {
  // Input structure for solidity compiler
  console.log(file);
  var input = {
    language: "Solidity",
    sources: {
      "SimpleStorage.sol": {
        content: file,
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

  var output = JSON.parse(solc.compile(JSON.stringify(input)));
  console.log("Result : ", output);

  // Extract ABI and bytecode
  const contract = output.contracts["SimpleStorage.sol"];
  console.log(contract);
  const abi = contract.Storage.abi;
  const bytecode = contract.Storage.evm.bytecode.object;
  console.log("Bytecode:" + bytecode);
  // console.log("ABI: ", abi);
  return { abi, bytecode };
};

module.exports = compileContract;
