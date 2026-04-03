import CreateAIAgent from './_components/CreateAIAgent'
import AiAgentTab from './_components/AiAgentTab'

function Dashboard() {
  return (
    <div className='flex flex-col items-start px-10 md:py-18 py-10'>
        <CreateAIAgent/>
        <AiAgentTab/>
    </div>
  )
}

export default Dashboard
