"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Agent } from "@/types/agentTypes";
import { RefreshCcwIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  GenerateAgentToolConfig: () => void;
  loading: boolean;
  agentDetails: Agent;
};

export default function ChatUI({
  GenerateAgentToolConfig,
  loading,
  agentDetails,
}: Props) {
  const [messages, setMessages] = useState<any[]>([
    { role: "bot", text: "Welcome. This is your AI assistant." },
  ]);

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 🔥 create conversationId (once)
  useEffect(() => {
    const init = async () => {
      const res = await fetch("/api/agent-chat", { method: "GET" });
      const data = await res.json();
      setConversationId(data.conversationId);
    };
    init();
  }, []);

  // 🔥 auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = { role: "user", text: input };

    setMessages((prev) => [...prev, userMessage, { role: "bot", text: "" }]);

    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/agent-chat", {
        method: "POST",
        body: JSON.stringify({
          input,
          tools: agentDetails?.agentToolConfig?.tools || [],
          agents: agentDetails?.agentToolConfig?.agents || [],
          agentName:
            agentDetails?.agentToolConfig?.primaryAgentName ||
            agentDetails?.name,
          conversationId,
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader!.read();
        done = doneReading;

        const chunk = decoder.decode(value || new Uint8Array());

        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];

          // Prevent duplicate chunk append
          if (!lastMsg.text.endsWith(chunk)) {
            lastMsg.text += chunk;
          }

          return updated;
        });
      }
    } catch (err) {
      console.error(err);
    }

    setIsStreaming(false);
  };

  return (
    <div className="h-full flex flex-col bg-white text-black rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="border-b border-gray-200 p-2 bg-white">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {agentDetails?.name || "Agent"}
          </h2>
          <Button
            className="rounded-xl text-xs"
            onClick={GenerateAgentToolConfig}
            disabled={loading}
          >
            <RefreshCcwIcon
              className={`${loading && "animate-spin"} w-3 h-3`}
            />
            Reboot
          </Button>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
              }`}
          >
            <div
              className={`
                max-w-[70%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap
                ${msg.role === "user"
                  ? "bg-black text-white rounded-br-sm"
                  : "bg-gray-100 border border-gray-200 rounded-bl-sm"
                }
              `}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.text}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {/* typing indicator */}
        {isStreaming && (
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-black rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.4s]"></span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-2 bg-white">
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-sm"
          />

          <Button
            onClick={sendMessage}
            disabled={isStreaming}
            className="px-5 py-3 rounded-xl bg-black text-white text-sm hover:bg-gray-800 transition"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}