import { Handle, Position } from '@xyflow/react'
import { Flag } from 'lucide-react'
import React from 'react'

function EndNode({ selected, data }: any) {
    return (
        <div
            className={`bg-card pl-2 pr-3 py-2 rounded-2xl border transition-all
        ${selected ? 'border-foreground/50 dark:border-foreground/40' : 'border-border'}
      `}
        ><div className='flex items-center gap-3'>
                <Flag className='p-2 w-8 h-8 rounded-lg'
                    style={{
                        backgroundColor: data.bgColor
                    }}
                />
                <h2>{data?.label}</h2>
            </div>
            <Handle type='target' position={Position.Left} className='w-3 h-3' />
        </div>
    )
}

export default EndNode
