import { NextRequest, NextResponse } from "next/server";

type FlowNode = {
  id: string;
  type?: string;
  label?: string;
  settings?: Record<string, unknown>;
  next?: unknown;
};

type AgentToolConfig = {
  systemPrompt: string;
  primaryAgentName: string;
  workflowRules: string[];
  agents: Array<{
    id: string;
    name: string;
    model: string;
    includeHistory: boolean;
    output: string;
    outputSchema?: Record<string, any>;
    tools: Array<{
      toolId: string;
      instruction: string;
    }>;
  }>;
  tools: Array<{
    id: string;
    name: string;
    description: string;
    method: string;
    url: string;
    includeApikey: boolean;
    apiKey: string;
    parameters: Record<string, string>;
    usage: string[];
    assignedAgent: string;
  }>;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function getNodeName(node: FlowNode): string {
  const settings = (node.settings ?? {}) as Record<string, unknown>;
  return asString(settings.name) || asString(node.label) || "";
}

function getNodeInstruction(node: FlowNode): string {
  const settings = (node.settings ?? {}) as Record<string, unknown>;
  return asString(settings.instructions) || asString(settings.instruction);
}

function getNextTargets(next: unknown): string[] {
  if (typeof next === "string" && next) {
    return [next];
  }
  if (Array.isArray(next)) {
    return next.filter((value): value is string => typeof value === "string");
  }
  if (next && typeof next === "object") {
    const values = Object.values(next as Record<string, unknown>);
    return values.filter((value): value is string => typeof value === "string");
  }
  return [];
}

function buildOrder(flow: FlowNode[], startNodeId?: string): string[] {
  const nodeMap = new Map(flow.map((node) => [node.id, node]));
  const visited = new Set<string>();
  const order: string[] = [];
  const queue: string[] = [];

  if (startNodeId && nodeMap.has(startNodeId)) {
    queue.push(startNodeId);
  }

  while (queue.length > 0) {
    const currentId = queue.shift() as string;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const node = nodeMap.get(currentId);
    if (!node) continue;
    order.push(currentId);

    for (const targetId of getNextTargets(node.next)) {
      if (!visited.has(targetId) && nodeMap.has(targetId)) {
        queue.push(targetId);
      }
    }
  }

  for (const node of flow) {
    if (!visited.has(node.id)) {
      order.push(node.id);
    }
  }

  return order;
}

function extractPathParameters(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const matches = url.match(/\{([^}]+)\}/g) ?? [];
  for (const match of matches) {
    const key = match.slice(1, -1).trim();
    if (key) params[key] = "string";
  }
  return params;
}

function getAssignedAgentId(
  toolNodeId: string,
  order: string[],
  nodeMap: Map<string, FlowNode>,
  incoming: Map<string, string[]>,
): string {
  const startIndex = order.indexOf(toolNodeId);
  if (startIndex > 0) {
    for (let i = startIndex - 1; i >= 0; i -= 1) {
      const candidate = nodeMap.get(order[i]);
      if (candidate?.type === "AgentNode") {
        return candidate.id;
      }
    }
  }

  const queue: string[] = [toolNodeId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift() as string;
    if (visited.has(current)) continue;
    visited.add(current);

    const parents = incoming.get(current) ?? [];
    for (const parentId of parents) {
      const parentNode = nodeMap.get(parentId);
      if (!parentNode) continue;
      if (parentNode.type === "AgentNode") {
        return parentNode.id;
      }
      queue.push(parentId);
    }
  }

  const firstAgent = order
    .map((id) => nodeMap.get(id))
    .find((node) => node?.type === "AgentNode");

  return firstAgent?.id ?? "";
}

function buildConfig(jsonConfig: Record<string, unknown>): AgentToolConfig {
  const flow = Array.isArray(jsonConfig.flow)
    ? (jsonConfig.flow as FlowNode[])
    : [];

  const startNodeId = asString(jsonConfig.startNode);
  const order = buildOrder(flow, startNodeId);
  const nodeMap = new Map(flow.map((node) => [node.id, node]));

  const incoming = new Map<string, string[]>();
  for (const node of flow) {
    for (const target of getNextTargets(node.next)) {
      const previous = incoming.get(target) ?? [];
      previous.push(node.id);
      incoming.set(target, previous);
    }
  }

  const orderedNodes = order
    .map((id) => nodeMap.get(id))
    .filter((node): node is FlowNode => Boolean(node));
  const orderedNodeMap = new Map(orderedNodes.map((node) => [node.id, node]));

  const agentNodes = orderedNodes.filter((node) => node.type === "AgentNode");
  const apiNodes = orderedNodes.filter((node) => node.type === "ApiNode");
  const toolInstructionByToolId = new Map<string, string>();

  const tools = apiNodes.map((node) => {
    const settings = (node.settings ?? {}) as Record<string, unknown>;
    const url = asString(settings.url);
    toolInstructionByToolId.set(node.id, asString(settings.instruction));
    return {
      id: node.id,
      name: getNodeName(node),
      description: asString(settings.description) || asString(node.label),
      method: asString(settings.method).toUpperCase() || "GET",
      url,
      includeApikey: asBoolean(settings.includeApiKey, true),
      apiKey: asString(settings.apiKey),
      parameters: extractPathParameters(url),
      usage: [],
      assignedAgent: getAssignedAgentId(node.id, order, nodeMap, incoming),
    };
  });

  const toolsByAgentId = new Map<string, typeof tools>();
  for (const tool of tools) {
    if (!tool.assignedAgent) continue;
    const list = toolsByAgentId.get(tool.assignedAgent) ?? [];
    list.push(tool);
    toolsByAgentId.set(tool.assignedAgent, list);
  }

  const agents = agentNodes.map((node) => {
    const settings = (node.settings ?? {}) as Record<string, unknown>;
    const assignedTools = toolsByAgentId.get(node.id) ?? [];
    return {
      id: node.id,
      name: getNodeName(node),
      model: asString(settings.model),
      includeHistory: asBoolean(settings.includeHistory, true),
      output: asString(settings.output) || "text",
      outputSchema: (settings.schema as Record<string, any>) || undefined,
      tools: assignedTools.map((tool) => ({
        toolId: tool.id,
        instruction: toolInstructionByToolId.get(tool.id) || "",
      })),
    };
  });

  const primaryAgentName = agents[0]?.name ?? "";
  const systemPrompt =
    getNodeInstruction(agentNodes[0] ?? { id: "", type: "" }) || "";
  const workflowRules: string[] = [];

  const parseNullCheck = (
    text: string,
  ): { variable: string; expectsNull: boolean } | null => {
    const normalized = text.replace(/\s+/g, "");
    const eqNull = normalized.match(/^([a-zA-Z_][a-zA-Z0-9_]*)==null$/i);
    if (eqNull) {
      return { variable: eqNull[1], expectsNull: true };
    }
    const neqNull = normalized.match(/^([a-zA-Z_][a-zA-Z0-9_]*)!=null$/i);
    if (neqNull) {
      return { variable: neqNull[1], expectsNull: false };
    }
    return null;
  };

  for (const node of orderedNodes) {
    if (node.type !== "IfElseNode") continue;

    const settings = (node.settings ?? {}) as Record<string, unknown>;
    const condition = asString(settings.condition);
    const elseCondition = asString(settings.elseCondition);

    if (condition) {
      workflowRules.push(`If condition: ${condition}`);
    }
    if (elseCondition) {
      workflowRules.push(`Else condition: ${elseCondition}`);
    }

    const next = (node.next ?? {}) as Record<string, unknown>;
    const ifTarget = asString(next.if);
    const elseTarget = asString(next.else);

    const ifTargetNode = ifTarget ? orderedNodeMap.get(ifTarget) : undefined;
    const elseTargetNode = elseTarget ? orderedNodeMap.get(elseTarget) : undefined;

    const ifEndMessage =
      ifTargetNode?.type === "EndNode"
        ? asString(
            ((ifTargetNode.settings ?? {}) as Record<string, unknown>).schema,
          )
        : "";
    const elseEndMessage =
      elseTargetNode?.type === "EndNode"
        ? asString(
            ((elseTargetNode.settings ?? {}) as Record<string, unknown>).schema,
          )
        : "";

    const nullCheck = parseNullCheck(condition) ?? parseNullCheck(elseCondition);
    if (nullCheck) {
      const missingMessage = nullCheck.expectsNull ? ifEndMessage : elseEndMessage;
      if (missingMessage) {
        workflowRules.push(
          `If "${nullCheck.variable}" is missing/null then reply exactly: ${missingMessage}`,
        );
      } else {
        workflowRules.push(
          `If "${nullCheck.variable}" is missing/null then ask user to provide "${nullCheck.variable}".`,
        );
      }
    }
  }

  for (const node of orderedNodes) {
    if (node.type !== "ApprovalNode") continue;

    const settings = (node.settings ?? {}) as Record<string, unknown>;
    const approvalName = getNodeName(node) || "approval";
    const approvalMessage = asString(settings.message);
    const next = (node.next ?? {}) as Record<string, unknown>;
    const approveTarget = asString(next.approve);
    const rejectTarget = asString(next.reject);

    if (approvalMessage) {
      workflowRules.push(
        `Before continuing, ask for user approval at "${approvalName}" with message: ${approvalMessage}`,
      );
    } else {
      workflowRules.push(
        `Before continuing, ask for user approval at "${approvalName}" and proceed only after explicit approval.`,
      );
    }

    if (approveTarget) {
      const approveNode = orderedNodeMap.get(approveTarget);
      const approveNodeName = getNodeName(approveNode ?? { id: "" });
      const approveTargetLabel =
        approveNodeName || asString(approveNode?.type) || approveTarget;
      workflowRules.push(
        `If approved, continue to "${approveTargetLabel}".`,
      );
    } else {
      workflowRules.push(
        "If approved, continue with the next workflow step.",
      );
    }

    if (rejectTarget) {
      const rejectNode = orderedNodeMap.get(rejectTarget);
      if (rejectNode?.type === "EndNode") {
        const rejectEndMessage = asString(
          ((rejectNode.settings ?? {}) as Record<string, unknown>).schema,
        );
        workflowRules.push(
          rejectEndMessage
            ? `If rejected, end flow and reply exactly: ${rejectEndMessage}`
            : "If rejected, end flow politely.",
        );
      } else {
        const rejectNodeName = getNodeName(rejectNode ?? { id: "" });
        const rejectTargetLabel =
          rejectNodeName || asString(rejectNode?.type) || rejectTarget;
        workflowRules.push(`If rejected, go to "${rejectTargetLabel}".`);
      }
    } else {
      workflowRules.push("If rejected, do not fetch details and end flow.");
    }
  }

  return {
    systemPrompt,
    primaryAgentName,
    workflowRules,
    agents,
    tools,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const jsonConfig = (body?.jsonConfig ?? {}) as Record<string, unknown>;
    const config = buildConfig(jsonConfig);
    return NextResponse.json(config);
  } catch {
    return NextResponse.json(
      { error: "Invalid input JSON" },
      { status: 400 },
    );
  }
}
