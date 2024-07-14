import re

# Define the flags with uint160 constraint
BEFORE_INITIALIZE_FLAG = 1 << 13
AFTER_INITIALIZE_FLAG = 1 << 12

BEFORE_ADD_LIQUIDITY_FLAG = 1 << 11
AFTER_ADD_LIQUIDITY_FLAG = 1 << 10

BEFORE_REMOVE_LIQUIDITY_FLAG = 1 << 9
AFTER_REMOVE_LIQUIDITY_FLAG = 1 << 8

BEFORE_SWAP_FLAG = 1 << 7
AFTER_SWAP_FLAG = 1 << 6

BEFORE_DONATE_FLAG = 1 << 5
AFTER_DONATE_FLAG = 1 << 4

BEFORE_SWAP_RETURNS_DELTA_FLAG = 1 << 3
AFTER_SWAP_RETURNS_DELTA_FLAG = 1 << 2
AFTER_ADD_LIQUIDITY_RETURNS_DELTA_FLAG = 1 << 1
AFTER_REMOVE_LIQUIDITY_RETURNS_DELTA_FLAG = 1 << 0

# Mapping the flag names to their corresponding values
FLAGS = {
    'beforeInitialize': BEFORE_INITIALIZE_FLAG,
    'afterInitialize': AFTER_INITIALIZE_FLAG,
    'beforeAddLiquidity': BEFORE_ADD_LIQUIDITY_FLAG,
    'afterAddLiquidity': AFTER_ADD_LIQUIDITY_FLAG,
    'beforeRemoveLiquidity': BEFORE_REMOVE_LIQUIDITY_FLAG,
    'afterRemoveLiquidity': AFTER_REMOVE_LIQUIDITY_FLAG,
    'beforeSwap': BEFORE_SWAP_FLAG,
    'afterSwap': AFTER_SWAP_FLAG,
    'beforeDonate': BEFORE_DONATE_FLAG,
    'afterDonate': AFTER_DONATE_FLAG,
    'beforeSwapReturnDelta': BEFORE_SWAP_RETURNS_DELTA_FLAG,
    'afterSwapReturnDelta': AFTER_SWAP_RETURNS_DELTA_FLAG,
    'afterAddLiquidityReturnDelta': AFTER_ADD_LIQUIDITY_RETURNS_DELTA_FLAG,
    'afterRemoveLiquidityReturnDelta': AFTER_REMOVE_LIQUIDITY_RETURNS_DELTA_FLAG,
}

def extract_flags_from_code(code):
    """
    Extract flag values from Solidity code using regex.
    
    :param code: The Solidity code as a string
    :return: A dictionary representing the state of each flag (true or false)
    """
    flag_states = {}
    pattern = re.compile(r'(\w+):\s*(true|false)', re.IGNORECASE)
    matches = pattern.findall(code)
    for flag, state in matches:
        flag_states[flag] = state.lower() == 'true'
    return flag_states

def calculate_flags(flag_states):
    """
    Calculate the combined flags based on the provided flag states.
    
    :param flag_states: A dictionary representing the state of each flag (true or false)
    :return: The combined flags as an integer
    """
    combined_flags = 0
    for flag_name, flag_value in FLAGS.items():
        if flag_states.get(flag_name, False):
            combined_flags |= flag_value
    return combined_flags


from web3 import Web3
from eth_utils import keccak, to_bytes
from eth_account import Account

# Mask to slice out the top 10 bits of the address
FLAG_MASK = 0x3FF << 146

# Maximum number of iterations to find a salt, avoid infinite loops
MAX_LOOP = 200000

def find(deployer: str, flags: int, seed: int, creation_code: bytes, constructor_args: bytes):
    """
    Find a salt that produces a hook address with the desired `flags`

    :param deployer: The address that will deploy the hook.
                     In `forge test`, this will be the test contract `address(this)` or the pranking address
                     In `forge script`, this should be `0x4e59b44847b379578588920cA78FbF26c0B4956C` (CREATE2 Deployer Proxy)
    :param flags: The desired flags for the hook address
    :param seed: Use 0 for as a default. An optional starting salt when linearly searching for a salt
                 Useful for finding salts for multiple hooks with the same flags
    :param creation_code: The creation code of a hook contract. Example: `type(Counter).creationCode`
    :param constructor_args: The encoded constructor arguments of a hook contract. Example: `abi.encode(address(manager))`
    :return: A tuple containing the hook address and the salt that was found.
             The salt can be used in `new Hook{salt: salt}(<constructor arguments>)`
    """
    creation_code_with_args = creation_code + constructor_args

    for salt in range(seed, MAX_LOOP):
        hook_address = compute_address(deployer, salt, creation_code_with_args)
        #print(ethereum_address_to_binary_and_top_10(hook_address)[1], flags)
        if ethereum_address_to_binary_and_least_14_bits(hook_address)[1] == flags:
            return hook_address, Web3.to_hex(salt)

    raise Exception('HookMiner: could not find salt')

def compute_address(deployer: str, salt: int, creation_code: bytes) -> str:
    """
    Precompute a contract address deployed via CREATE2

    :param deployer: The address that will deploy the hook
                     In `forge test`, this will be the test contract `address(this)` or the pranking address
                     In `forge script`, this should be `0x4e59b44847b379578588920cA78FbF26c0B4956C` (CREATE2 Deployer Proxy)
    :param salt: The salt used to deploy the hook
    :param creation_code: The creation code of a hook contract
    :return: The computed address of the hook contract
    """
    deployer_bytes = to_bytes(hexstr=deployer)
    salt_bytes = Web3.to_bytes(salt)
    creation_code_hash = keccak(creation_code)
    
    return Web3.to_checksum_address(Web3.solidity_keccak(
        ['bytes1', 'address', 'bytes32', 'bytes32'],
        ['0xff', deployer, Web3.to_hex(salt_bytes), Web3.to_hex(creation_code_hash)]
    )[12:].hex())

def hex_to_bytes(hex_str: str) -> bytes:
    """
    Convert a hex string to bytes.
    
    :param hex_str: The hex string to convert
    :return: The resulting bytes
    """
    return bytes.fromhex(hex_str[2:])  # Remove the '0x' prefix before converting


def int_to_binary(value, bit_length=160):
    """
    Convert an integer to its binary representation as a string, padded to the specified bit length.
    
    :param value: The integer to convert
    :param bit_length: The desired length of the binary string
    :return: The binary representation of the integer as a string, padded to the specified bit length
    """
    if value < 0:
        raise ValueError("Value cannot be negative")
    # Convert to binary and remove the '0b' prefix
    binary_representation = bin(value)[2:]
    
    # Pad the binary representation to ensure it is the specified bit length
    padded_binary = binary_representation.zfill(bit_length)
    
    return padded_binary

def ethereum_address_to_binary_and_least_14_bits(address):
    """
    Convert an Ethereum address to its 160-bit binary representation.
    
    :param address: The Ethereum address in hexadecimal format (with "0x" prefix)
    :return: The 160-bit binary representation of the address as a string
    """
    if not address.startswith('0x'):
        raise ValueError("Ethereum address must start with '0x'")
    
    # Remove the '0x' prefix
    hex_str = address[2:]
    
    # Convert the hexadecimal string to an integer
    address_int = int(hex_str, 16)
    
    # Convert the integer to its binary representation and pad to 160 bits
    binary_representation = bin(address_int)[2:].zfill(160)

    least_14_bits = address_int & 0x3FFF
    
    return binary_representation, least_14_bits

# Example usage
ethereum_address = "0x4e59b44847b379578588920cA78FbF26c0B4956C"
