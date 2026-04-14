import { NextRequest } from "next/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openrouter/free";
const MAX_MEMORY_MESSAGES = 20;
const MAX_INPUT_LENGTH = 300;
const FALLBACK_MODELS = [
  "openrouter/free",
  "deepseek/deepseek-chat",
  "mistralai/mistral-7b-instruct",
];

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type MemoryContext = {
  conversationId: string;
  agentId: string;
  userId: string;
};

type Tool = {
  id?: string;
  name?: string;
  description?: string;
  method?: string;
  url?: string;
  includeApikey?: boolean;
  apiKey?: string;
  assignedAgent?: string;
};

type AgentConfig = {
  id?: string;
  name?: string;
  includeHistory?: boolean;
  model?: string;
  systemPrompt?: string;
  description?: string;
  instruction?: string;
};

type Decision =
  | { type: "identity"; message?: string }
  | { type: "out_of_scope"; message?: string; reason?: string }
  | { type: "clarify"; message: string }
  | { type: "tool"; tool: string; params: Record<string, unknown> }
  | { type: "response"; content: string };

const memoryStore = new Map<string, ChatMessage[]>();

function getMemory(conversationId: string): ChatMessage[] {
  return memoryStore.get(conversationId) ?? [];
}

function addMemory(conversationId: string, message: ChatMessage): void {
  const existing = memoryStore.get(conversationId) ?? [];
  memoryStore.set(conversationId, [...existing, message].slice(-MAX_MEMORY_MESSAGES));
}

async function getConversationMemory(context: MemoryContext): Promise<ChatMessage[]> {
  const localMemory = getMemory(context.conversationId);

  if (!context.agentId || !context.userId) {
    return localMemory;
  }

  try {
    const rows = await fetchQuery(api.conversation.GetConversationMessages, {
      conversationId: context.conversationId,
      agentId: context.agentId,
      userId: context.userId,
      limit: MAX_MEMORY_MESSAGES,
    });

    const dbMessages = rows.map((row) => ({
      role: row.role,
      content: row.content,
    })) as ChatMessage[];

    memoryStore.set(context.conversationId, dbMessages);
    return dbMessages;
  } catch (error) {
    console.error("[agent-chat] failed to fetch conversation history", error);
    return localMemory;
  }
}

async function persistMessage(context: MemoryContext, message: ChatMessage): Promise<void> {
  addMemory(context.conversationId, message);

  if (!context.agentId || !context.userId) {
    return;
  }

  try {
    await fetchMutation(api.conversation.SaveConversationMessage, {
      conversationId: context.conversationId,
      agentId: context.agentId,
      userId: context.userId,
      role: message.role,
      content: message.content,
    });
  } catch (error) {
    console.error("[agent-chat] failed to persist conversation message", error);
  }
}

async function callModel(messages: ChatMessage[], model?: string): Promise<string> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      messages,
      temperature: 0,
      stream: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Model call failed (${res.status} ${res.statusText})`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

async function callModelStream(messages: ChatMessage[], model?: string): Promise<Response> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      messages,
      temperature: 0,
      stream: true,
    }),
  });

  if (!res.ok) {
    throw new Error(`Model stream failed (${res.status} ${res.statusText})`);
  }

  return res;
}

function safeText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function resolveModel(model: string): string {
  const normalized = model.trim().toLowerCase();
  if (!normalized) return DEFAULT_MODEL;

  const modelMap: Record<string, string> = {
    "gemini-flash-1.2": "google/gemini-2.0-flash-001",
    "gemini-flash-1.5": "google/gemini-2.0-flash-001",
    "gemini-pro-1.2": "google/gemini-pro-1.5",
    "gemini-pro-2.0": "google/gemini-2.0-pro-exp-02-05",
    "openrouter/free": "openrouter/free",
  };

  if (modelMap[normalized]) {
    return modelMap[normalized];
  }

  if (normalized.includes("/")) {
    return model;
  }

  return DEFAULT_MODEL;
}

function getModelCandidates(preferred: string): string[] {
  const ordered = [resolveModel(preferred), ...FALLBACK_MODELS];
  return [...new Set(ordered.filter(Boolean))];
}

async function callModelWithFallback(
  messages: ChatMessage[],
  preferredModel: string,
): Promise<string> {
  let lastError: unknown;
  for (const model of getModelCandidates(preferredModel)) {
    try {
      return await callModel(messages, model);
    } catch (error) {
      lastError = error;
      console.error("[agent-chat] callModel failed", { model, error });
    }
  }
  throw lastError ?? new Error("All models failed");
}

async function callModelStreamWithFallback(
  messages: ChatMessage[],
  preferredModel: string,
): Promise<Response> {
  let lastError: unknown;
  for (const model of getModelCandidates(preferredModel)) {
    try {
      return await callModelStream(messages, model);
    } catch (error) {
      lastError = error;
      console.error("[agent-chat] callModelStream failed", { model, error });
    }
  }
  throw lastError ?? new Error("All stream models failed");
}

function normalizeToolsForAgent(tools: Tool[], agent: AgentConfig): Tool[] {
  const agentId = safeText(agent.id);
  const agentName = safeText(agent.name);
  return tools.filter((tool) => {
    const assigned = safeText(tool.assignedAgent);
    return assigned === agentId || assigned === agentName;
  });
}

function getAgentInstruction(agent: AgentConfig, globalSystemPrompt = ""): string {
  return (
    safeText(agent.instruction) ||
    safeText(agent.systemPrompt) ||
    safeText(globalSystemPrompt) ||
    safeText(agent.description) ||
    ""
  );
}

function buildScopeMessage(agent: AgentConfig, tools: Tool[]): string {
  const agentName = safeText(agent.name) || "this agent";
  const toolNames = tools.map((tool) => safeText(tool.name)).filter(Boolean);
  if (toolNames.length > 0) {
    return `I am ${agentName}. I can help only with ${toolNames.join(", ")}. Please ask a question related to this agent's scope.`;
  }
  return `I am ${agentName}. Please ask questions related to this agent's configured instructions.`;
}

function isIdentityQuestion(input: string): boolean {
  const text = input.toLowerCase();
  return (
    text.includes("who are you") ||
    text.includes("what type of agent") ||
    text.includes("what kind of agent") ||
    text.includes("what are you")
  );
}

function extractJsonObject(raw: string): Decision | null {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned) as Decision;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as Decision;
      } catch {
        return null;
      }
    }
    return null;
  }
}

async function decideAction(
  input: string,
  memory: ChatMessage[],
  agent: AgentConfig,
  tools: Tool[],
  workflowRules: string[],
  globalSystemPrompt: string,
): Promise<Decision | null> {
  const agentName = safeText(agent.name) || "Agent";
  const instruction = getAgentInstruction(agent, globalSystemPrompt);
  const toolSummary = tools.map((tool) => ({
    name: safeText(tool.name),
    description: safeText(tool.description),
    method: safeText(tool.method || "GET"),
    url: safeText(tool.url),
  }));

  const prompt = `
You are the decision engine for one custom agent.

Agent name: ${agentName}
Agent instruction: ${instruction || "(none)"}
Available tools: ${JSON.stringify(toolSummary)}
Workflow rules from builder: ${JSON.stringify(workflowRules)}

Choose exactly one action and output JSON only.

Rules:
1) For greetings/casual chat, use {"type":"response","content":"..."}.
2) If user asks about agent identity, use {"type":"identity","message":"..."}.
3) If required input is missing (example: city is missing), use {"type":"clarify","message":"..."}.
4) If tool call is needed and all params are available, use {"type":"tool","tool":"exact tool name","params":{}}.
5) Use out_of_scope only when request is clearly unrelated to this agent.
6) Keep messages natural and AI-like, not robotic.
`.trim();

  const raw = await callModel(
    [
      { role: "system", content: prompt },
      ...memory,
      { role: "user", content: input },
    ],
    resolveModel(safeText(agent.model)),
  );

  return extractJsonObject(raw);
}

function replaceUrlParams(url: string, params: Record<string, unknown>): string {
  return url.replace(/\{([^}]+)\}/g, (_m, key: string) => {
    const value = params[key];
    return value === undefined || value === null
      ? `{${key}}`
      : encodeURIComponent(String(value));
  });
}

async function executeTool(tool: Tool, params: Record<string, unknown>): Promise<unknown> {
  const method = safeText(tool.method || "GET").toUpperCase();
  let url = replaceUrlParams(safeText(tool.url), params);

  const unresolved = url.match(/\{[^}]+\}/g);
  if (unresolved?.length) {
    throw new Error(`Missing required parameters: ${unresolved.join(", ")}`);
  }

  if (tool.includeApikey && safeText(tool.apiKey)) {
    url += url.includes("?") ? `&key=${tool.apiKey}` : `?key=${tool.apiKey}`;
  }

  const requestInit: RequestInit = { method };

  if (method === "POST") {
    requestInit.headers = { "Content-Type": "application/json" };
    requestInit.body = JSON.stringify(params);
  }

  const res = await fetch(url, requestInit);
  if (!res.ok) {
    throw new Error(`Tool request failed (${res.status} ${res.statusText})`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

function textResponse(message: string, status = 200): Response {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function stringifyToolResult(value: unknown, maxChars = 12000): string {
  let text = "";
  try {
    text = JSON.stringify(value, null, 2);
  } catch {
    text = String(value);
  }
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n... (truncated)`;
}

function createStreamResponse(
  upstream: Response,
  onComplete: (fullText: string) => Promise<void> | void,
): Response {
  const reader = upstream.body?.getReader();
  if (!reader) {
    return textResponse("I could not open response stream. Please try again.");
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let fullText = "";
  let completed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line.startsWith("data: ")) continue;

            const payload = line.slice("data: ".length).trim();
            if (!payload) continue;

            if (payload === "[DONE]") {
              completed = true;
              await onComplete(fullText);
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(payload);
              const token = parsed?.choices?.[0]?.delta?.content ?? "";
              if (!token) continue;
              fullText += token;
              controller.enqueue(encoder.encode(token));
            } catch {
              // Skip malformed events.
            }
          }
        }
      } catch {
        controller.error(new Error("Streaming interrupted."));
        return;
      } finally {
        if (!completed) {
          await onComplete(fullText);
        }
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return textResponse("Invalid request body. Please try again.");
  }

  const input = safeText(body.input).trim();
  const tools = Array.isArray(body.tools) ? (body.tools as Tool[]) : [];
  const agents = Array.isArray(body.agents) ? (body.agents as AgentConfig[]) : [];
  const conversationId = safeText(body.conversationId) || crypto.randomUUID();
  const agentId = safeText(body.agentId).trim();
  const userId = safeText(body.userId).trim();
  const requestedAgentName = safeText(body.agentName);
  const globalSystemPrompt = safeText(body.systemPrompt);
  const workflowRules = Array.isArray(body.workflowRules)
    ? body.workflowRules
      .map((value) => safeText(value))
      .filter(Boolean)
    : [];

  if (!input) {
    return textResponse("Please enter a message.");
  }

  if (input.length > MAX_INPUT_LENGTH) {
    return textResponse(
      `Your message is too long (${input.length} characters). Please keep it under ${MAX_INPUT_LENGTH} characters.`,
    );
  }

  const activeAgent =
    agents.find((agent) => safeText(agent.name) === requestedAgentName) ?? agents[0];

  if (!activeAgent) {
    return textResponse("No agent is configured yet. Please reboot the agent once.");
  }

  const agentTools = normalizeToolsForAgent(tools, activeAgent);
  const includeHistory = activeAgent.includeHistory !== false;
  const memoryContext: MemoryContext = {
    conversationId,
    agentId,
    userId,
  };
  const memory = includeHistory ? await getConversationMemory(memoryContext) : [];
  const resolvedInstruction = getAgentInstruction(activeAgent, globalSystemPrompt);

  // Generic no-tool agents should still work fully from prompt/instruction.
  if (agentTools.length === 0) {
    const directMessages: ChatMessage[] = [
      {
        role: "system",
        content: `
You are ${safeText(activeAgent.name) || "an AI agent"}.
Instruction: ${resolvedInstruction || "Be helpful and follow user intent."}
Workflow rules: ${JSON.stringify(workflowRules)}
Answer naturally according to the configured instruction.
`.trim(),
      },
      ...(includeHistory ? memory : []),
      { role: "user", content: input },
    ];

    try {
      const upstream = await callModelStreamWithFallback(
        directMessages,
        safeText(activeAgent.model),
      );
      await persistMessage(memoryContext, { role: "user", content: input });
      return createStreamResponse(upstream, async (fullText) => {
        await persistMessage(memoryContext, {
          role: "assistant",
          content: fullText || "I can help with that.",
        });
      });
    } catch {
      let directFallback = "";
      try {
        directFallback = await callModelWithFallback(
          directMessages,
          safeText(activeAgent.model),
        );
      } catch {
        directFallback = "I can help with that.";
      }
      await persistMessage(memoryContext, { role: "user", content: input });
      await persistMessage(memoryContext, { role: "assistant", content: directFallback });
      return textResponse(directFallback);
    }
  }

  let decision: Decision | null = null;
  try {
    decision = await decideAction(
      input,
      memory,
      activeAgent,
      agentTools,
      workflowRules,
      globalSystemPrompt,
    );
  } catch {
    decision = null;
  }

  if (!decision) {
    const fallbackPrompt = `
You are ${safeText(activeAgent.name) || "an AI agent"}.
Instructions: ${resolvedInstruction}
User message: ${input}
Reply naturally in one short response.
`.trim();
    let fallback = "";
    try {
      fallback = await callModelWithFallback(
        [{ role: "system", content: fallbackPrompt }],
        safeText(activeAgent.model),
      );
    } catch {
      fallback = "I can help with that. Could you share a bit more detail?";
    }
    await persistMessage(memoryContext, { role: "user", content: input });
    await persistMessage(memoryContext, { role: "assistant", content: fallback });
    return textResponse(fallback);
  }

  if (decision.type === "identity" || isIdentityQuestion(input)) {
    const identity =
      safeText((decision as { message?: string }).message) ||
      `I am ${safeText(activeAgent.name) || "your agent"}.`;
    await persistMessage(memoryContext, { role: "user", content: input });
    await persistMessage(memoryContext, { role: "assistant", content: identity });
    return textResponse(identity);
  }

  if (decision.type === "clarify") {
    const clarifyMessage =
      safeText(decision.message) ||
      "Could you share a little more detail so I can continue?";
    await persistMessage(memoryContext, { role: "user", content: input });
    await persistMessage(memoryContext, { role: "assistant", content: clarifyMessage });
    return textResponse(clarifyMessage);
  }

  if (decision.type === "out_of_scope") {
    let response = safeText(decision.message);
    if (!response) {
      try {
        response = await callModelWithFallback(
          [
            {
              role: "system",
              content: `You are ${safeText(activeAgent.name) || "an AI agent"}. Politely explain this question is out of scope in one short sentence.`,
            },
            { role: "user", content: input },
          ],
          safeText(activeAgent.model),
        );
      } catch {
        response = buildScopeMessage(activeAgent, agentTools);
      }
    }
    await persistMessage(memoryContext, { role: "user", content: input });
    await persistMessage(memoryContext, { role: "assistant", content: response });
    return textResponse(response);
  }

  if (decision.type === "response") {
    const suggested = safeText(decision.content);
    const responseMessages: ChatMessage[] = [
      {
        role: "system",
        content: `
You are ${safeText(activeAgent.name) || "an AI agent"}.
Instruction: ${resolvedInstruction}
Workflow rules: ${JSON.stringify(workflowRules)}
Respond naturally for this user message.
${suggested ? `Draft direction: ${suggested}` : ""}
`.trim(),
      },
      ...(includeHistory ? memory : []),
      { role: "user", content: input },
    ];

    try {
      const upstream = await callModelStreamWithFallback(
        responseMessages,
        safeText(activeAgent.model),
      );
      await persistMessage(memoryContext, { role: "user", content: input });
      return createStreamResponse(upstream, async (fullText) => {
        await persistMessage(memoryContext, {
          role: "assistant",
          content: fullText || suggested || "I can help with that.",
        });
      });
    } catch {
      const content = suggested || buildScopeMessage(activeAgent, agentTools);
      await persistMessage(memoryContext, { role: "user", content: input });
      await persistMessage(memoryContext, { role: "assistant", content });
      return textResponse(content);
    }
  }

  const selectedTool =
    agentTools.find((tool) => safeText(tool.name).toLowerCase() === decision.tool.toLowerCase()) ??
    agentTools.find((tool) =>
      safeText(tool.name).toLowerCase().includes(decision.tool.toLowerCase()),
    );

  if (!selectedTool) {
    let response = "";
    try {
      response = await callModelWithFallback(
        [
          {
            role: "system",
            content: `You are ${safeText(activeAgent.name) || "an AI agent"}. The required tool is unavailable. Ask user to rephrase or try again in one short line.`,
          },
          { role: "user", content: input },
        ],
        safeText(activeAgent.model),
      );
    } catch {
      response = buildScopeMessage(activeAgent, agentTools);
    }
    await persistMessage(memoryContext, { role: "user", content: input });
    await persistMessage(memoryContext, { role: "assistant", content: response });
    return textResponse(response);
  }

  let toolResult: unknown;
  try {
    toolResult = await executeTool(selectedTool, decision.params || {});
  } catch {
    const message = `I am ${safeText(activeAgent.name) || "this agent"}, but I could not fetch data from "${safeText(selectedTool.name)}" right now. Please try again.`;
    await persistMessage(memoryContext, { role: "user", content: input });
    await persistMessage(memoryContext, { role: "assistant", content: message });
    return textResponse(message);
  }
  const output = (activeAgent as any).output;
  const schema = (activeAgent as any).outputSchema;
  const finalSystemPrompt = `
You are ${safeText(activeAgent.name) || "an AI agent"}.
Instruction: ${resolvedInstruction || "Answer only within your configured scope."}
Workflow rules: ${JSON.stringify(workflowRules)}
${output === "json" && schema
      ? `
STRICT OUTPUT RULE (VERY IMPORTANT):
- You MUST return ONLY valid JSON.
- Do NOT return text, explanation, markdown, or extra words.
- Follow this exact structure:

${schema}

- If you break this format, the system will fail.
`
      : ""
    }
Stay inside this scope. If user asks outside scope, refuse briefly and point back to allowed scope.
Response policy:
1) By default, provide a useful formatted response that includes the important fields from the tool output.
2) If user asks for a specific subset (example: "only temperature"), return only that subset.
3) Do not hide tool data by over-summarizing.
4) If tool output is JSON, convert it into human-friendly insights.
Style policy:
1) Do NOT print raw JSON and do NOT print long key:value dumps.
2) Write in natural conversational language with short sections.
3) Use at most 3-6 bullets only for important points.
4) Prefer this structure: quick summary sentence -> key highlights -> optional helpful next question.
5) Keep response concise and readable on chat UI.
6) Only show raw field-level detail when user explicitly asks for "raw", "full JSON", or "all fields".
7) If data is tabular, use a VALID markdown table with header row and separator row.
8) Put each table row on a new line. Do not merge all rows into one paragraph.
`.trim();

  const finalMessages: ChatMessage[] = [
    { role: "system", content: finalSystemPrompt },
    ...(includeHistory ? memory : []),
    {
      role: "user",
      content: `User message: ${input}

Tool (${safeText(selectedTool.name)}) output:
${stringifyToolResult(toolResult)}

Return response based on the policy above.`,
    },
  ];

  try {
    const upstream = await callModelStreamWithFallback(
      finalMessages,
      safeText(activeAgent.model),
    );
    await persistMessage(memoryContext, { role: "user", content: input });
    return createStreamResponse(upstream, async (fullText) => {
      await persistMessage(memoryContext, {
        role: "assistant",
        content:
          fullText ||
          `I am ${safeText(activeAgent.name) || "this agent"}. I retrieved the data.`,
      });
    });
  } catch {
    let finalAnswer = "";
    try {
      finalAnswer = await callModelWithFallback(
        finalMessages,
        safeText(activeAgent.model),
      );
    } catch {
      finalAnswer = `I am ${safeText(activeAgent.name) || "this agent"}. I retrieved the data but could not generate a final response. Please try again.`;
    }

    await persistMessage(memoryContext, { role: "user", content: input });
    await persistMessage(memoryContext, { role: "assistant", content: finalAnswer });
    return textResponse(finalAnswer);
  }
}

export async function GET(req: NextRequest) {
  const requestedConversationId = safeText(req.nextUrl.searchParams.get("conversationId"));
  const agentId = safeText(req.nextUrl.searchParams.get("agentId"));
  const userId = safeText(req.nextUrl.searchParams.get("userId"));
  const preview = safeText(req.nextUrl.searchParams.get("preview")) === "1";

  const conversationId =
    requestedConversationId ||
    (agentId && userId
      ? `${preview ? "preview" : "chat"}:${userId}:${agentId}`
      : crypto.randomUUID());

  const messages =
    agentId && userId
      ? await getConversationMemory({
        conversationId,
        agentId,
        userId,
      })
      : [];

  return new Response(JSON.stringify({ conversationId, messages }), {
    headers: { "Content-Type": "application/json" },
  });
}

