import { Handle, Position } from '@xyflow/react'
import { Globe } from 'lucide-react'
import React from 'react'

function ApiNode({ selected, data }: any) {
    return (
        <div
            className={`bg-card pl-2 pr-3 py-2 rounded-2xl border transition-all
        ${selected ? 'border-foreground/50 dark:border-foreground/40' : 'border-border'}
      `}
        >
            <div className='flex items-center gap-3'>
                <Globe className='p-2 w-8 h-8 rounded-lg'
                    style={{ backgroundColor: data?.bgColor }}
                />
                <div>
                    <h2>{data?.label}</h2>
                    {data?.label?.trim().toLowerCase() !== 'api' && <h3 className='text-xs text-muted-foreground'>API</h3>}
                </div>
            </div>
            <Handle type='target' position={Position.Left} className='w-3 h-3' />
            <Handle type='source' position={Position.Right} className='w-3 h-3' />
        </div>
    )
}

export default ApiNode
