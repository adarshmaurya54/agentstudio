// import { NextRequest } from "next/server";

// const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// // 🧠 In-memory store (replace later with DB)
// const memoryStore = new Map<string, any[]>();

// function getMemory(id: string) {
//   return memoryStore.get(id) || [];
// }

// function updateMemory(id: string, message: any) {
//   const prev = memoryStore.get(id) || [];
//   memoryStore.set(id, [...prev, message]);
// }

// // 🔥 STREAM CALL
// async function callModelStream(messages: any[]) {
//   return fetch(OPENROUTER_URL, {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       model: "openrouter/free",
//       messages,
//       stream: true,
//       temperature: 0,
//     }),
//   });
// }

// // 🔥 NORMAL CALL (for decision)
// async function callModel(messages: any[]) {
//   const res = await fetch(OPENROUTER_URL, {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       model: "openrouter/free",
//       messages,
//       temperature: 0,
//     }),
//   });

//   const data = await res.json();
//   return data?.choices?.[0]?.message?.content || "";
// }

// // 🔥 TOOL EXECUTION
// async function executeTool(tool: any, params: any) {
//   let url = tool.url;

//   for (const key in params) {
//     url = url.replace(`{${key}}`, encodeURIComponent(params[key]));
//   }

//   if (tool.includeApikey && tool.apiKey) {
//     url += url.includes("?")
//       ? `&key=${tool.apiKey}`
//       : `?key=${tool.apiKey}`;
//   }

//   const res = await fetch(url);
//   return res.json();
// }

// // 🔥 DECISION ENGINE (FIXED)
// async function decideAction(input: string, tools: any[], agent: any) {
//   const raw = await callModel([
//     {
//       role: "system",
//       content: `
// You are an AI agent.

// Agent Instructions:
// ${agent?.tools?.[0]?.instruction || ""}

// Available tools:
// ${JSON.stringify(tools)}

// Your job:
// - Understand user intent
// - Decide whether to respond normally OR use a tool

// Rules:
// - Greeting / casual → respond normally
// - Real-time / external data → use tool
// - Use EXACT parameter names

// Return ONLY JSON:

// If tool needed:
// {
//   "type": "tool",
//   "tool": "tool_name",
//   "params": {}
// }

// If NOT needed:
// {
//   "type": "response",
//   "content": "your reply"
// }
//       `,
//     },
//     { role: "user", content: input },
//   ]);

//   const cleaned = raw
//     .replace(/```json/g, "")
//     .replace(/```/g, "")
//     .trim();

//   try {
//     return JSON.parse(cleaned);
//   } catch {
//     return null;
//   }
// }

// export async function POST(req: NextRequest) {
//   const { input, tools, agents, conversationId, agentName } =
//     await req.json();

//   // 🧠 1. Select agent
//   const activeAgent =
//     agents.find((a: any) => a.name === agentName) || agents[0];

//   // 🧠 2. Filter tools (FIXED ID + fallback)
//   const agentTools = tools.filter(
//     (t: any) =>
//       t.assignedAgent === activeAgent.id ||
//       t.assignedAgent === activeAgent.name
//   );

//   // 🧠 3. Memory
//   const memory = getMemory(conversationId);

//   updateMemory(conversationId, { role: "user", content: input });

//   // 🧠 4. Decide action
//   const decision = await decideAction(input, agentTools, activeAgent);

//   if (!decision) {
//     return new Response("Failed to decide");
//   }

//   // ✅ NORMAL RESPONSE (no tool)
//   if (decision.type === "response") {
//     updateMemory(conversationId, {
//       role: "assistant",
//       content: decision.content,
//     });

//     return new Response(decision.content);
//   }

//   // ✅ TOOL FLOW
//   let tool = agentTools.find(
//     (t: any) =>
//       t.name.toLowerCase() === decision.tool?.toLowerCase()
//   );

//   // 🔥 fallback matching (important)
//   if (!tool) {
//     tool = agentTools.find((t: any) =>
//       t.name.toLowerCase().includes(decision.tool?.toLowerCase())
//     );
//   }

//   if (!tool) {
//     return new Response("Tool not found");
//   }

//   // ⚙️ Execute tool
//   const toolResult = await executeTool(tool, decision.params);

//   // 🔥 STREAM FINAL RESPONSE
//   const streamRes = await callModelStream([
//     ...memory,
//     {
//       role: "system",
//       content:
//         activeAgent?.tools?.[0]?.instruction ||
//         "Respond clearly to the user.",
//     },
//     {
//       role: "user",
//       content: `
// User asked: ${input}
// Tool result: ${JSON.stringify(toolResult)}
//       `,
//     },
//   ]);

//   const reader = streamRes.body?.getReader();
//   const encoder = new TextEncoder();
//   const decoder = new TextDecoder();

//   let fullText = "";

//   const stream = new ReadableStream({
//     async start(controller) {
//       while (true) {
//         const { done, value } = await reader!.read();
//         if (done) break;

//         const chunk = decoder.decode(value);
//         const lines = chunk.split("\n");

//         for (const line of lines) {
//           if (line.startsWith("data: ")) {
//             const json = line.replace("data: ", "").trim();

//             if (json === "[DONE]") {
//               updateMemory(conversationId, {
//                 role: "assistant",
//                 content: fullText,
//               });

//               controller.close();
//               return;
//             }

//             try {
//               const parsed = JSON.parse(json);
//               const content =
//                 parsed?.choices?.[0]?.delta?.content || "";

//               if (content) {
//                 fullText += content;
//                 controller.enqueue(encoder.encode(content));
//               }
//             } catch {}
//           }
//         }
//       }

//       controller.close();
//     },
//   });

//   return new Response(stream, {
//     headers: {
//       "Content-Type": "text/plain",
//     },
//   });
// }

// // 🔥 GET → conversationId
// export async function GET() {
//   const conversationId = crypto.randomUUID();

//   return new Response(
//     JSON.stringify({ conversationId }),
//     {
//       headers: {
//         "Content-Type": "application/json",
//       },
//     }
//   );
// }


import { NextRequest } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ─────────────────────────────────────────────
// 🧠 In-memory store (replace with DB later)
// ─────────────────────────────────────────────
const memoryStore = new Map<string, any[]>();
const MAX_MEMORY = 20; // keep last 20 messages per conversation

function getMemory(id: string): any[] {
  return memoryStore.get(id) || [];
}

function updateMemory(id: string, message: any): void {
  const prev = memoryStore.get(id) || [];
  const updated = [...prev, message];
  // Trim to last MAX_MEMORY entries to prevent memory leak
  memoryStore.set(id, updated.slice(-MAX_MEMORY));
}

// ─────────────────────────────────────────────
// 🔥 STREAM CALL
// ─────────────────────────────────────────────
async function callModelStream(messages: any[]): Promise<Response> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages,
      stream: true,
      temperature: 0,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Stream call failed: ${res.status} ${res.statusText}`
    );
  }

  return res;
}

// ─────────────────────────────────────────────
// 🔥 NORMAL CALL (for decision)
// ─────────────────────────────────────────────
async function callModel(messages: any[]): Promise<string> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages,
      temperature: 0,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Model call failed: ${res.status} ${res.statusText}`
    );
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "";
}

// ─────────────────────────────────────────────
// 🔥 TOOL EXECUTION — with validation & error handling
// ─────────────────────────────────────────────
async function executeTool(tool: any, params: any): Promise<any> {
  let url: string = tool.url;

  // Replace placeholders safely
  for (const key in params) {
    if (params[key] === undefined || params[key] === null) {
      console.warn(`[Tool] Missing param "${key}" for tool "${tool.name}"`);
      continue;
    }
    url = url.replace(`{${key}}`, encodeURIComponent(String(params[key])));
  }

  // Detect any unfilled placeholders
  const unfilled = url.match(/\{[^}]+\}/g);
  if (unfilled) {
    throw new Error(
      `Tool "${tool.name}" has unfilled URL placeholders: ${unfilled.join(", ")}`
    );
  }

  // Append API key if needed
  if (tool.includeApikey && tool.apiKey) {
    url += url.includes("?") ? `&key=${tool.apiKey}` : `?key=${tool.apiKey}`;
  }

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(
      `Tool "${tool.name}" request failed: ${res.status} ${res.statusText}`
    );
  }

  return res.json();
}

// ─────────────────────────────────────────────
// 🔥 DECISION ENGINE
// — now receives memory so it has conversation context
// ─────────────────────────────────────────────
async function decideAction(
  input: string,
  tools: any[],
  agent: any,
  memory: any[]
): Promise<{ type: "tool"; tool: string; params: any } | { type: "response"; content: string } | null> {

  // Use direct agent fields; fall back gracefully
  const agentInstruction =
    agent?.instruction ||
    agent?.systemPrompt ||
    agent?.description ||
    "Respond clearly and helpfully to the user.";

  const raw = await callModel([
    {
      role: "system",
      content: `
You are an AI agent decision engine.

Agent Instructions:
${agentInstruction}

Available tools:
${JSON.stringify(tools, null, 2)}

Your job:
- Understand user intent based on the conversation history and latest message
- Decide whether to respond normally OR call a tool

Rules:
- Greetings / casual chat / questions answerable from memory → respond normally
- Anything requiring real-time or external data → use a tool
- Use EXACT parameter names from the tool definition
- Never invent tool names

Return ONLY valid JSON — no markdown, no explanation:

If a tool is needed:
{
  "type": "tool",
  "tool": "<exact_tool_name>",
  "params": { "<param_key>": "<param_value>" }
}

If no tool is needed:
{
  "type": "response",
  "content": "<your reply to the user>"
}
      `.trim(),
    },
    // Include conversation history so the agent has context
    ...memory,
    { role: "user", content: input },
  ]);

  // Strip any accidental markdown fences
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("[decideAction] Failed to parse decision JSON:", cleaned, e);
    return null;
  }
}

// ─────────────────────────────────────────────
// 🔥 POST — main handler
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let input: string,
    tools: any[],
    agents: any[],
    conversationId: string,
    agentName: string;

  try {
    ({ input, tools, agents, conversationId, agentName } = await req.json());
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 1️⃣ Select agent
  const activeAgent =
    agents.find((a: any) => a.name === agentName) || agents[0];

  if (!activeAgent) {
    return new Response(
      JSON.stringify({ error: "No agent found" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2️⃣ Filter tools by agent ID or name
  const agentTools = tools.filter(
    (t: any) =>
      t.assignedAgent === activeAgent.id ||
      t.assignedAgent === activeAgent.name
  );

  // 3️⃣ Get memory BEFORE saving new message
  //    (so decision engine sees history only, not the new message twice)
  const memory = getMemory(conversationId);

  // 4️⃣ Decide action FIRST, then persist to memory on success
  let decision: Awaited<ReturnType<typeof decideAction>>;
  try {
    decision = await decideAction(input, agentTools, activeAgent, memory);
  } catch (e: any) {
    console.error("[POST] decideAction error:", e);
    return new Response(
      JSON.stringify({ error: "Decision engine failed", detail: e.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!decision) {
    return new Response(
      JSON.stringify({ error: "Could not parse decision from model" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // ✅ Now safe to persist the user message
  updateMemory(conversationId, { role: "user", content: input });

  // ─────────────────────────────────────────────
  // ✅ CASE A: Normal response (no tool needed)
  // ─────────────────────────────────────────────
  if (decision.type === "response") {
    updateMemory(conversationId, {
      role: "assistant",
      content: decision.content,
    });

    return new Response(decision.content, {
      headers: { "Content-Type": "text/plain" },
    });
  }

  // ─────────────────────────────────────────────
  // ✅ CASE B: Tool call
  // ─────────────────────────────────────────────

  // Exact match first, then fuzzy fallback
  let tool =
    agentTools.find(
      (t: any) => t.name.toLowerCase() === decision!.tool?.toLowerCase()
    ) ||
    agentTools.find((t: any) =>
      t.name.toLowerCase().includes(decision!.tool?.toLowerCase())
    );

  if (!tool) {
    return new Response(
      JSON.stringify({
        error: `Tool "${decision.tool}" not found`,
        availableTools: agentTools.map((t: any) => t.name),
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Execute the tool
  let toolResult: any;
  try {
    toolResult = await executeTool(tool, (decision as any).params || {});
  } catch (e: any) {
    console.error("[POST] executeTool error:", e);
    return new Response(
      JSON.stringify({ error: "Tool execution failed", detail: e.message }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  // Build agent system prompt from correct field
  const agentInstruction =
    activeAgent?.instruction ||
    activeAgent?.systemPrompt ||
    activeAgent?.description ||
    "Respond clearly and helpfully to the user.";

  // Stream final response using tool result
  let streamRes: Response;
  try {
    streamRes = await callModelStream([
      { role: "system", content: agentInstruction },
      // Include conversation history for continuity
      ...memory,
      {
        role: "user",
        content: `User asked: ${input}\n\nTool result (${tool.name}):\n${JSON.stringify(toolResult, null, 2)}`,
      },
    ]);
  } catch (e: any) {
    console.error("[POST] callModelStream error:", e);
    return new Response(
      JSON.stringify({ error: "Stream call failed", detail: e.message }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  const reader = streamRes.body?.getReader();

  if (!reader) {
    return new Response(
      JSON.stringify({ error: "No stream body received" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let fullText = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            const json = line.slice("data: ".length).trim();
            if (json === "[DONE]") {
              // Persist final assistant message to memory
              updateMemory(conversationId, {
                role: "assistant",
                content: fullText,
              });
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(json);
              const content = parsed?.choices?.[0]?.delta?.content || "";
              if (content) {
                fullText += content;
                controller.enqueue(encoder.encode(content));
              }
            } catch (e) {
              // Non-fatal: skip malformed SSE chunk
              console.warn("[Stream] Skipping malformed chunk:", json, e);
            }
          }
        }
      } catch (e) {
        console.error("[Stream] Fatal stream error:", e);
        controller.error(e);
      } finally {
        // Ensure memory is saved even if stream ends without [DONE]
        if (fullText) {
          updateMemory(conversationId, {
            role: "assistant",
            content: fullText,
          });
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// ─────────────────────────────────────────────
// 🔥 GET — generate a new conversationId
// ─────────────────────────────────────────────
export async function GET() {
  const conversationId = crypto.randomUUID();
  return new Response(JSON.stringify({ conversationId }), {
    headers: { "Content-Type": "application/json" },
  });
}