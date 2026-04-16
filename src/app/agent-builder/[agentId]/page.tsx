'use client'
import Header from '../_components/Header'
import { useState, useCallback, useContext, useEffect } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, Background, Controls, MiniMap, Panel, useOnSelectionChange, OnSelectionChangeParams } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import AiAgentToolsPanel from '../_components/AiAgentToolsPanel';
import { WorkflowContext } from '@/context/WorkflowContext';
import { useConvex, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useParams } from 'next/navigation';
import { Agent } from '@/types/agentTypes';
import { Id } from '../../../../convex/_generated/dataModel';
import { toast } from 'sonner';
import SettingPanel from '../_components/SettingPanel';
import { Button } from '@/components/ui/button';
import { ZoomSelect } from '@/components/zoom-select';
import { nodeTypes } from '@/lib/nodeTypes';

function AgentBuilder() {
    const { addedNodes, setAddedNodes, nodeEdges, setNodeEdges, setSelectedNode } = useContext(WorkflowContext);
    const { agentId } = useParams();
    const nodes = addedNodes;
    const edges = nodeEdges;

    const [agentDetails, setAgentDetails] = useState<Agent>();
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const convex = useConvex();
    const updateAgentDetails = useMutation(api.agent.updateAgentDetail);

    // Load initial data
    useEffect(() => {
        if (!agentId) return;
        console.log('Fetching details for agentId:', agentId);
        GetAgentDetails();
    }, [agentId]);

    const GetAgentDetails = async () => {
        const result = await convex.query(api.agent.GetAgentById, {
            agentId: agentId as string
        });

        setAgentDetails(result);

        // Load into draft state
        setAddedNodes(result?.nodes || nodes);
        setNodeEdges(result?.edges || edges);
    };

    // Track unsaved changes
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
                deletable: node.deletable ?? true,
                data: {
                    ...node.data,
                    label: node.data?.label ?? "",
                    bgColor: node.data?.bgColor ?? "",
                    type: node.data?.type ?? "",
                    id: node.data?.id ?? ""
                }
            }));

            const cleanEdges = edges.map((edge: any) => ({
                id: edge.id,
                source: edge.source,
                sourceHandle: edge.sourceHandle ?? null,
                target: edge.target,
                targetHandle: edge.targetHandle ?? null,
                type: edge.type ?? null
            }));

            await updateAgentDetails({
                id: agentDetails._id as Id<"AgentTable">,
                nodes: cleanNodes,
                edges: cleanEdges
            });
            toast.success('Saved successfully!');
            setIsDirty(false);
        } catch (error) {
            toast.error('Somthing went wrong!');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    // Discard changes
    const resetChanges = () => {
        setIsDirty(false);
        setAddedNodes(agentDetails?.nodes || []);
        setNodeEdges(agentDetails?.edges || []);
    };

    // React Flow handlers
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
        console.log(params, 'on connect');
        const edge = {
            ...params,
            id: `${params.source}-${params.sourceHandle}-${params.target}`,
        };

        setNodeEdges((prevEdges: any) => addEdge(edge, prevEdges));
    }, []);

    const onNodeSelect = useCallback(({ nodes, edges }: OnSelectionChangeParams) => {
        setSelectedNode(nodes[0]);
        console.log(nodes[0]);
    }, [])

    useOnSelectionChange({
        onChange: onNodeSelect
    })
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isDirty) return

            e.preventDefault()
            e.returnValue = '' // required for Chrome
        }

        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [isDirty])
    return (
        <div>
            <Header agentDetails={agentDetails} previewOption={true} />
            <div className="fixed bottom-0 right-0 z-50">
                <div className="bg-white text-xs p-2">
                    <span>AgentStudio</span>
                </div>
            </div>
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
                    <ZoomSelect position="bottom-left" />
                    {/* @ts-ignore */}
                    <Background variant='dots' gap={15} size={1} />

                    {/* agent tools */}
                    <Panel position="top-left" style={{ top: 55 }}>
                        <AiAgentToolsPanel />
                    </Panel>
                    {/* setting */}
                    <Panel position="top-right" style={{ top: 55 }}>
                        <SettingPanel />
                    </Panel>

                    {/* bottom */}
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
                                    absolute text-nowrap text-[10px] -bottom-7 left-1/2 -translate-x-1/2 w-fit bg-white p-1 rounded-full
                                    transition-all duration-300 ease-in-out
                                    ${isDirty ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}
                                    `}
                            >
                                unsaved changes
                            </div>
                            <Button
                                onClick={saveNodesAndEdges}
                                disabled={isSaving || !isDirty}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                                 ${isSaving || !isDirty
                                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                        : "active:scale-95"
                                    }`}
                            >
                                {isSaving && (
                                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                )}
                                {isSaving ? "Saving..." : "Save"}
                            </Button>

                            <Button
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
                            </Button>
                        </div>
                    </Panel>
                </ReactFlow>
            </div>
        </div >
    );
}

export default AgentBuilder;