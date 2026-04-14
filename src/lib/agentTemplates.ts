type TemplateNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  deletable?: boolean;
  data: Record<string, unknown>;
};

type TemplateEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type?: string | null;
};

export type AgentTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  suggestedAgentName: string;
  nodes: TemplateNode[];
  edges: TemplateEdge[];
};

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "weather-assistant",
    name: "Weather Assistant",
    description: "Checks city input, calls a weather API, and returns a final response.",
    category: "Utility",
    suggestedAgentName: "Weather assistant",
    nodes: [
      {
        id: "Start",
        deletable: false,
        type: "StartNode",
        position: { x: 10, y: 220 },
        data: { label: "Start" },
      },
      {
        id: "agent-weather",
        type: "AgentNode",
        position: { x: 260, y: 200 },
        data: {
          label: "Weather agent",
          bgColor: "#E0F2FE",
          type: "AgentNode",
          id: "agent",
          settings: {
            name: "Weather agent",
            instructions:
              "Answer weather questions. If city is missing, ask user to provide city name.",
            includeHistory: true,
            model: "gemini-flash-1.2",
            output: "text",
            schema: "",
          },
        },
      },
      {
        id: "if-weather",
        type: "IfElseNode",
        position: { x: 620, y: 180 },
        data: {
          label: "If/Else",
          bgColor: "#FEF9C3",
          type: "IfElseNode",
          id: "ifElse",
          settings: {
            condition: "city!=null",
            elseCondition: "city==null",
          },
        },
      },
      {
        id: "api-weather",
        type: "ApiNode",
        position: { x: 960, y: 180 },
        data: {
          label: "Weather api",
          bgColor: "#CCFBF1",
          type: "ApiNode",
          id: "api",
          settings: {
            name: "Weather api",
            method: "GET",
            url: "https://api.weatherapi.com/v1/current.json?q={city}",
            apiKey: "",
            includeApiKey: true,
            bodyParams: "",
          },
        },
      },
      {
        id: "end-weather-success",
        type: "EndNode",
        position: { x: 1310, y: 180 },
        data: {
          label: "End",
          bgColor: "#FEE2E2",
          type: "EndNode",
          id: "end",
          settings: {
            schema: "Return weather details in a user-friendly message.",
          },
        },
      },
      {
        id: "end-weather-missing",
        type: "EndNode",
        position: { x: 980, y: 430 },
        data: {
          label: "End",
          bgColor: "#FEE2E2",
          type: "EndNode",
          id: "end",
          settings: {
            schema: "Please provide a city name.",
          },
        },
      },
    ],
    edges: [
      { id: "e-start-agent", source: "Start", target: "agent-weather" },
      { id: "e-agent-if", source: "agent-weather", target: "if-weather" },
      {
        id: "e-if-api",
        source: "if-weather",
        sourceHandle: "if",
        target: "api-weather",
      },
      {
        id: "e-if-end",
        source: "if-weather",
        sourceHandle: "else",
        target: "end-weather-missing",
      },
      {
        id: "e-api-end",
        source: "api-weather",
        target: "end-weather-success",
      },
    ],
  },
  {
    id: "faq-assistant",
    name: "FAQ Assistant",
    description: "Simple customer support flow for common questions.",
    category: "Support",
    suggestedAgentName: "FAQ assistant",
    nodes: [
      {
        id: "Start",
        deletable: false,
        type: "StartNode",
        position: { x: 10, y: 220 },
        data: { label: "Start" },
      },
      {
        id: "agent-faq",
        type: "AgentNode",
        position: { x: 260, y: 200 },
        data: {
          label: "FAQ agent",
          bgColor: "#E0F2FE",
          type: "AgentNode",
          id: "agent",
          settings: {
            name: "FAQ agent",
            instructions:
              "Answer product FAQs briefly. If question is unclear, ask one clarification.",
            includeHistory: true,
            model: "gemini-flash-1.2",
            output: "text",
            schema: "",
          },
        },
      },
      {
        id: "end-faq",
        type: "EndNode",
        position: { x: 600, y: 200 },
        data: {
          label: "End",
          bgColor: "#FEE2E2",
          type: "EndNode",
          id: "end",
          settings: {
            schema: "Final support response.",
          },
        },
      },
    ],
    edges: [
      { id: "e-start-agent-faq", source: "Start", target: "agent-faq" },
      { id: "e-agent-end-faq", source: "agent-faq", target: "end-faq" },
    ],
  },
  {
    id: "lead-qualifier",
    name: "Lead Qualifier",
    description: "Checks user intent and routes hot leads to API/webhook.",
    category: "Sales",
    suggestedAgentName: "Lead qualifier",
    nodes: [
      {
        id: "Start",
        deletable: false,
        type: "StartNode",
        position: { x: 10, y: 220 },
        data: { label: "Start" },
      },
      {
        id: "agent-lead",
        type: "AgentNode",
        position: { x: 260, y: 200 },
        data: {
          label: "Lead agent",
          bgColor: "#E0F2FE",
          type: "AgentNode",
          id: "agent",
          settings: {
            name: "Lead agent",
            instructions:
              "Collect lead details and detect if user has buying intent.",
            includeHistory: true,
            model: "gemini-flash-1.2",
            output: "text",
            schema: "",
          },
        },
      },
      {
        id: "if-lead",
        type: "IfElseNode",
        position: { x: 610, y: 180 },
        data: {
          label: "If/Else",
          bgColor: "#FEF9C3",
          type: "IfElseNode",
          id: "ifElse",
          settings: {
            condition: "intent==hot",
            elseCondition: "intent!=hot",
          },
        },
      },
      {
        id: "api-crm",
        type: "ApiNode",
        position: { x: 930, y: 180 },
        data: {
          label: "CRM webhook",
          bgColor: "#CCFBF1",
          type: "ApiNode",
          id: "api",
          settings: {
            name: "CRM webhook",
            method: "POST",
            url: "https://example.com/webhook/leads",
            apiKey: "",
            includeApiKey: false,
            bodyParams: '{ "name": "{name}", "email": "{email}" }',
          },
        },
      },
      {
        id: "end-hot",
        type: "EndNode",
        position: { x: 1240, y: 180 },
        data: {
          label: "End",
          bgColor: "#FEE2E2",
          type: "EndNode",
          id: "end",
          settings: {
            schema: "Lead submitted to CRM and confirmation sent.",
          },
        },
      },
      {
        id: "end-cold",
        type: "EndNode",
        position: { x: 930, y: 430 },
        data: {
          label: "End",
          bgColor: "#FEE2E2",
          type: "EndNode",
          id: "end",
          settings: {
            schema: "Provide nurturing response and ask follow-up.",
          },
        },
      },
    ],
    edges: [
      { id: "e-start-lead-agent", source: "Start", target: "agent-lead" },
      { id: "e-agent-lead-if", source: "agent-lead", target: "if-lead" },
      {
        id: "e-lead-if-api",
        source: "if-lead",
        sourceHandle: "if",
        target: "api-crm",
      },
      {
        id: "e-lead-if-end",
        source: "if-lead",
        sourceHandle: "else",
        target: "end-cold",
      },
      { id: "e-api-hot-end", source: "api-crm", target: "end-hot" },
    ],
  },
];

