import React from 'react'
import MyAgents from '../_components/MyAgents'

function Agents() {
  return (
    <div className='bg-sidebar px-3 md:pb-0 pb-3 h-[90%]'>
        <div className="px-3 h-full bg-white rounded-4xl p-6 border">
        <h2 className='font-bold text-xl'>AI Agents</h2>
        <MyAgents />
      </div>
    </div>
  )
}

export default Agents 
