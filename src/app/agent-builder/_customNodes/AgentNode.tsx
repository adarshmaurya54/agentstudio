import { Handle, Position } from '@xyflow/react'
import { Bot } from 'lucide-react'
import React from 'react'

function AgentNode({ selected, data }: any) {
  return (
    <div
      className={`bg-white pl-2 pr-3 py-2 rounded-2xl border transition-all
        ${selected ? 'border-black/50' : 'border-gray-300'}
      `}
    >
      <div className='flex items-center gap-3'>
        <Bot className='p-2 w-8 h-8 rounded-lg'
          style={{ backgroundColor: data?.bgColor }}
        />
        <div>
          <h2>{data?.label}</h2>
          {data?.label?.trim().toLowerCase() !== 'agent' && <h3 className='text-xs text-muted-foreground'>Agent</h3>}
        </div>
      </div>
      <Handle type='target' position={Position.Left} className='w-3 h-3' />
      <Handle type='source' position={Position.Right} className='w-3 h-3' />
    </div>
  )
}

export default AgentNode
