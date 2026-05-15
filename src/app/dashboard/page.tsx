import CreateAIAgent from './_components/CreateAIAgent'
import AiAgentTab from './_components/AiAgentTab'

function Dashboard() {
  return (
    <div className='flex flex-col items-start py-8 px-3'>
      <CreateAIAgent />
      <AiAgentTab />
    </div>
  )
}

export default Dashboard
