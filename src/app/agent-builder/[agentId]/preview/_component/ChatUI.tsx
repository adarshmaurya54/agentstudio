"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCcwIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  GenerateAgentToolConfig: () => void,
  loading: boolean,
}
export default function ChatUI({ GenerateAgentToolConfig, loading }: Props) {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Welcome. This is your AI assistant." },
    { role: "user", text: "Show me a clean UI idea." },
    { role: "bot", text: "Try a minimal monochrome dashboard." },
  ]);



  return (
    <div className="h-full flex flex-col bg-white text-black rounded-2xl overflow-hidden">
      <div className="border-b border-gray-200 p-2 bg-white">
        <div className="flex gap-3 justify-between items-center">
          <h2 className="text-lg font-semibold">Agent Chat</h2>
          <Button className="rounded-xl" onClick={GenerateAgentToolConfig} disabled={loading}>
            <RefreshCcwIcon className={`${loading && 'animate-spin'}`} />
            Reboot Agent
          </Button>
        </div>
      </div>
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`
                max-w-[70%] px-4 py-3 rounded-2xl text-sm
                ${msg.role === "user"
                  ? "bg-black text-white rounded-br-sm"
                  : "bg-gray-100 border border-gray-200 rounded-bl-sm"}
              `}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Typing */}
        {loading && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-black rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.4s]"></span>
          </div>
        )}

      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-2 bg-white">
        <div className="flex gap-3">

          <Input
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-sm"
          />

          <Button
            className="px-5 py-3 rounded-xl bg-black text-white text-sm hover:bg-gray-800 transition"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}