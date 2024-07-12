import os
import json
from web3 import Web3
from solcx import compile_standard, install_solc
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Load settings
CHAIN_ID = int(os.getenv("CHAIN_ID", "696969"))
RPC_URL = os.getenv("RPC_URL", "https://devnet.galadriel.com")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")
ORACLE_ADDRESS = os.getenv("ORACLE_ADDRESS")

if not ORACLE_ADDRESS:
    raise ValueError("ORACLE_ADDRESS env variable is not set.")

# Connect to the Ethereum node
web3 = Web3(Web3.HTTPProvider(RPC_URL))
if not web3.is_connected():
    raise ConnectionError("Failed to connect to the Ethereum node.")

# Get the account from the private key
account = web3.eth.account.from_key(PRIVATE_KEY)

# Compile the contract
install_solc('0.8.0')
with open("contracts/OpenAiSimpleLLM.sol", "r") as file:
    contract_source_code = file.read()

compiled_sol = compile_standard({
    "language": "Solidity",
    "sources": {
        "OpenAiSimpleLLM.sol": {
            "content": contract_source_code
        }
    },
    "settings": {
        "outputSelection": {
            "*": {
                "*": ["abi", "metadata", "evm.bytecode", "evm.sourceMap"]
            }
        }
    }
}, solc_version='0.8.0')

# Get contract data
contract_id, contract_interface = compiled_sol['contracts']['OpenAiSimpleLLM.sol']['OpenAiSimpleLLM'].items()
bytecode = contract_interface['evm']['bytecode']['object']
abi = contract_interface['abi']

# Create the contract instance
OpenAiSimpleLLM = web3.eth.contract(abi=abi, bytecode=bytecode)

# Build the transaction
transaction = OpenAiSimpleLLM.constructor(ORACLE_ADDRESS).buildTransaction({
    'chainId': CHAIN_ID,
    'gas': 2000000,
    'gasPrice': web3.toWei('20', 'gwei'),
    'nonce': web3.eth.getTransactionCount(account.address),
})

# Sign the transaction
signed_txn = web3.eth.account.sign_transaction(transaction, private_key=PRIVATE_KEY)

# Send the transaction
tx_hash = web3.eth.sendRawTransaction(signed_txn.rawTransaction)

# Wait for the transaction receipt
tx_receipt = web3.eth.waitForTransactionReceipt(tx_hash)

print(f"OpenAiSimpleLLM contract deployed to {tx_receipt.contractAddress}")
