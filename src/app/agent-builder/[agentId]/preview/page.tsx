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
import { LoaderOne } from '@/components/ui/loader';

function Preview() {
    const [config, setConfig] = useState<any>();
    const [agentDetails, setAgentDetails] = useState<Agent>();
    const [loading, setLoading] = useState(false);
    const [activeView, setActiveView] = useState<"preview" | "chat">("chat");
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
        <div className="h-screen relative flex flex-col">
            <Header agentDetails={agentDetails} previewOption={false} />
            {!agentDetails && (
                <div className="absolute top-0 right-0 w-full h-full flex justify-center items-center backdrop-blur-md z-20">
                    <LoaderOne />
                </div>
            )}
            <div className="flex flex-1 overflow-hidden p-2 sm:p-5 flex-col">

                {/* 🔥 MOBILE TOGGLE */}
                <div className="flex sm:hidden mb-2 bg-gray-100 rounded-xl p-1">
                    <button
                        onClick={() => setActiveView("preview")}
                        className={`flex-1 py-1 text-sm rounded-lg ${activeView === "preview" ? "bg-white shadow" : ""
                            }`}
                    >
                        Preview
                    </button>
                    <button
                        onClick={() => setActiveView("chat")}
                        className={`flex-1 py-1 text-sm rounded-lg ${activeView === "chat" ? "bg-white shadow" : ""
                            }`}
                    >
                        Chat
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden gap-2">

                    {/* LEFT PANEL */}
                    <div
                        style={{ width: `${leftWidth}%` }}
                        className={`
        border rounded-4xl relative overflow-hidden
        ${activeView !== "preview" ? "hidden sm:block" : "w-full!"}
        w-full sm:w-auto
      `}
                    >
                        <h2 className="absolute top-2 left-2 z-10 text-sm">Preview</h2>

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

                    {/* 🔥 SPLITTER (ONLY DESKTOP) */}
                    <div
                        onMouseDown={handleMouseDown}
                        className="hidden sm:flex w-2 items-center justify-center h-full cursor-col-resize"
                    >
                        <div className="w-1 h-[30px] rounded-full bg-gray-400" />
                    </div>

                    {/* RIGHT PANEL */}
                    <div
                        className={`
        flex-1 border rounded-4xl h-full flex flex-col overflow-hidden
        ${activeView !== "chat" ? "hidden sm:flex" : ""}
      `}
                    >
                        {!agentDetails?.agentToolConfig ? (
                            <div className="flex items-center justify-center h-full">
                                <Button onClick={GenerateAgentToolConfig} disabled={loading}>
                                    <RefreshCcwIcon className={`${loading && "animate-spin"}`} />
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
        </div>
    )
}

export default Preview;