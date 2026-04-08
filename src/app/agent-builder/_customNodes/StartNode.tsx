import { Handle, Position } from '@xyflow/react'
import { Play } from 'lucide-react'
import React from 'react'

function StartNode({selected}: any) {
  return (
     <div
      className={`bg-white pl-2 pr-3 py-2 rounded-2xl border transition-all
        ${selected ? 'border-black/50' : 'border-gray-300'}
      `}
    >
      <div className='flex items-center gap-3'>
        <Play className='p-2 w-8 h-8 bg-amber-100 rounded-lg' />
        <h2>Start</h2>
      </div>
      <Handle
        type='source'
        position={Position.Right}
        className='w-3 h-3 bg-black'
      />
    </div>
  )
}

export default StartNode
