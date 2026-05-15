import CreateAIAgent from './_components/CreateAIAgent'
import AiAgentTab from './_components/AiAgentTab'

function Dashboard() {
  return (
    <div className="bg-sidebar px-3 md:py-0 py-3 h-[93%] overflow-y-auto">
      <div className='flex overflow-auto flex-col border items-start md:px-10 px-3 md:py-5 py-10 rounded-4xl bg-white'>
        <CreateAIAgent />
        <AiAgentTab />
      </div>
    </div>
  )
}

export default Dashboard
