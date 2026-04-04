import { Button } from '@/components/ui/button'
import { Agent } from '@/types/agentTypes'
import { ChevronLeft, Code2, Play } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type props = {
    agentDetails: Agent|undefined
}

function Header({agentDetails}: props) {
    return (
        <>
            <Link href='/dashboard' className='flex fixed top-3 left-3 z-20 cursor-pointer items-center border backdrop-blur-sm py-2 pl-1 pr-4 rounded-full'>
                <ChevronLeft className='w-8 h-8' />
                <h2 className='text-lg'>{agentDetails?.name}</h2>
            </Link>
            <div className='flex fixed top-3 right-3 z-20 items-center gap-4 border backdrop-blur-sm py-2 pl-3 pr-2 rounded-full'>
                <Code2 className="w-5 h-5 cursor-pointer" />
                <Play className="w-5 h-5 cursor-pointer" />
                <Button className='cursor-pointer rounded-full'>Publish</Button>
            </div>
        </>
    )
}

export default Header
