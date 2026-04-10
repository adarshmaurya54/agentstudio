"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Agent } from "@/types/agentTypes";
import { ArrowUpToLine, RefreshCcwIcon } from "lucide-react";
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
  const chatRef = useRef<HTMLDivElement | null>(null);

  const normalizeMessageText = (text: string) =>
    text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  // 🔥 create conversationId (once)
  useEffect(() => {
    const init = async () => {
      const res = await fetch("/api/agent-chat", { method: "GET" });
      const data = await res.json();
      setConversationId(data.conversationId);
    };
    init();
  }, []);

  // auto scroll to bottom on new message
  useEffect(() => {
    if (!chatRef.current) return;

    chatRef.current.scrollTop = chatRef.current.scrollHeight;
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
          systemPrompt: agentDetails?.agentToolConfig?.systemPrompt || "",
          workflowRules: agentDetails?.agentToolConfig?.workflowRules || [],
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

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  return (
    <div className="h-full flex flex-col bg-white text-black rounded-2xl overflow-hidden">
      {/* Chat */}
      <div
        ref={chatRef}
        className="flex-1 relative overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 border-gray-200 p-2 bg-linear-to-t from-transparent via-white/90 to-white">
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
        <div className="py-4 min-h-[78%] space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex px-4 flex-col ${msg.role === "user" ? "justify-end" : "justify-start"
                }`}
            >

              <div
                className={`
                px-4 py-3 rounded-2xl text-sm break-words
                ${msg.role === "user"
                    ? "ml-auto max-w-[78%] bg-gray-300 text-black rounded-br-sm"
                    : "max-w-[95%]  border-gray-200 rounded-bl-sm"
                  }
              `}
              >
                {msg.text || (isStreaming && i === messages.length - 1) ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p className="mb-1 leading-6 last:mb-0">{children}</p>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-5 my-1 space-y-0.5">{children}</ol>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-5 my-1 space-y-0.5">{children}</ul>
                    ),
                    li: ({ children }) => <li className="leading-6">{children}</li>,
                    h1: ({ children }) => <h1 className="text-base font-semibold my-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-sm font-semibold my-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold my-1">{children}</h3>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    code: ({ children }) => (
                      <code className="bg-black/10 px-1 py-0.5 rounded">{children}</code>
                    ),
                    table: ({ children }) => (
                      <div className="my-2 w-full overflow-x-auto rounded-lg border border-gray-300">
                        <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-gray-200/70">{children}</thead>,
                    tbody: ({ children }) => <tbody>{children}</tbody>,
                    tr: ({ children }) => <tr className="border-t border-gray-300">{children}</tr>,
                    th: ({ children }) => (
                      <th className="px-3 py-2 font-semibold text-black whitespace-nowrap">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3 py-2 align-top leading-6">{children}</td>
                    ),
                  }}
                >
                  {normalizeMessageText(msg.text)}
                </ReactMarkdown>) : null}

                {isStreaming && i === messages.length - 1 && !msg.text && (
                  <div className="flex gap-1 mt-1">
                    <span className="w-2 h-2 bg-black rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                )}
              </div>
            </div>
          ))}

        </div>

        {/* Input */}
        <div className="sticky bottom-0 border-gray-200 p-2 bg-linear-to-t from-white via-white/30 to-transparent">
          <div className="w-full max-w-2xl mx-auto">
            <div className="relative p-[2px] gap-2 bg-white border border-gray-300 rounded-4xl p-">
              <Textarea
                value={input}
                disabled={isStreaming}
                onChange={(e) => {
                  handleInput(e);
                  setInput(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type your message..."
                rows={1}
                className="
                flex-1
                resize-none
                border-none
                pl-4
                w-[93%]
                shadow-none
                focus-visible:ring-0
                bg-transparent
                text-sm
                leading-5
                max-h-32
                overflow-y-auto
              "
              />

              <button
                onClick={sendMessage}
                disabled={isStreaming || !input.trim()}
                className="w-8 h-8 absolute bottom-1 right-1 flex items-center justify-center rounded-full bg-black text-white shrink-0"
              >
                ↑
              </button>

            </div>
          </div>
        </div>
        <div ref={bottomRef} />
      </div>

    </div>
  );
}
