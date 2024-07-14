import json
import os
import random
import subprocess
import re

from anthropic import Anthropic
from dotenv import load_dotenv, find_dotenv
from IPython.display import display, Markdown
from openai import OpenAI
import tiktoken

load_dotenv(find_dotenv())

OpenAI_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
Anthropic_client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))


def extract_contract_name(text):
    """
    Extracts the contract code from a given string that matches the pattern 'contract xxxx is'.

    Args:
        text (str): The input string containing the contract information.

    Returns:
        str: The extracted contract code if found, otherwise None.
    """
    # Regex pattern
    pattern = r"contract\s(\w+)\sis"
    
    # Search for the pattern
    match = re.search(pattern, text)
    
    if match:
        # Extract the captured group
        return match.group(1)
    else:
        return None
    
def get_n_tokens(text):
    enc = tiktoken.encoding_for_model("gpt-4o")
    return len(enc.encode(text))

def get_openai_answer(instructions, conversation_history, new_prompt, json_output=False):
    if len(conversation_history)==0:
        conversation_history.append({"role": "system", "content": instructions})
    conversation_history.append({"role": "user", "content": new_prompt})

    if json_output:
        completion = OpenAI_client.chat.completions.create(
          model="gpt-4o",
          messages=conversation_history,
          response_format={"type": "json_object"}
        )
    else:
        completion = OpenAI_client.chat.completions.create(
          model="gpt-4o",
          messages=conversation_history
        )

    conversation_history.append({"role": "assistant", "content": completion.choices[0].message.content})
    
    return completion.choices[0].message.content, conversation_history


def get_claude_answer(instructions, conversation_history, new_prompt):
    conversation_history.append({"role": "user", "content": new_prompt})
        
    # Call the Claude API with the updated conversation history
    message = Anthropic_client.messages.create(
        max_tokens=2000,
        system=instructions,
        messages=conversation_history,
        model="claude-3-5-sonnet-20240620",
    )
    
    # Append the Claude's response to the conversation history
    conversation_history.append({"role": "assistant", "content": message.content[0].text})
    
    return message.content[0].text, conversation_history


def read_file(file_path):
    try:
        with open(file_path, 'r') as file:
            content = file.read()
        return content
    except FileNotFoundError:
        return "File not found."

def read_all_files_in_folder(folder_path):
    contents_dict = {}
    for filename in os.listdir(folder_path):
        if filename[-4:] == ".sol":
            file_path = os.path.join(folder_path, filename)
            if os.path.isfile(file_path):
                with open(file_path, 'r') as file:
                    contents = file.read()
                    contents_dict[filename] = contents
    return contents_dict

def get_cost_dollars(instructions, answer):
    input_1k_tokens = 0.005
    output_1k_tokens = 0.015
    return input_1k_tokens * get_n_tokens(instructions)/1000 + output_1k_tokens * get_n_tokens(answer)/1000

def render_markdown(text):
    display(Markdown(text))

def sample_dict(dictionary, sample_size):
    if sample_size > len(dictionary):
        raise ValueError("Sample size cannot be larger than the dictionary size")
    
    sampled_keys = random.sample(list(dictionary.keys()), sample_size)
    sampled_dict = {key: dictionary[key] for key in sampled_keys}
    
    return sampled_dict

def save_to_sol(content, folder_path, file_name):
    # Ensure the file has the .sol extension
    if not file_name.endswith('.sol'):
        file_name += '.sol'

    # Combine the folder path and file name to get the full file path
    file_path = os.path.join(folder_path, file_name)
    
    # Open the file in write mode and write the content
    with open(file_path, 'w') as file:
        file.write(content)

    #print(f"File {file_path} has been created and saved successfully.")


def compile_contract(file_to_build):

    command = f"forge build src/generated/{file_to_build}"
    working_directory = "/Users/miquel/Desktop/git/miqlar/cook-some-hooks/foundry_hook_playground"

    # Run the command in the specified directory
    result = subprocess.run(command, shell=True, capture_output=True, text=True, cwd=working_directory)

    # Return stdout, stderr, and returncode
    return result.stdout, result.stderr, result.returncode


def markdown_to_text(text):
    spdx_str = "// SPDX-License-Identifier"
    index = text.find(spdx_str)
    if index != -1:
        # Strip leading and trailing whitespace, then remove trailing backticks
        return text[index:].strip().rstrip('`')
    else:
        # If the SPDX string is not found, strip whitespace and remove trailing backticks
        return text.strip().rstrip('`')
        

def remove_last_brace(text):
    """
    Remove the last occurrence of '}' in the text.
    
    :param text: The input string
    :return: A string with the last '}' removed
    """
    last_brace_index = text.rfind('}')
    
    if last_brace_index != -1:
        # Return the string with the last '}' removed
        return text[:last_brace_index] + text[last_brace_index + 1:]
    else:
        # Return the original text if no '}' is found
        return text
    

def n_arguments_in_constructor(text):
    """
    Count the number of commas between the parentheses after the constructor in the given text.
    
    :param text: The input string containing the constructor
    :return: The number of commas in the constructor's parameter list, or 0 if the list is empty or only contains spaces
    """
    # Regular expression to match the constructor parameters
    pattern = r'constructor\s*\(([^)]*)\)'
    match = re.search(pattern, text)
    
    if match:
        # Extract the parameters string
        params = match.group(1).strip()
        # Check if the parameters string is empty or only contains spaces
        if not params:
            return 0
        # Count the commas in the parameters string
        comma_count = params.count(',')
        return comma_count+1
    else:
        return 0
    

def multiply_string_with_commas(string, x):
    """
    Multiply a string x times with commas in between.
    
    :param string: The input string to be multiplied
    :param x: The number of times to multiply the string
    :return: A new string with the input string repeated x times, separated by commas
    """
    if x <= 0:
        return ""
    
    return ','.join([string] * x)


def remove_triple_backtick(text):
    """
    Remove all occurrences of triple backtick ``` from the text.
    
    :param text: The input text
    :return: The text with all occurrences of triple backtick removed
    """
    return text.replace("```", "")


import time
from functools import wraps

def rate_limit(min_interval):
    """
    Decorator to prevent a function from being called again before a specified interval has passed.
    
    :param min_interval: The minimum interval (in seconds) that must pass before the function can be called again
    """
    def decorator(func):
        last_called = [0]  # Using a list to allow modification of the timestamp

        @wraps(func)
        def wrapped(*args, **kwargs):
            current_time = time.time()
            elapsed_time = current_time - last_called[0]

            if elapsed_time < min_interval:
                raise Exception(f"Function called too soon. Please wait {min_interval - elapsed_time:.2f} more seconds.")

            result = func(*args, **kwargs)
            last_called[0] = current_time
            return result

        return wrapped
    return decorator
