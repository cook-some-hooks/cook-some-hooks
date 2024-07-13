import {ethers} from "hardhat";


async function main() {
  if (!process.env.ORACLE_ADDRESS) {
    throw new Error("ORACLE_ADDRESS env variable is not set.");
  }
  const oracleAddress: string = process.env.ORACLE_ADDRESS;
  await deploySimpleLlm(oracleAddress);
}


async function deploySimpleLlm(oracleAddress: string) {
  const agent = await ethers.deployContract("SimpleLLM", [oracleAddress], {}); // OpenAiSimpleLLM, AnthropicSimpleLLM

  await agent.waitForDeployment();

  console.log(`Quickstart contract deployed to ${agent.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
