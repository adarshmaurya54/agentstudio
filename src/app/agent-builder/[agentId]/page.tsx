'use client'
import Header from '../_components/Header'
import { useState, useCallback, useContext, useEffect } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, Background, Controls, MiniMap, Panel } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import StartNode from '../_customNodes/StartNode';
import AgentNode from '../_customNodes/AgentNode';
import AiAgentToolsPanel from '../_components/AiAgentToolsPanel';
import { WorkflowContext } from '@/context/WorkflowContext';
import { useConvex, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useParams } from 'next/navigation';
import { Agent } from '@/types/agentTypes';
import { Id } from '../../../../convex/_generated/dataModel';

const nodeTypes = {
    StartNode: StartNode,
    AgentNode: AgentNode
};

function AgentBuilder() {
    const { addedNodes, setAddedNodes, nodeEdges, setNodeEdges } = useContext(WorkflowContext);
    const { agentId } = useParams();
    const nodes = addedNodes;
    const edges = nodeEdges;

    const [agentDetails, setAgentDetails] = useState<Agent>();
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const convex = useConvex();
    const updateAgentDetails = useMutation(api.agent.updateAgentDetail);

    // 🔹 Load initial data
    useEffect(() => {
        GetAgentDetails();
    }, []);

    const GetAgentDetails = async () => {
        const result = await convex.query(api.agent.GetAgentById, {
            agentId: agentId as string
        });

        setAgentDetails(result);

        // ✅ Load into draft state
        setAddedNodes(result?.nodes || []);
        setNodeEdges(result?.edges || []);
    };

    // 🔹 Track unsaved changes
    useEffect(() => {
        setIsDirty(true);
    }, [nodes, edges]);

    const saveNodesAndEdges = async () => {
        if (!agentDetails?._id) return;

        setIsSaving(true);

        try {
            const cleanNodes = nodes.map((node: any) => ({
                id: node.id,
                type: node.type,
                position: node.position,
                data: {
                    label: node.data?.label ?? ""
                }
            }));

            const cleanEdges = edges.map((edge: any) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                type: edge.type
            }));

            await updateAgentDetails({
                id: agentDetails._id as Id<"AgentTable">,
                nodes: cleanNodes,
                edges: cleanEdges
            });

            setIsDirty(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    // 🔹 Discard changes
    const resetChanges = () => {
        setIsDirty(false);
        setAddedNodes(agentDetails?.nodes || []);
        setNodeEdges(agentDetails?.edges || []);
    };

    // 🔹 React Flow handlers
    const onNodesChange = useCallback((changes: any) => {
        setAddedNodes((prevNodes: any) =>
            applyNodeChanges(changes, prevNodes)
        );
    }, []);

    const onEdgesChange = useCallback((changes: any) => {
        setNodeEdges((prevEdges: any) =>
            applyEdgeChanges(changes, prevEdges)
        );
    }, []);

    const onConnect = useCallback((params: any) => {
        setNodeEdges((prevEdges: any) => addEdge(params, prevEdges));
    }, []);
    console.log(isDirty)
    return (
        <div>
            <Header agentDetails={agentDetails} />

            <div style={{ width: '100vw', height: '100vh' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                    nodeTypes={nodeTypes}
                >
                    <Controls />
                    {/* @ts-ignore */}
                    <Background variant='dots' gap={15} size={1} />

                    {/* LEFT PANEL */}
                    <Panel position="top-left" style={{ top: 55 }}>
                        <AiAgentToolsPanel />
                    </Panel>

                    {/* RIGHT PANEL (SAVE CONTROLS) */}
                    <Panel position='bottom-center' style={{ bottom: 18, }}>
                        <div
                            className={` relative
                                flex items-center gap-3 border border-gray-200 bg-white/60 backdrop-blur-md
                                px-2 py-2 rounded-full
                                transition-all duration-500 ease-in-out
                                ${isDirty ? "max-w-xs" : "max-w-[79px]"}
                            `}
                            style={{ width: "max-content" }}
                        >
                            <div
                                className={`
                                    absolute text-nowrap text-[10px] -bottom-7 left-1/2 -translate-x-1/2 w-fit bg-white border p-1 rounded-full
                                    transition-all duration-300 ease-in-out
                                    ${isDirty ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}
                                    `}
                            >
                                unsaved changes
                            </div>
                            <button
                                onClick={saveNodesAndEdges}
                                disabled={isSaving || !isDirty}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                                 ${isSaving || !isDirty
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "bg-black text-white hover:bg-gray-900 active:scale-95"
                                    }`}
                            >
                                {isSaving && (
                                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                )}
                                {isSaving ? "Saving..." : "Save"}
                            </button>

                            <button
                                onClick={() => { resetChanges(); setIsDirty(false) }}
                                disabled={!isDirty}
                                className={`
                                px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-500 ease-in-out
                                ${!isDirty
                                        ? "opacity-0 max-w-0 overflow-hidden px-0 pointer-events-none"
                                        : "opacity-100 max-w-[100px] bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
                                    }
    `}
                            >
                                <span className="whitespace-nowrap">Discard</span>
                            </button>
                        </div>
                    </Panel>

                </ReactFlow>
            </div>
        </div >
    );
}

export default AgentBuilder;