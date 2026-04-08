'use client';

import { useState } from 'react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css"; // or dark theme

export default function TestAI() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        setOutput('');
        setLoading(true);

        const res = await fetch('/api/ai', {
            method: 'POST',
            body: JSON.stringify({ message: input }),
        });

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) return;

        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                setLoading(false); // 🔥 FIX HERE
                break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (let line of lines) {
                if (line.startsWith('data:')) {
                    const data = line.replace('data: ', '').trim();

                    if (data === '[DONE]') {
                        setLoading(false); // 🔥 ALSO HERE
                        return;
                    }

                    try {
                        const json = JSON.parse(data);
                        const text = json.choices?.[0]?.delta?.content;

                        if (text) {
                            setOutput((prev) => prev + text);
                        }
                    } catch { }
                }
            }
        }
    };

    return (
        <div className="p-5 space-y-4">
            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="border p-2 w-full"
            />

            <button onClick={handleSend} className="bg-black text-white px-4 py-2">
                {loading ? 'Thinking...' : 'Send'}
            </button>

            <div className="prose max-w-none border p-3 min-h-[100px]">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                        code({ inline, className, children, ...props }: any) {
                            return !inline ? (
                                <pre className="bg-black text-white p-3 rounded overflow-auto">
                                    <code className={className} {...props}>
                                        {children}
                                    </code>
                                </pre>
                            ) : (
                                <code className="bg-gray-200 px-1 rounded">
                                    {children}
                                </code>
                            );
                        },
                    }}
                >
                    {output}
                </ReactMarkdown>
            </div>
        </div>
    );
}