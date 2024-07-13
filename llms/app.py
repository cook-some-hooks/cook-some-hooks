import json
import os
import random
import subprocess

from dotenv import load_dotenv, find_dotenv
from IPython.display import display, Markdown
from openai import OpenAI
import tiktoken
from flask import Flask, request, jsonify
from anthropic import Anthropic

from functions import *

load_dotenv(find_dotenv())

OpenAI_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
Anthropic_client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"),
)

file_path = 'instructions.txt'
instructions = read_file(file_path)

folder_path = '../foundry_hook_playground/src/examples'
file_to_code = read_all_files_in_folder(folder_path)

with open("hook_examples.json", 'r') as file:
    hook_examples_json = json.load(file)

rag_instructions = f"""
    You have a JSON object mapping file names to summaries:

    {hook_examples_json}

    You will receive a user prompt and your task is to determine which Solidity files are most relevant to the prompt.

    ### Instructions:

    1. **Analyze the user prompt**: Understand the key concepts and requirements from the user's prompt.
    2. **Match with summaries**: Compare these key concepts with the summaries provided in the JSON object.
    3. **Evaluate relevance**: Assign a confidence level to each file based on how well it matches the user's prompt. Use the following confidence levels:
    - High: Very relevant to the prompt
    - Medium: Somewhat relevant to the prompt
    - Low: Slightly relevant to the prompt

    ### Output Format:

    Return a ONLY a JSON object with the top 5 most relevant files based on your evaluation. Each entry should have the following format:
    file_name: high/medium/low

    Return ONLY a JSON with 5 entries
    """


app = Flask(__name__)

def rag(prompt):
    rag_answer, _ = get_openai_answer(rag_instructions, [], prompt, json_output=True)
    return rag_answer

@app.route('/invoke', methods=['POST'])
def invoke():
    data = request.get_json()
    prompt = data.get('prompt')
    print(f"----\n\u26A1\u26A1 Incoming Hook Prompt \u26A1\u26A1: {prompt}\n")
    rag_answer = rag(prompt)
    print(f"\U0001F50E RAG Top 5 Example Hooks: {rag_answer}\n")

    final_instructions = instructions

    counter = 1
    for file in eval(rag_answer).keys():
        if file not in list(hook_examples_json.keys()):
            print(f"File {file} does not exist!")
        else:
            final_instructions += f"""----------\nHOOK EXAMPLE {counter}:\n\n
            SUMMARY: {hook_examples_json[file]}\n
            CODE:\n {file_to_code[file]}\n\n\n------------------\n\n\n"""
            counter+=1

    final_instructions+="OUTPUT: ONLY Solidity code, nothing else - no explanations, summaries or descriptions. ONLY working Solidity code, WITH comments."

    attempt_counter = 0
    conversation_history = []
    returncode =- 1

    while (attempt_counter<5) and (returncode!=0):
        file_name = f"generated_hook_{attempt_counter}.sol"
        #answer, conversation_history = get_claude_answer(final_instructions, conversation_history, prompt)
        answer, conversation_history = get_openai_answer(final_instructions, conversation_history, prompt)
        answer = markdown_to_text(answer)
        save_to_sol(answer, "../foundry_hook_playground/src/generated/", file_name)
        _, stderr, returncode = compile_contract(file_name)
        prompt = "I get this error when compiling the contract: \n\n"+stderr+"\n\nOUTPUT: Only the fixed solidity code"
        if (returncode)!=0:
            print("\u274CError compiling - Attempting LLM fix")
            print(stderr)
            print("-----------------------")
        else:
            print("\U0001F389 \U0001F389 \U0001F389 Hook compiled! \U0001F389 \U0001F389 \U0001F389\n")
            contract_name = extract_contract_name(answer)
            with open(f"../foundry_hook_playground/out/{file_name}/{contract_name}.json", 'r') as file:
                contract_json = json.load(file)
            print("\u2705 Returning JSON with code, bytecode, ABI.\n") 
            return jsonify(solidity_code=answer, bytecode=contract_json["bytecode"]["object"], abi=contract_json["abi"])
        attempt_counter+=1

if __name__ == '__main__':
    app.run(debug=True)
