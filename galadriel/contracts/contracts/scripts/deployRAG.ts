import {ethers} from "hardhat";

async function main() {
    if (!process.env.ORACLE_ADDRESS) {
        throw new Error("ORACLE_ADDRESS env variable is not set.");
    }
    const oracleAddress: string = process.env.ORACLE_ADDRESS;
    const contractName = "AnthropicChatGpt" // ChatGpt AnthropicChatGpt
    console.log()
    await deployChatGptWithKnowledgeBase(contractName, oracleAddress, "QmQdCYPy9Y3cyHPSUR1fGBw1WD5q8o5gGhWEtCYQixdSHs");
}

async function deployChatGptWithKnowledgeBase(contractName: string, oracleAddress: string, knowledgeBaseCID: string) {
  const agent = await ethers.deployContract(contractName, [oracleAddress, knowledgeBaseCID], {});

  await agent.waitForDeployment();

  console.log(
    `${contractName} deployed to ${agent.target} with knowledge base "${knowledgeBaseCID}"`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});