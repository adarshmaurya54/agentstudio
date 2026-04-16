import AgentNode from "@/app/agent-builder/_customNodes/AgentNode";
import ApiNode from "@/app/agent-builder/_customNodes/ApiNode";
import ApprovalNode from "@/app/agent-builder/_customNodes/ApprovalNode";
import EndNode from "@/app/agent-builder/_customNodes/EndNode";
import IfElseNode from "@/app/agent-builder/_customNodes/IfElseNode";
import StartNode from "@/app/agent-builder/_customNodes/StartNode";
import WhileNode from "@/app/agent-builder/_customNodes/WhileNode";

export const nodeTypes = {
    StartNode: StartNode,
    AgentNode: AgentNode,
    EndNode: EndNode,
    IfElseNode: IfElseNode,
    WhileNode: WhileNode,
    ApprovalNode: ApprovalNode,
    ApiNode: ApiNode
};