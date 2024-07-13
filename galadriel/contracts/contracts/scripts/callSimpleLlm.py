import os
import time
from web3 import Web3
from dotenv import load_dotenv
import settings

load_dotenv()

w3 = Web3(Web3.HTTPProvider(settings.RPC_URL))
contract_address = settings.QUICKSTART_CONTRACT_ADDRESS
private_key = settings.PRIVATE_KEY

if not w3.is_connected():
    raise ConnectionError("Failed to connect to the Ethereum testnet")

# Contract ABI
contract_abi = [
    {
        "constant": False,
        "inputs": [
            {
                "name": "_message",
                "type": "string"
            }
        ],
        "name": "sendMessage",
        "outputs": [],
        "payable": False,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": True,
        "inputs": [],
        "name": "response",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": False,
        "stateMutability": "view",
        "type": "function"
    }
]

# Get the account from the private key
account = w3.eth.account.from_key(private_key)
w3.eth.default_account = account.address

# Create contract instance
contract = w3.eth.contract(address=contract_address, abi=contract_abi)

def get_user_input():
    return input("Prompt: ")

def main():
    message = get_user_input()

    # Send transaction
    tx = contract.functions.sendMessage(message).build_transaction({
        'from': account.address,
        'nonce': w3.eth.get_transaction_count(account.address),
        'gas': 2000000,
        'gasPrice': w3.to_wei('50', 'gwei')
    })

    signed_tx = w3.eth.account.sign_transaction(tx, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Transaction sent, hash: {receipt.transactionHash.hex()}.\nExplorer: https://explorer.galadriel.com/tx/{receipt.transactionHash.hex()}")
    print(f"Response: \"{message}\"")

    # Poll for response
    response = contract.functions.response().call()
    new_response = response

    print("Waiting for response: ", end="", flush=True)
    while new_response == response:
        time.sleep(1)
        new_response = contract.functions.response().call()
        print(".", end="", flush=True)

    print(f"\nResponse: {new_response}")

if __name__ == "__main__":
    main()