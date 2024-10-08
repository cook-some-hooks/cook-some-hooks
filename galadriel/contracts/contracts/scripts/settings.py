from dotenv import load_dotenv
import os

load_dotenv()

CHAIN_ID = int(os.getenv("CHAIN_ID", "696969"))
RPC_URL = os.getenv("RPC_URL", "https://devnet.galadriel.com")
PRIVATE_KEY = os.getenv("PRIVATE_KEY_GALADRIEL")
STORAGE_KEY = os.getenv("PINATA_API_KEY")
ORACLE_ADDRESS = os.getenv("ORACLE_ADDRESS")
QUICKSTART_CONTRACT_ADDRESS="0x6EAC4c2c03698B286F1bb75bD74591eCdba270D4"
RAG_CONTRACT_ADDRESS="0x12FAC2aEf78dFfE799d91940BE12aBaF37159213"
ANTHROPIC_RAG_CONTRACT_ADDRESS="0x12FAC2aEf78dFfE799d91940BE12aBaF37159213"
ORACLE_ABI_PATH = os.getenv(
    "ORACLE_ABI_PATH",
    "../oracles/abi/ChatOracle.json",
)
MAX_DOCUMENT_SIZE_MB = 10
