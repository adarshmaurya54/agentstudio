import { WorkflowContext } from '@/context/WorkflowContext';
import {
  Bot,
  Flag,
  GitBranch,
  RefreshCcw,
  ShieldCheck,
  Globe,
  ChevronDown
} from 'lucide-react';
import { useContext, useState } from 'react';

const AgentTools = [
  { name: 'Agent', icon: Bot, bgColor: '#E0F2FE', id: 'agent', type: 'AgentNode' },
  { name: 'End', icon: Flag, bgColor: '#FEE2E2', id: 'end', type: 'EndNode' },
  { name: 'If/Else', icon: GitBranch, bgColor: '#FEF9C3', id: 'ifElse', type: 'IfElseNode' },
  { name: 'While', icon: RefreshCcw, bgColor: '#DBEAFE', id: 'while', type: 'WhileNode' },
  { name: 'User Approval', icon: ShieldCheck, bgColor: '#EDE9FE', id: 'approval', type: 'ApprovalNode' },
  { name: 'API', icon: Globe, bgColor: '#CCFBF1', id: 'api', type: 'ApiNode' }
];

function AiAgentToolsPanel() {
  const { setAddedNodes } = useContext(WorkflowContext);
  const [isOpen, setIsOpen] = useState(true);

  const handleAgentToolClick = (tools: any) => {
    const newNode = {
      id: `${tools.id}-${Date.now()}`,
      position: { x: 0, y: 100 },
      data: {
        label: tools.name,
        bgColor: tools.bgColor,
        type: tools.type,
        id: tools.id
      },
      type: tools.type
    };

    setAddedNodes((prev: any) => [...prev, newNode]);
  };

  return (
    <div className='bg-white/20 backdrop-blur-sm p-3 rounded-3xl border'>
      
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(prev => !prev)}
      >
        <h2 className='font-semibold select-none'>AI Agent Tools</h2>

        {/* Smooth rotate */}
        <ChevronDown
          className={`transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Animated container */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen
            ? 'max-h-96 opacity-100 mt-3'
            : 'max-h-0 opacity-0'
        }`}
      >
        <div className='space-y-1'>
          {AgentTools.map((tools) => (
            <div
              key={tools.id}
              onClick={() => handleAgentToolClick(tools)}
              className='flex items-center gap-3 hover:bg-gray-300/20 cursor-pointer rounded-xl p-2 transition-all duration-200 hover:scale-[1.02]'
            >
              <tools.icon
                className="p-2 h-8 w-8 rounded-lg"
                style={{ backgroundColor: tools.bgColor }}
              />
              <h2>{tools.name}</h2>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AiAgentToolsPanel;