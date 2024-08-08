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
  const { prompt, address } = json;

  // const anthropic = new Anthropic({
  //   apiKey: process.env.NEXT_CLAUDE_API_KEY,
  // });

  // const msg: any = await anthropic.messages.create({
  //   model: "claude-3-5-sonnet-20240620",
  //   max_tokens: 1024,
  //   messages: [{ role: "user", content: prompt }],
  // });
  console.log(JSON.stringify({ prompt: prompt, deployer_address: address }));
  const res = await fetch("http://127.0.0.1:8000/invoke", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: prompt, deployer_address: address }),
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
