'use client'
import React, { useEffect, useState } from 'react'
import Header from '../../_components/Header'
import { Agent } from '@/types/agentTypes';
import { useConvex, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useParams } from 'next/navigation';
import { Background, ReactFlow } from '@xyflow/react';
import { nodeTypes } from '../page';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { RefreshCcwIcon } from 'lucide-react';
import ChatUI from './_component/ChatUI';

function Preview() {
    const [config, setConfig] = useState<any>();
    const [agentDetails, setAgentDetails] = useState<Agent>();
    const [loading, setLoading] = useState(false);
    const convex = useConvex();
    const updateAgentToolConfig = useMutation(api.agent.updateAgentToolConfig)
    const { agentId } = useParams()
    // Load initial data
    useEffect(() => {
        GetAgentDetails();
    }, []);

    const GetAgentDetails = async () => {
        const result = await convex.query(api.agent.GetAgentById, {
            agentId: agentId as string
        });

        setAgentDetails(result);
    };


    // 🧩 Generate workflow once agent data is loaded
    useEffect(() => {
        if (agentDetails) {
            GenerateWorkflow()
        }
    }, [agentDetails])

    // ⚙️ Generate workflow config (node/edge relationship)
    const GenerateWorkflow = () => {
        // 🧩 Build Edge Map for quick source → target lookup
        const edgeMap = agentDetails?.edges?.reduce((acc: any, edge: any) => {
            if (!acc[edge.source]) acc[edge.source] = [];
            acc[edge.source].push(edge);
            return acc;
        }, {});

        // 🔄 Build flow array by mapping each node
        const flow = agentDetails?.nodes?.map((node: any) => {
            const connectedEdges = edgeMap[node.id] || [];
            let next: any = null;

            switch (node.type) {
                // 🧭 Conditional branching node with "if" and "else"
                case "IfElseNode": {
                    const ifEdge = connectedEdges.find((e: any) => e.sourceHandle === "if");
                    const elseEdge = connectedEdges.find((e: any) => e.sourceHandle === "else");

                    next = {
                        if: ifEdge?.target || null,
                        else: elseEdge?.target || null,
                    };
                    break;
                }

                // 🧠 Agent or AI Node
                case "AgentNode": {
                    if (connectedEdges.length === 1) {
                        next = connectedEdges[0].target;
                    } else if (connectedEdges.length > 1) {
                        next = connectedEdges.map((e: any) => e.target);
                    }
                    break;
                }

                // 🔗 API Call Node
                case "ApiNode": {
                    if (connectedEdges.length === 1) {
                        next = connectedEdges[0].target;
                    }
                    break;
                }

                // ✅ User Approval Node (manual checkpoint)
                case "UserApprovalNode": {
                    if (connectedEdges.length === 1) {
                        next = connectedEdges[0].target;
                    }
                    break;
                }

                // 🚀 Start Node
                case "StartNode": {
                    if (connectedEdges.length === 1) {
                        next = connectedEdges[0].target;
                    }
                    break;
                }

                // 🏁 End Node
                case "EndNode": {
                    next = null; // No next node
                    break;
                }

                // 🔧 Default handling for any unknown node type
                default: {
                    if (connectedEdges.length === 1) {
                        next = connectedEdges[0].target;
                    } else if (connectedEdges.length > 1) {
                        next = connectedEdges.map((e: any) => e.target);
                    }
                    break;
                }
            }

            // 🧱 Return a simplified node configuration
            return {
                id: node.id,
                type: node.type,
                label: node.data?.label || node.type,
                settings: node.data?.settings || {},
                next,
            };
        });

        // 🎯 Find the Start Node
        const startNode = agentDetails?.nodes?.find((n: any) => n.type === "StartNode");

        // 🧱 Final Config structure
        const config = {
            startNode: startNode?.id || null,
            flow,
        };

        console.log('Generated Config:', JSON.stringify(config));
        setConfig(config);
    }
    const GenerateAgentToolConfig = async () => {
        try {
            setLoading(true);
            const response = await axios.post('/api/generate-agent-tool-config', {
                jsonConfig: config
            });
            setLoading(false);
            console.log('Generated Agent Config:', response.data);
            // update agent tool config in database
            await updateAgentToolConfig({
                id: agentDetails?._id as any,
                agentToolConfig: response.data,
            });
            GetAgentDetails();
        } catch (error) {
            setLoading(false);
            console.error('Error generating agent config:', error);
        }
    }


    return (
        <div>
            <Header agentDetails={agentDetails} previewOption={false} />
            <div className='grid grid-cols-1 flex-col-reverse md:grid-cols-5 p-5 gap-3'>
                <div className='relative order-2 md:order-1 md:col-span-3 border rounded-2xl overflow-hidden'>
                    <h2 className='absolute top-2 left-2'>Preview</h2>
                    <div style={{ width: '100%', height: '87vh' }}>
                        <ReactFlow
                            nodes={agentDetails?.nodes || []}
                            edges={agentDetails?.edges || []}
                            fitView
                            nodeTypes={nodeTypes}
                            draggable={false}
                        >
                            {/* @ts-ignore */}
                            <Background variant='dots' gap={15} size={1} />
                        </ReactFlow>
                    </div>
                </div>
                <div className='order-1 md:order-2 md:col-span-2 border rounded-2xl h-[87vh] flex flex-col'>

                    {!agentDetails?.agentToolConfig ? <div className='flex items-center justify-center h-full'><Button onClick={GenerateAgentToolConfig} disabled={loading}>
                        <RefreshCcwIcon className={`${loading && 'animate-spin'}`} />
                        Reboot Agent
                    </Button></div> : <ChatUI GenerateAgentToolConfig={GenerateAgentToolConfig} loading={loading} agentDetails={agentDetails} />}

                </div>
            </div>
        </div>
    )
}

export default Preview
