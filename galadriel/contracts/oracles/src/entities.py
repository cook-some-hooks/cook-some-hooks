from enum import Enum
from typing import Dict
from typing import List
from typing import Literal
from typing import Optional
from dataclasses import dataclass
from typing import Union
from openai.types.chat import ChatCompletion
from openai.types.chat import ChatCompletionToolParam

ALLOWED_FUNCTION_NAMES = ["image_generation", "web_search", "code_interpreter"]

OpenAiModelType = Literal[
    "gpt-4o", "gpt-4-turbo", "gpt-4-turbo-preview", "gpt-3.5-turbo-1106"
]
GroqModelType = Literal[
    "llama3-8b-8192", "llama3-70b-8192", "mixtral-8x7b-32768", "gemma-7b-it"
]
AnthropicModelType = Literal[
    "claude-3-5-sonnet-20240620",
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307",
    "claude-2.1",
    "claude-2.0",
    "claude-instant-1.2",
]

class PromptType(str, Enum):
    DEFAULT = "default"
    OPENAI = "OpenAI"
    GROQ = "Groq"


PromptTypeLiteral = Literal[PromptType.DEFAULT, PromptType.OPENAI, PromptType.GROQ]

ToolChoiceType = Literal["none", "auto"]


@dataclass
class LlmConfig:
    model: AnthropicModelType
    frequency_penalty: Optional[float]
    logit_bias: Optional[Dict]
    max_tokens: Optional[int]
    presence_penalty: Optional[float]
    response_format: Optional[Union[str, Dict]]
    seed: Optional[int]
    stop: Optional[str]
    temperature: Optional[float]
    top_p: Optional[float]
    tools: Optional[List[ChatCompletionToolParam]]
    tool_choice: Optional[ToolChoiceType]
    user: Optional[str]


@dataclass
class OpenAiConfig:
    model: OpenAiModelType
    frequency_penalty: Optional[float]
    logit_bias: Optional[Dict]
    max_tokens: Optional[int]
    presence_penalty: Optional[float]
    response_format: Optional[Union[str, Dict]]
    seed: Optional[int]
    stop: Optional[str]
    temperature: Optional[float]
    top_p: Optional[float]
    tools: Optional[List[ChatCompletionToolParam]]
    tool_choice: Optional[ToolChoiceType]
    user: Optional[str]


@dataclass
class GroqConfig:
    model: GroqModelType
    frequency_penalty: Optional[float]
    logit_bias: Optional[Dict]
    max_tokens: Optional[int]
    presence_penalty: Optional[float]
    response_format: Optional[Union[str, Dict]]
    seed: Optional[int]
    stop: Optional[str]
    temperature: Optional[float]
    top_p: Optional[float]
    user: Optional[str]


@dataclass
class Chat:
    id: int
    callback_id: int
    is_processed: bool
    prompt_type: PromptTypeLiteral
    messages: List[dict]
    config: Optional[LlmConfig] = None
    response: Optional[Union[str, ChatCompletion]] = None
    error_message: Optional[str] = None
    transaction_receipt: dict = None


@dataclass
class FunctionCall:
    id: int
    callback_id: int
    is_processed: bool
    function_type: str
    function_input: str
    response: Optional[str] = None
    error_message: Optional[str] = None
    transaction_receipt: dict = None


@dataclass
class KnowledgeBaseIndexingRequest:
    id: int
    cid: str
    is_processed: bool
    index_cid: Optional[str] = None
    transaction_receipt: dict = None


@dataclass
class KnowledgeBaseQuery:
    id: int
    callback_id: int
    is_processed: bool
    cid: str
    index_cid: str
    query: str
    num_documents: int
    transaction_receipt: dict = None
