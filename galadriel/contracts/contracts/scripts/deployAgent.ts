import {ethers} from "hardhat";

const AGENT_PROMPT = "You are a helpful assistant";

async function main() {

    if (!process.env.ORACLE_ADDRESS) {
        throw new Error("ORACLE_ADDRESS env variable is not set.");
    }
    const oracleAddress: string = process.env.ORACLE_ADDRESS;
    await deployAgent(oracleAddress);
}

async function deployAgent(oracleAddress: string) {
  const agent = await ethers.deployContract(
    "Agent",
    [
      oracleAddress,
      AGENT_PROMPT
    ], {});

  await agent.waitForDeployment();

  console.log(
    `Agent deployed to ${agent.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
