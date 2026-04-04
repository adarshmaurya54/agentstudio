import { Handle, Position } from '@xyflow/react'
import { Bot } from 'lucide-react'
import React from 'react'

function AgentNode() {
  return (
    <div className='bg-white border pl-2 pr-3 py-2 rounded-2xl'>
      <div className='flex items-center gap-3'>
        <Bot className='p-2 w-8 h-8 bg-green-100 rounded-lg'/>
        <h2>Agent</h2>
      </div>
      <Handle type='target' position={Position.Left} className='w-3 h-3' />
      <Handle type='source' position={Position.Right} className='w-3 h-3' />
    </div>
  )
}

export default AgentNode
