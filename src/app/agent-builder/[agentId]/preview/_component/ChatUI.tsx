"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Agent } from "@/types/agentTypes";
import { ArrowUpToLine, RefreshCcwIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import "katex/dist/katex.min.css";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";


type Props = {
  GenerateAgentToolConfig: () => void;
  loading: boolean;
  agentDetails: Agent;
};

type UiMessage = {
  role: "user" | "bot";
  text: string;
};

type StoredMessage = {
  role: "assistant" | "user" | "system";
  content: string;
};

export default function ChatUI({
  GenerateAgentToolConfig,
  loading,
  agentDetails,
}: Props) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);
  const deleteConversation = useMutation(api.conversation.DeleteConversation); // to delete conversation when rebooting agent for a fresh start in preview
  const normalizeMessageText = (text: string) =>
    text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  const getWelcomeMessage = (): UiMessage => ({
    role: "bot",
    text: "",
  });

  useEffect(() => {
    const init = async () => {
      if (!agentDetails?.agentId || !agentDetails?.userId) return;

      setIsLoadingHistory(true); // START LOADING

      try {
        const searchParams = new URLSearchParams({
          agentId: agentDetails.agentId,
          userId: String(agentDetails.userId),
          preview: "1",
        });

        const res = await fetch(`/api/agent-chat?${searchParams.toString()}`);
        const data = await res.json();

        const history: UiMessage[] = Array.isArray(data?.messages)
          ? (data.messages as StoredMessage[])
            .filter(
              (msg) =>
                (msg.role === "assistant" || msg.role === "user") &&
                typeof msg.content === "string"
            )
            .map((msg) => ({
              role: msg.role === "assistant" ? "bot" : "user",
              text: msg.content,
            }))
          : [];

        setConversationId(data.conversationId);
        setMessages(history.length > 0 ? history : [getWelcomeMessage()]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingHistory(false); // STOP LOADING
      }
    };

    init();
  }, [agentDetails?.agentId, agentDetails?.userId]);

  useEffect(() => {
    if (!chatRef.current) return;

    chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming || !conversationId) return;

    const messageInput = input.trim();
    const userMessage: UiMessage = { role: "user", text: messageInput };

    setMessages((prev) => [...prev, userMessage, { role: "bot", text: "" }]);

    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/agent-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: messageInput,
          tools: agentDetails?.agentToolConfig?.tools || [],
          agents: agentDetails?.agentToolConfig?.agents || [],
          systemPrompt: agentDetails?.agentToolConfig?.systemPrompt || "",
          workflowRules: agentDetails?.agentToolConfig?.workflowRules || [],
          agentName:
            agentDetails?.agentToolConfig?.primaryAgentName ||
            agentDetails?.name,
          agentId: agentDetails?.agentId,
          userId: String(agentDetails?.userId || ""),
          conversationId,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "bot",
            text: errorText || "Something went wrong. Please try again.",
          };
          return updated;
        });
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        const fallbackText = await res.text();
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "bot",
            text: fallbackText || "No response received.",
          };
          return updated;
        });
        return;
      }

      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        const chunk = decoder.decode(value || new Uint8Array(), {
          stream: !doneReading,
        });

        setMessages((prev) => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];

          if (!lastMsg.text.endsWith(chunk)) {
            lastMsg.text += chunk;
          }

          return updated;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "bot",
          text: "Unable to reach the chat service right now. Please try again.",
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  return (
    <div className="h-full flex flex-col bg-white text-black rounded-none sm:rounded-3xl overflow-hidden">
      <div ref={chatRef} className="flex-1 relative overflow-y-auto custom-scrollbar overflow-x-hidden">
        <div className="sticky top-0 border-gray-200 p-2 bg-linear-to-t from-transparent via-white/90 to-white">
          <div className="flex justify-between pl-3 items-center">
            <h2 className="text-lg font-semibold">{agentDetails?.name || "Agent"}</h2>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="rounded-xl text-xs" disabled={loading}>
                  <RefreshCcwIcon className={`${loading && "animate-spin"} w-3 h-3`} />
                  Reboot
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all conversation history for this agent.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>

                  <AlertDialogAction
                    onClick={async () => {
                      if (!conversationId) return;

                      await deleteConversation({
                        conversationId,
                        agentId: agentDetails.agentId,
                        userId: String(agentDetails.userId),
                      });

                      // reset UI
                      setMessages([getWelcomeMessage()]);
                      GenerateAgentToolConfig();
                    }}
                  >
                    Yes, delete everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <div className="py-4 min-h-[78%] space-y-3 sm:px-4 overflow-x-hidden">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-[60vh]">
              <span className="w-8 h-8 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex px-2 flex-col ${msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`
                text-sm break-words min-w-0 overflow-hidden
                ${msg.role === "user"
                      ? "ml-auto rounded-2xl px-4 py-3 max-w-[85%] sm:max-w-[70%] bg-[#e6dbff] text-black rounded-br-sm"
                      : "max-w-[95%] sm:max-w-[85%] border-gray-200 rounded-bl-sm"
                    }
              `}
                >
                  {msg.text || (isStreaming && i === messages.length - 1) ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex, rehypeHighlight]}
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
                        h1: ({ children }) => (
                          <h1 className="text-base font-semibold my-2">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-sm font-semibold my-2">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-sm font-semibold my-1">{children}</h3>
                        ),
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        pre: ({ children }) => (
                          <pre className="my-2 max-w-full overflow-x-hidden! custom-scrollbar rounded-xl border text-zinc-100">
                            {children}
                          </pre>
                        ),
                        code: ({ children, className }) => {
                          const isInline = !className;
                          if (isInline) {
                            return (
                              <code className="bg-black/10 overflow-x-auto custom-scrollbar px-1 py-0.5 rounded break-words">
                                {children}
                              </code>
                            );
                          }
                          return <code className={className}>{children}</code>;
                        },
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
                    </ReactMarkdown>
                  ) : null}

                  {isStreaming && i === messages.length - 1 && !msg.text && (
                    <div className="flex gap-1 mt-1">
                      <span className="w-2 h-2 bg-black rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="sticky bottom-0 border-gray-200 p-2 bg-linear-to-t from-white via-white/30 to-transparent">
          <div className="w-full max-w-2xl mx-auto">
            <div className="relative p-[2px] gap-2 bg-white border border-gray-300 rounded-4xl">
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
                className="flex-1 resize-none border-none px-4 pr-10 w-full shadow-none focus-visible:ring-0 bg-transparent text-sm leading-5 max-h-32 overflow-y-auto"
              />

              <Button
                onClick={sendMessage}
                disabled={isStreaming || !input.trim() || !conversationId}
                className="absolute right-1 bottom-1 w-8 h-8 flex items-center justify-center rounded-full text-white shrink-0"
              >
                <ArrowUpToLine className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
