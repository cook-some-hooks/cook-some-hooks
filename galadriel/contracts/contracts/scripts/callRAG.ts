import {Contract, ethers, TransactionReceipt, Wallet} from "ethers";
import ABI from "./abis/AnthropicChatGpt.json";
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

require("dotenv").config()

interface Message {
  role: string,
  content: string,
}

async function queryLlm(contract: Contract, message: string, knowledgeBase: string) {

  const transactionResponse = await contract.startChat(message, "QmQdCYPy9Y3cyHPSUR1fGBw1WD5q8o5gGhWEtCYQixdSHs")
  const receipt = await transactionResponse.wait()
  console.log(`Message sent, tx hash: ${receipt.hash}`)
  console.log(`Chat started with message: "${message}"`)

  // Get the chat ID from transaction receipt logs
  let chatId = getChatId(receipt, contract);
  console.log(`Created chat ID: ${chatId}`)
  if (!chatId && chatId !== 0) {
    return
  }

  let allMessages: Message[] = []

  // Run the chat loop: read messages and send messages
  while (true) {
    const newMessages: Message[] = await getNewMessages(contract, chatId, allMessages.length);
    if (newMessages) {
      for (let message of newMessages) {
        if (message.role == "assistant") {
            console.log("Assistant finished generating code")
            return message.content;
        }
      }
    }
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}

async function main() {

  const rpcUrl = process.env.RPC_URL
  if (!rpcUrl) throw Error("Missing RPC_URL in .env")
  const privateKey = process.env.PRIVATE_KEY_GALADRIEL
  if (!privateKey) throw Error("Missing PRIVATE_KEY in .env")
  const contractAddress = process.env.RAG_CONTRACT_ADDRESS
  if (!contractAddress) throw Error("Missing CHAT_CONTRACT_ADDRESS in .env")

  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const wallet = new Wallet(
    privateKey, provider
  )
  const contract = new Contract(contractAddress, ABI, wallet)

  const userMessage = await getUserInput();
  if (!userMessage) {
    console.error("No message provided.")
    return
  }

  let message = "Based on what I want to build what are the best codes to be used in the project? \
  Only output their filenames in a list format. \
  [example]:\
  userMessage: \
  I want to build whitelist hook with gaz prices\
  response: \
  ['WhiteListHook.sol', 'GasPriceFeesHook.sol']\
  \
  Here is the userMessage: " + userMessage + "\
  \
  Here is the response: ";

  let hookSelection = await queryLlm(contract, message, "QmTvH9Qh2Hd84iyUsFj2cMxKUaAgUFd7Qox4FsAAW7CnUt")
  if (!hookSelection) {
    console.error("No response from LLM")
    return
  }
  hookSelection = hookSelection.trim().replace(/```/g, '').replace(/'/g, '"');
  try {
    const hookSelectionList: string[] = JSON.parse(hookSelection);
    console.log(hookSelectionList);
  } catch (error) {
    console.error("Failed to parse response as JSON:", error);
  }

  message = "Build a hook, using your general knowledge and the codes that are provided to you \
  I want to build a:" + userMessage + "\
  You have have allready made of the hooks that are usefull for you: \
  hooks: " + hookSelection + "\
  Only output a solidity code for the hook you want to build. Nothing more!!!\
  After writing the solodity do not provide any comments or explanations. Just the code."

  let attemptCounter = 0;
  let returnCode = -1;
  let result = "the hook was not able to compute";

  while (attemptCounter < 5 && returnCode !== 0) {
    const fileName = `NewHook.sol`;

    let response = await queryLlm(contract, message, "QmQiUb8Rwwv1SKn2nvnWeq9WaHRdmSXc4WWUqMKs6uuxSU")
    
    console.log(response);
    if (!response) {
      console.error("No response from LLM")
      return
    }
    const solidityCodeMatch = response.match(/```solidity([\s\S]*?)```/);
    let solidityCode: string | undefined;
  
    if (solidityCodeMatch && solidityCodeMatch[1]) {
      solidityCode = solidityCodeMatch[1].trim();
    } else {
      console.error("No Solidity code found in the response.");
      return;
    }

    console.log("solidity code: ", solidityCode);
    saveToSol(solidityCode, "", "NewHook.sol");

    try {
      const { stdout, stderr, returncode } = await compileContract(fileName);
      result = "the hook was able to compute";
      break;
    } catch (error) {
      console.error("Error compiling contract:", error);
      message = `
      Here is the solidity code: \n\n${solidityCode}\n\n
      I get this error when compiling the contract: \n\n${error}\n\nOUTPUT: Only the fixed solidity code
      `;
    }
    attemptCounter += 1;
  }

  console.log(result);
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
    const input = await question("Message ChatGPT: ")
    rl.close()
    return input
  } catch (err) {
    console.error('Error getting user input:', err)
    rl.close()
  }
}

function getChatId(receipt: TransactionReceipt, contract: Contract) {
  let chatId
  for (const log of receipt.logs) {
    try {
      const parsedLog = contract.interface.parseLog(log)
      if (parsedLog && parsedLog.name === "ChatCreated") {
        // Second event argument
        chatId = ethers.toNumber(parsedLog.args[1])
      }
    } catch (error) {
      // This log might not have been from your contract, or it might be an anonymous log
      console.log("Could not parse log:", log)
    }
  }
  return chatId;
}

async function getNewMessages(
  contract: Contract,
  chatId: number,
  currentMessagesCount: number
): Promise<Message[]> {
  const messages = await contract.getMessageHistory(chatId)

  const newMessages: Message[] = []
  messages.forEach((message: any, i: number) => {
    if (i >= currentMessagesCount) {
      newMessages.push(
        {
          role: message[0],
          content: message.content[0].value,
        }
      );
    }
  })
  return newMessages;
}

function saveToSol(content: string, folderPath: string, fileName: string): void {
  // Ensure the file has the .sol extension
  if (!fileName.endsWith('.sol')) {
      fileName += '.sol';
  }

  // Combine the folder path and file name to get the full file path
  const filePath = path.join(folderPath, fileName);
  
  // Open the file in write mode and write the content
  fs.writeFileSync(filePath, content);

  console.log(`File ${filePath} has been created and saved successfully.`);
}

function compileContract(fileToBuild: string): Promise<{ stdout: string, stderr: string, returncode: number }> {
  const command = `forge build src/generated/${fileToBuild}`;
  const workingDirectory = '/Users/tanguyvans/Desktop/hackathon/eth_bxl/cook-some-hooks/foundry_hook_playground';

  return new Promise((resolve, reject) => {
      exec(command, { cwd: workingDirectory }, (error, stdout, stderr) => {
          if (error) {
              reject({ stdout, stderr, returncode: error.code });
          } else {
              resolve({ stdout, stderr, returncode: 0 });
          }
      });
  });
}

main()
