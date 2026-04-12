import { NextRequest } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

type AgentToolConfig = {
  tools?: unknown[];
  agents?: unknown[];
  systemPrompt?: string;
  workflowRules?: string[];
  primaryAgentName?: string;
};

function textResponse(message: string, status = 400): Response {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return textResponse("Invalid request body.");
  }

  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const agentId = typeof body.agentId === "string" ? body.agentId.trim() : "";
  const input = typeof body.input === "string" ? body.input.trim() : "";

  if (!userId || !agentId || !input) {
    return textResponse("Required fields: userId, agentId, input.");
  }

  const agent = await fetchQuery(api.agent.GetAgentById, { agentId });
  if (!agent) {
    return textResponse("Agent not found.", 404);
  }

  const config = (agent.agentToolConfig ?? {}) as AgentToolConfig;
  const conversationId = `sdk:${userId}:${agentId}`;

  const payload = {
    input,
    tools: Array.isArray(config.tools) ? config.tools : [],
    agents: Array.isArray(config.agents) ? config.agents : [],
    systemPrompt: typeof config.systemPrompt === "string" ? config.systemPrompt : "",
    workflowRules: Array.isArray(config.workflowRules) ? config.workflowRules : [],
    agentName:
      (typeof config.primaryAgentName === "string" && config.primaryAgentName) ||
      (typeof agent.name === "string" ? agent.name : ""),
    conversationId,
  };

  const upstream = await fetch(new URL("/api/agent-chat", req.url), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-agent-sdk-internal": "1",
    },
    body: JSON.stringify(payload),
  });

  if (!upstream.body) {
    const fallbackText = await upstream.text();
    return textResponse(fallbackText || "No response stream received.", upstream.status || 502);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
