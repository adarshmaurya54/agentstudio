"use client"

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Agent } from '@/types/agentTypes'
import { Check, ChevronLeft, Code2, Copy, Play } from 'lucide-react'
import Link from 'next/link'
import React, { useMemo, useState } from 'react'

type props = {
    agentDetails: Agent | undefined,
    previewOption: boolean
}

function Header({ agentDetails, previewOption = true }: props) {
    const [copied, setCopied] = useState(false);
    const sdkCode = useMemo(() => `const res = await fetch('http://localhost:3000/api/agent-sdk', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: '<your-user-id>',
    agentId: '${agentDetails?.agentId || '<your-agent-id>'}',
    input: '<user-message>'
  })
});

if (!res.body) return;

const reader = res.body.getReader();
const decoder = new TextDecoder();
let done = false;
let fullText = '';

while (!done) {
  const { value, done: doneReading } = await reader.read();
  done = doneReading;
  const chunk = decoder.decode(value || new Uint8Array());
  fullText += chunk;
  console.log(chunk); // stream token/chunk
}

console.log('Final response:', fullText);
`, [agentDetails?.agentId]);

    const copyCode = async () => {
        await navigator.clipboard.writeText(sdkCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    return (
        <div className={`${!previewOption && 'w-full flex items-center justify-between px-5'
            }`
        }>
            <Link
                href={`${previewOption
                    ? '/dashboard'
                    : '/agent-builder/' + agentDetails?.agentId
                    }`}
                className={`flex ${previewOption
                    ? 'fixed top-3 left-3 z-20'
                    : 'relative'
                    } cursor-pointer items-center py-2 pl-1 pr-4`}
            >
                <ChevronLeft className='w-6 h-6' />
                <h2 className='text-lg'>{agentDetails?.name}</h2>
            </Link>

            <div
                className={`flex ${previewOption
                    ? 'fixed top-3 right-3 z-20'
                    : 'relative justify-end'
                    } items-center gap-4 py-2 pl-3 pr-2`}
            >

                {previewOption && (
                    <Link href={`/agent-builder/${agentDetails?.agentId}/preview`}>
                        <Play className="w-5 h-5" />
                    </Link>
                )}

                <Dialog>
                    <DialogTrigger asChild>
                        <Button className='cursor-pointer rounded-full'>
                            Publish
                        </Button>
                    </DialogTrigger>
                    <DialogContent style={{maxWidth: '100vw'}} className='w-[80%] rounded-2xl p-4 sm:p-6'>
                        <DialogHeader>
                            <DialogTitle>Get Code</DialogTitle>
                        </DialogHeader>
                        <div className='border rounded-2xl overflow-hidden'>
                            <div className='flex items-center justify-between px-3 py-2 border-b bg-muted/40'>
                                <h3 className='text-sm font-medium'>agent-sdk-integration.js</h3>
                                <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={copyCode}
                                    className='gap-2'
                                >
                                    {copied ? <Check className='w-4 h-4' /> : <Copy className='w-4 h-4' />}
                                    {copied ? 'Copied' : 'Copy'}
                                </Button>
                            </div>
                            <pre className='text-xs sm:text-sm p-3 sm:p-4 overflow-auto max-h-[65vh] bg-slate-50 dark:bg-slate-800'>
                                <code>{sdkCode}</code>
                            </pre>
                        </div>
                        <p className='text-xs text-muted-foreground'>
                            Send only <code>userId</code>, <code>agentId</code>, and <code>input</code>. Conversation tracking is handled server-side in <code>/api/agent-sdk</code>.
                        </p>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}

export default Header
