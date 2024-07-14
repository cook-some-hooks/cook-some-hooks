# Contracts setup

## Setup

**Install dependencies**

```
cd contracts
cp template.env .env
npm install
```

Modify .env and add your private key for relevant network  
`PRIVATE_KEY_LOCALHOST` for local node
`PRIVATE_KEY_GALADRIEL` for Galadriel testnet

Rest of this README assumes you are in the `contracts` directory

## Deployment

### Deploy any contract

Get the [oracle address](https://docs.galadriel.com/oracle-address) from the docs and replace `<oracle address>` with
the address.  
Check the available example contracts in the [contracts](contracts) directory

**Compile the contracts**

```
npm run compile
```

**Deploy a contract**

```
npx hardhat deploy --network [network (galadriel or localhost)] --contract [contract name] --oracleaddress [oracle_address] [space separated extra constructor args]
# ChatGpt example
npx hardhat deploy --network galadriel --contract ChatGpt --oracleaddress [oracle_address] ""
# Dall-e example
npx hardhat deploy --network galadriel --contract DalleNft --oracleaddress [oracle_address] "system prompt"
# Groq localhost example (requires running a local node)
npx hardhat deploy --network localhost --contract GroqChatGpt --oracleaddress [oracle_address]
```

### Deploy quickstart on Galadriel devnet

Update `.env`:

- Add your private key to `PRIVATE_KEY_GALADRIEL`

- Add the [oracle address](http://docs.galadriel.com/oracle-address) to `ORACLE_ADDRESS`

**Deploy quickstart to Galadriel testnet**

npm run deployRAG

adding the address of the RAG contract to the .env file

npm run callRAG
