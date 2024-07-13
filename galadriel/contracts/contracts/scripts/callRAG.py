import os
import time
from web3 import Web3
from dotenv import load_dotenv
import settings
import json

load_dotenv()

w3 = Web3(Web3.HTTPProvider(settings.RPC_URL))
contract_address = settings.RAG_CONTRACT_ADDRESS
private_key = settings.PRIVATE_KEY

if not w3.is_connected():
    raise ConnectionError("Failed to connect to the Ethereum testnet")

# Get the account from the private key
account = w3.eth.account.from_key(private_key)
w3.eth.default_account = account.address

with open("abis/AnthropicChatGpt.json", "r") as f:
    contract_abi = json.load(f)

# Create contract instance
contract = w3.eth.contract(address=contract_address, abi=contract_abi)


def get_user_input(prompt):
    return input(prompt)

def get_chat_id(receipt):
    chat_id = None
    for log in receipt['logs']:
        try:
            # Parse the log using the event object
            parsed_log = contract.events.ChatCreated()

            print(parsed_log)
            if parsed_log and parsed_log['event'] == "ChatCreated":
                chat_id = parsed_log['args']['chatId']
        except Exception as e:
            print(f"Could not parse log: {log}, error: {e}")
    return chat_id

def get_new_messages(chat_id, current_messages_count):
    messages = contract.functions.getMessageHistory(chat_id).call()
    new_messages = []
    for i, message in enumerate(messages):
        if i >= current_messages_count:
            new_messages.append({
                'role': message[0],
                'content': message[1]
            })
    return new_messages

def main():
    message = get_user_input("Message ChatGPT: ")

    # Send transaction
    tx = contract.functions.startChat(message).build_transaction({
        'from': account.address,
        'nonce': w3.eth.get_transaction_count(account.address),
        'gas': 2000000,
        'gasPrice': w3.to_wei('50', 'gwei')
    })

    signed_tx = w3.eth.account.sign_transaction(tx, private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"Message sent, tx hash: {receipt.transactionHash.hex()}")
    print(f"Chat started with message: \"{message}\"")

    # Get the chat ID from transaction receipt logs
    chat_id = get_chat_id(receipt)
    print(f"Created chat ID: {chat_id}")
    if chat_id is None:
        return

    all_messages = []
    hook_code = ""
    finished = False

    # Run the chat loop: read messages and send messages
    while not finished:
        new_messages = get_new_messages(chat_id, len(all_messages))
        if new_messages:
            for message in new_messages:
                if message['role'] == "assistant":
                    print("Assistant finished generating code")
                    hook_code = message['content']
                    finished = True
                    break
                all_messages.append(message)
                if all_messages[-1]['role'] == "assistant":
                    message = get_user_input("Message ChatGPT: ")
                    tx = contract.functions.addMessage(message, chat_id).build_transaction({
                        'from': account.address,
                        'nonce': w3.eth.get_transaction_count(account.address),
                        'gas': 2000000,
                        'gasPrice': w3.to_wei('50', 'gwei')
                    })
                    signed_tx = w3.eth.account.sign_transaction(tx, private_key)
                    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
                    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
                    print(f"Message sent, tx hash: {receipt.transactionHash.hex()}")

        time.sleep(2)

    print(hook_code)

if __name__ == "__main__":
    main()