// Import ethers from Hardhat package
import readline from "readline";

const {ethers} = require("hardhat");

async function main() {
    const contractABI = [
        "function sendMessage(string memory _message) public",
        "function response() public view returns (string)"
      ];

  if (!process.env.SIMPLELLM_CONTRACT_ADDRESS) {
    throw new Error("SIMPLELLM_CONTRACT_ADDRESS env variable is not set.");
  }

  const contractAddress = process.env.SIMPLELLM_CONTRACT_ADDRESS;
  const [signer] = await ethers.getSigners();

  // Create a contract instance
  const contract = new ethers.Contract(contractAddress, contractABI, signer);

  // The content of the image you want to generate
  const message = await getUserInput();

  // Call the startChat function
  const transactionResponse = await contract.sendMessage(message);
  const receipt = await transactionResponse.wait();
  console.log(`Transaction sent, hash: ${receipt.hash}.\nExplorer: https://explorer.galadriel.com/tx/${receipt.hash}`)
  console.log(`Image generation started with message: "${message}"`);

  // loop and sleep by 1000ms, and keep printing `lastResponse` in the contract.
  let response = await contract.response();
  let newResponse = response;

  // print w/o newline
  console.log("Waiting for response: ");
  while (newResponse === response) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    newResponse = await contract.response();
    console.log(".");
  }

  console.log(`Response: ${newResponse}`)

}

async function getUserInput(): Promise<string | undefined> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(query, (answer) => {
        resolve(answer)
      })
    })
  }

  try {
    const input = await question("Prompt: ")
    rl.close()
    return input
  } catch (err) {
    console.error('Error getting user input:', err)
    rl.close()
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });