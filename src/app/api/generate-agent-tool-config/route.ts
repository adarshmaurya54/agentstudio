import { NextRequest, NextResponse } from 'next/server';

const PROMPT = `
You are a deterministic JSON compiler.

Your task:
Convert the given FLOW_JSON into a STRICT agent configuration.

You MUST follow all rules exactly.

--------------------------------------------------

OUTPUT RULES (HIGHEST PRIORITY):

1. Output ONLY valid JSON
2. No explanation, no markdown, no text outside JSON
3. Do NOT add, remove, or rename fields
4. Do NOT reorder keys
5. Follow the exact structure and key order
6. There is ONLY ONE correct output
7. Be fully deterministic

--------------------------------------------------

STRICT DEFAULT RULES:

If any value is missing:
- Use "" for strings
- Use [] for arrays
- Use {} for objects
- Use true/false only if explicitly required

DO NOT:
- Skip fields
- Invent values
- Guess values
- Add extra properties

--------------------------------------------------

STRUCTURE (FOLLOW EXACTLY):

{
"systemPrompt": "",
"primaryAgentName": "",
"agents": [
{
"id": "",
"name": "",
"model": "",
"includeHistory": true,
"output": "text",
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
"parameters": {},
"usage": [],
"assignedAgent": ""
}
]
}

--------------------------------------------------

FLOW INTERPRETATION RULES:

- Each agent node → agents[]
  id = node.id
  name = node.label

- primaryAgentName = first agent node name

- Each tool/API node → tools[]
  id = node.id
  name = node.label
  description = node.label
  method = "GET"
  url = node.settings.url

- assignedAgent = the nearest previous agent node in flow

- agents.tools:
  Only include:
  {
    "toolId": tool.id,
    "instruction": node.settings.instruction OR ""
  }

--------------------------------------------------

DYNAMIC PARAMETER RULES:

- Extract ALL placeholders from URL
- Placeholders are inside {}

Example:
"/api/user?id={userId}&type={userType}"

Then parameters MUST be:
{
"userId": "string",
"userType": "string"
}

STRICT:
- Parameter names must EXACTLY match placeholders
- Do NOT rename
- Do NOT hardcode
- Do NOT guess

--------------------------------------------------

API KEY RULES:

- apiKey must NOT be inside parameters
- apiKey must ONLY be in tools.apiKey
- includeApikey controls usage

--------------------------------------------------

FINAL CONSTRAINT:

Do NOT generate multiple valid variations.
Do NOT reinterpret structure.
Always produce the SAME output for the SAME input.

--------------------------------------------------

INPUT:
{{FLOW_JSON}}

--------------------------------------------------

OUTPUT:
Return ONLY valid JSON.
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
      top_p: 0,    // IMPORTANT for structured output
      stream: false,  // IMPORTANT (no streaming)
    }),
  });

  return res.json();
}

export async function POST(req: NextRequest) {
  const { jsonConfig } = await req.json();

  const models = [
    "mistralai/mistral-7b-instruct",
    "openrouter/free",
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