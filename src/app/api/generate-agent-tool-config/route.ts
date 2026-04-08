import { NextRequest, NextResponse } from 'next/server';

const PROMPT = `You are a strict JSON generator.

Your task:
Convert the given flow into a VALID agent configuration.

---

RULES:

1. Output ONLY valid JSON
2. NO explanation, NO markdown
3. DO NOT change structure
4. DO NOT invent fields

---

STRUCTURE:

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

---

DYNAMIC PARAMETER RULES (IMPORTANT):

* Identify ALL placeholders in the URL.
* Placeholders are inside {}.

Example:
URL → /api/user?id={userId}&type={userType}

Then parameters MUST be:
{
"userId": "string",
"userType": "string"
}

---

STRICT RULES:

* Parameter names MUST EXACTLY match URL placeholders
* DO NOT use generic names like "key", "data", "value"
* DO NOT hardcode parameter names
* DO NOT guess — only extract from URL

---

API KEY RULES:

* apiKey must NOT be inside parameters
* apiKey must ONLY be in tools.apiKey
* includeApikey controls whether key is used

---

TOOL RULES:

* Full tool definition ONLY inside "tools"
* agents.tools contains ONLY:
  { "toolId": "", "instruction": "" }

---

AGENT RULES:

* primaryAgentName must match an agent name
* Each tool must have assignedAgent
* Agents reference tools using toolId only

---

INPUT:
{{FLOW_JSON}}

---

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