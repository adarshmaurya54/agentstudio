import { NextRequest, NextResponse } from 'next/server';

const PROMPT = `
From this flow, generate a complete agent configuration in JSON format.

Rules:
- Return ONLY valid JSON
- No explanation, no markdown, no extra text
- Follow exact structure

Structure:
{
  "systemPrompt": "",
  "primaryAgentName": "",
  "agents": [
    {
      "id": "agent-id",
      "name": "",
      "model": "",
      "includeHistory": true,
      "output": "",
      "tools": [
        {
          "toolId": "",
          "instruction": ""
        }
      ]
    }
  ],
  "tools": [
    {
      "id": "",
      "name": "",
      "description": "",
      "method": "GET",
      "url": "",
      "includeApikey": true,
      "apiKey": "",
      "parameters": {
        "key": "dataType"
      },
      "usage": [],
      "assignedAgent": ""
    }
  ]
}
`;

async function callModel(model: string, input: string) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "You generate strict JSON only."
        },
        {
          role: "user",
          content: input
        }
      ],
      temperature: 0, // IMPORTANT for structured output
      stream: false,  // IMPORTANT (no streaming)
    }),
  });

  return res.json();
}

export async function POST(req: NextRequest) {
  const { jsonConfig } = await req.json();

  const models = [
    "openrouter/free",
    "mistralai/mistral-7b-instruct",
    "deepseek/deepseek-chat"
  ];

  for (let model of models) {
    try {
      const input = JSON.stringify(jsonConfig) + PROMPT;

      const response = await callModel(model, input);

      const outputText =
        response?.choices?.[0]?.message?.content || "";

      // 🔥 Clean markdown (same as OpenAI logic)
      const cleaned = outputText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsedJson = JSON.parse(cleaned);

      console.log("Using model:", model);

      return NextResponse.json(parsedJson);

    } catch (err) {
      console.log("Failed model:", model, err);
    }
  }

  return NextResponse.json(
    { error: "All models failed" },
    { status: 500 }
  );
}