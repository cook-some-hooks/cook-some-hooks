import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export async function GET(req: Request) {
  const res = await fetch("https://32df-213-214-42-42.ngrok-free.app/test", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  let data = await res.text();
  return Response.json({ res: data });
}
export async function POST(req: Request) {
  const json = await req.json();
  const { contractAddress, argsAddress } = json;

  // const anthropic = new Anthropic({
  //   apiKey: process.env.NEXT_CLAUDE_API_KEY,
  // });

  // const msg: any = await anthropic.messages.create({
  //   model: "claude-3-5-sonnet-20240620",
  //   max_tokens: 1024,
  //   messages: [{ role: "user", content: prompt }],
  // });

  const res = await fetch("https://a5d6-213-214-42-42.ngrok-free.app/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contract_address: contractAddress,
      constructor_address: argsAddress,
    }),
  });
  let data = await res.json();

  return Response.json({ res: data });
  //  return Response.json({ res: extractCode(msg.content[0].text) });
}
function extractCode(text: string) {
  const codeBlocks = [];
  const lines = text.split("\n");
  let inCodeBlock = false;
  let currentBlock = [];

  for (const line of lines) {
    if (line.trim() === "```" || line.trim().startsWith("```")) {
      if (inCodeBlock) {
        codeBlocks.push(currentBlock.join("\n"));
        currentBlock = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
    } else if (inCodeBlock) {
      currentBlock.push(line);
    }
  }

  return codeBlocks;
}
