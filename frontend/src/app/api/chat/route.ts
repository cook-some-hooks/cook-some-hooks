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
  const { prompt } = json;

  const anthropic = new Anthropic({
    apiKey: process.env.NEXT_CLAUDE_API_KEY,
  });

  const msg = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  return Response.json(msg);
}
