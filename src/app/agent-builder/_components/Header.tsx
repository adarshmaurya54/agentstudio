import { Button } from '@/components/ui/button'
import { Agent } from '@/types/agentTypes'
import { ChevronLeft, Code2, Play } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type props = {
    agentDetails: Agent | undefined,
    previewOption: boolean
}

function Header({ agentDetails, previewOption = true }: props) {
    return (
        <div className = {`${!previewOption && 'w-full flex items-center justify-between px-5'
        }`
}>
            <Link
                href={`${previewOption
                        ? '/dashboard'
                        : '/agent-builder/' + agentDetails?.agentId
                    }`}
                className={`flex ${previewOption
                        ? 'fixed top-3 left-3 z-20 border'
                        : 'relative'
                    } cursor-pointer items-center backdrop-blur-sm py-2 pl-1 pr-4 rounded-full`}
            >
                <ChevronLeft className='w-8 h-8' />
                <h2 className='text-lg'>{agentDetails?.name}</h2>
            </Link>

            <div
                className={`flex ${previewOption
                        ? 'fixed top-3 border right-3 z-20'
                        : 'relative justify-end'
                    } items-center gap-4 backdrop-blur-sm py-2 pl-3 pr-2 rounded-full`}
            >
                <Code2 className="w-5 h-5 cursor-pointer" />

                {previewOption && (
                    <Link href={`/agent-builder/${agentDetails?.agentId}/preview`}>
                        <Play className="w-5 h-5" />
                    </Link>
                )}

                <Button className='cursor-pointer rounded-full'>
                    Publish
                </Button>
            </div>
        </div>
    )
}

export default Header
