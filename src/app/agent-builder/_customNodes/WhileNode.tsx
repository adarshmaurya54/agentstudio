import { Input } from '@/components/ui/input'
import { Handle, Position } from '@xyflow/react'
import { RefreshCcw } from 'lucide-react'
import React from 'react'

function WhileNode({ selected, data }: any) {
    return (
        <div
            className={`bg-card px-2 py-2 rounded-2xl border transition-all
        ${selected ? 'border-foreground/50 dark:border-foreground/40' : 'border-border'}
      `}
        >
            <div className='flex items-center gap-3'>
                <RefreshCcw className='p-2 w-8 h-8 rounded-lg'
                    style={{
                        backgroundColor: data?.bgColor
                    }}
                />
                <h2>{data?.label}</h2>
            </div>
            <div className='max-w-[140px] mt-3 space-y-2'>
                <Input placeholder='condition' disabled />
            </div>
            <Handle type='target' position={Position.Left} />
            <Handle type='source' position={Position.Right}/>
        </div>
    )
}

export default WhileNode
