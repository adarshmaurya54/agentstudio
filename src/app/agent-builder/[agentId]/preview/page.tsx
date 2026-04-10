'use client'
import React, { useEffect, useState, useRef } from 'react'
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

    // ✅ SPLITTER STATE
    const [leftWidth, setLeftWidth] = useState(65); // %
    const isDragging = useRef(false);

    const convex = useConvex();
    const updateAgentToolConfig = useMutation(api.agent.updateAgentToolConfig)
    const { agentId } = useParams()

    useEffect(() => {
        GetAgentDetails();
    }, []);

    const GetAgentDetails = async () => {
        const result = await convex.query(api.agent.GetAgentById, {
            agentId: agentId as string
        });
        setAgentDetails(result);
    };

    useEffect(() => {
        if (agentDetails) GenerateWorkflow()
    }, [agentDetails])

    const GenerateWorkflow = () => {
        const edgeMap = agentDetails?.edges?.reduce((acc: any, edge: any) => {
            if (!acc[edge.source]) acc[edge.source] = [];
            acc[edge.source].push(edge);
            return acc;
        }, {});

        const flow = agentDetails?.nodes?.map((node: any) => {
            const connectedEdges = edgeMap[node.id] || [];
            let next: any = null;

            if (connectedEdges.length === 1) next = connectedEdges[0].target;
            else if (connectedEdges.length > 1) next = connectedEdges.map((e: any) => e.target);

            return {
                id: node.id,
                type: node.type,
                label: node.data?.label || node.type,
                settings: node.data?.settings || {},
                next,
            };
        });

        const startNode = agentDetails?.nodes?.find((n: any) => n.type === "StartNode");

        setConfig({
            startNode: startNode?.id || null,
            flow,
        });
    }

    const GenerateAgentToolConfig = async () => {
        try {
            setLoading(true);
            const response = await axios.post('/api/generate-agent-tool-config', {
                jsonConfig: config
            });
            setLoading(false);

            await updateAgentToolConfig({
                id: agentDetails?._id as any,
                agentToolConfig: response.data,
            });

            GetAgentDetails();
        } catch (error) {
            setLoading(false);
        }
    }

    // ✅ DRAG HANDLERS
    const handleMouseDown = () => {
        isDragging.current = true;
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current) return;

        const newWidth = (e.clientX / window.innerWidth) * 100;
        if (newWidth > 20 && newWidth < 80) {
            setLeftWidth(newWidth);
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    return (
        <div className="h-screen flex flex-col">
            <Header agentDetails={agentDetails} previewOption={false} />

            {/* 🔥 FLEX SPLIT LAYOUT */}
            <div className="flex flex-1 overflow-hidden p-5">

                {/* LEFT PANEL */}
                <div
                    style={{ width: `${leftWidth}%` }}
                    className="border rounded-2xl relative overflow-hidden"
                >
                    <h2 className='absolute top-2 left-2 z-10'>Preview</h2>

                    <div className="w-full h-full">
                        <ReactFlow
                            nodes={agentDetails?.nodes || []}
                            edges={agentDetails?.edges || []}
                            fitView
                            nodeTypes={nodeTypes}
                            draggable={false}
                        >
                            <Background gap={15} size={1} />
                        </ReactFlow>
                    </div>
                </div>

                {/* 🔥 SPLITTER */}
                <div
                    onMouseDown={handleMouseDown}
                    className="w-2 flex items-center justify-center h-full rounded-full cursor-col-resize transition"
                >
                    <div className='w-1 h-[30px] rounded-full bg-gray-400' />
                </div>

                {/* RIGHT PANEL */}
                <div className="flex-1 border rounded-2xl h-full flex flex-col overflow-hidden">

                    {!agentDetails?.agentToolConfig ? (
                        <div className='flex items-center justify-center h-full'>
                            <Button onClick={GenerateAgentToolConfig} disabled={loading}>
                                <RefreshCcwIcon className={`${loading && 'animate-spin'}`} />
                                Reboot Agent
                            </Button>
                        </div>
                    ) : (
                        <ChatUI
                            GenerateAgentToolConfig={GenerateAgentToolConfig}
                            loading={loading}
                            agentDetails={agentDetails}
                        />
                    )}

                </div>
            </div>
        </div>
    )
}

export default Preview;