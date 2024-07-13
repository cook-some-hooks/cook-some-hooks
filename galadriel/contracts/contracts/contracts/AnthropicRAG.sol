// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

// import "https://github.com/galadriel-ai/contracts/blob/main/contracts/contracts/interfaces/IOracle.sol";
import "./interfaces/IOracle.sol";

contract AnthropicRAG {
    address private oracleAddress; // use latest: https://docs.galadriel.com/oracle-address
    IOracle.Message public message;
    string public response;
    IOracle.LlmRequest private config;

    constructor(address initialOracleAddress) {
        oracleAddress = initialOracleAddress;

        config = IOracle.LlmRequest({
            model: "claude-3-5-sonnet-20240620", // "claude-3-5-sonnet-20240620", "claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307", "claude-2.1", "claude-2.0", "claude-instant-1.2"
            frequencyPenalty: 21, // > 20 for null
            logitBias: "", // empty str for null
            maxTokens: 1000, // 0 for null
            presencePenalty: 21, // > 20 for null
            responseFormat: '{"type":"text"}',
            seed: 0, // null
            stop: "", // null
            temperature: 10, // Example temperature (scaled up, 10 means 1.0), > 20 means null
            topP: 101, // Percentage 0-100, > 100 means null
            tools: '[{"type":"function","function":{"name":"web_search","description":"Search the internet","parameters":{"type":"object","properties":{"query":{"type":"string","description":"Search query"}},"required":["query"]}}},{"type":"function","function":{"name":"code_interpreter","description":"Evaluates python code in a sandbox environment. The environment resets on every execution. You must send the whole script every time and print your outputs. Script should be pure python code that can be evaluated. It should be in python format NOT markdown. The code should NOT be wrapped in backticks. All python packages including requests, matplotlib, scipy, numpy, pandas, etc are available. Output can only be read from stdout, and stdin. Do not use things like plot.show() as it will not work. print() any output and results so you can capture the output.","parameters":{"type":"object","properties":{"code":{"type":"string","description":"The pure python script to be evaluated. The contents will be in main.py. It should not be in markdown format."}},"required":["code"]}}}]',
            toolChoice: "auto", // "none" or "auto"
            user: "" // null
        });
    }

    function sendMessage(string memory _message) public {
        message = createTextMessage("user", _message);
        IOracle(oracleAddress).createLlmCall(0, config);
    }

    function sendMessageRAG(
        string memory _message,
        string memory knowledgeBaseCID
    ) public {
        IOracle(oracleAddress).createKnowledgeBaseQuery(
            0,
            knowledgeBaseCID,
            _message,
            1
        );
    }

    // required for Oracle
    function onOracleLlmResponse(
        uint /*_runId*/,
        IOracle.LlmResponse memory _response,
        string memory _errorMessage
    ) public {
        require(msg.sender == oracleAddress, "Caller is not oracle");
        if (bytes(_errorMessage).length > 0) {
            response = _errorMessage;
        } else {
            response = _response.content;
        }
    }

    // required for Oracle
    function getMessageHistory(
        uint /*_runId*/
    ) public view returns (IOracle.Message[] memory) {
        IOracle.Message[] memory messages = new IOracle.Message[](1);
        messages[0] = message;
        return messages;
    }

    // @notice Creates a text message with the given role and content
    // @param role The role of the message
    // @param content The content of the message
    // @return The created message
    function createTextMessage(
        string memory role,
        string memory content
    ) private pure returns (IOracle.Message memory) {
        IOracle.Message memory newMessage = IOracle.Message({
            role: role,
            content: new IOracle.Content[](1)
        });
        newMessage.content[0].contentType = "text";
        newMessage.content[0].value = content;
        return newMessage;
    }
}
