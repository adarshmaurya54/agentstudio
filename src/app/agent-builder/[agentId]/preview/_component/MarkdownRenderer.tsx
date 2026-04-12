'use client';

import React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";

import "katex/dist/katex.min.css";

type MarkdownRendererProps = {
    content?: string;
    className?: string;
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
    content,
    className = "",
}) => {
    if (!content) return null;

    const components: Components = {
        p: ({ children }) => (
            <p className="mb-1 leading-6 last:mb-0">{children}</p>
        ),

        ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-1 space-y-0.5">{children}</ol>
        ),

        ul: ({ children }) => (
            <ul className="list-disc pl-5 my-1 space-y-0.5">{children}</ul>
        ),

        li: ({ children }) => (
            <li className="leading-6">{children}</li>
        ),

        h1: ({ children }) => (
            <h1 className="text-base font-semibold my-2">{children}</h1>
        ),

        h2: ({ children }) => (
            <h2 className="text-sm font-semibold my-2">{children}</h2>
        ),

        h3: ({ children }) => (
            <h3 className="text-sm font-semibold my-1">{children}</h3>
        ),

        strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
        ),

        // ✅ Properly typed code block
        code: ({
            inline,
            className,
            children,
            ...props
        }: {
            inline?: boolean;
            className?: string;
            children?: React.ReactNode;
        }) => {
            if (!inline) {
                return (
                    <pre className="bg-black text-white p-3 rounded-lg overflow-x-auto my-2 text-sm">
                        <code className={className} {...props}>
                            {children}
                        </code>
                    </pre>
                );
            }

            return (
                <code className="bg-black/10 px-1 py-0.5 rounded text-sm">
                    {children}
                </code>
            );
        },

        table: ({ children }) => (
            <div className="my-2 w-full overflow-x-auto rounded-lg border border-gray-300">
                <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                    {children}
                </table>
            </div>
        ),

        thead: ({ children }) => (
            <thead className="bg-gray-200/70">{children}</thead>
        ),

        tbody: ({ children }) => <tbody>{children}</tbody>,

        tr: ({ children }) => (
            <tr className="border-t border-gray-300">{children}</tr>
        ),

        th: ({ children }) => (
            <th className="px-3 py-2 font-semibold text-black whitespace-nowrap">
                {children}
            </th>
        ),

        td: ({ children }) => (
            <td className="px-3 py-2 align-top leading-6">{children}</td>
        ),
    };

    return (
        <div className={`prose max-w-none ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
                components={components}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;