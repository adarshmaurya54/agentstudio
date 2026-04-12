import { WorkflowContext } from '@/context/WorkflowContext'
import React, { useContext } from 'react'
import AgentSetting from '../_nodeSettings/AgentSetting';
import EndSetting from '../_nodeSettings/EndSetting';
import IfElseSetting from '../_nodeSettings/IfElseSetting';
import WhileSetting from '../_nodeSettings/WhileSetting';
import UserApprovalSetting from '../_nodeSettings/UserApprovalSetting';
import ApiSettings from '../_nodeSettings/APISetting';

function SettingPanel() {
    const { selectedNode, setAddedNodes } = useContext(WorkflowContext);
    const onUpdateNodeSettingData = (formData: any) => {
        const updateNode = {
            ...selectedNode,
            data: {
                ...selectedNode.data,
                label: formData.name?.trim()
                    ? formData.name
                    : selectedNode.data.label,
                settings: formData
            }
        }
        setAddedNodes((prevNode: any) =>
            prevNode.map((node: any) => node.id === selectedNode.id ? updateNode : node)
        )

    }
    if(!selectedNode) return null;
    return (
        <div className="rounded-3xl border bg-white/20 backdrop-blur-sm overflow-hidden md:w-[290px]">
            <div className="max-h-[80vh] overflow-y-auto custom-scrollbar p-3 space-y-5">
                {selectedNode?.type === 'AgentNode' && <AgentSetting key={selectedNode.id} selectedNode={selectedNode} updateNodeSettingData={(value: any) => onUpdateNodeSettingData(value)} />}
                {selectedNode?.type === 'EndNode' && <EndSetting selectedNode={selectedNode} updateNodeSettingData={(value: any) => onUpdateNodeSettingData(value)} />}
                {selectedNode?.type === 'IfElseNode' && <IfElseSetting selectedNode={selectedNode} updateNodeSettingData={(value: any) => onUpdateNodeSettingData(value)} />}
                {selectedNode?.type === 'WhileNode' && <WhileSetting selectedNode={selectedNode} updateNodeSettingData={(value: any) => onUpdateNodeSettingData(value)} />}
                {selectedNode?.type === 'ApprovalNode' && <UserApprovalSetting selectedNode={selectedNode} updateNodeSettingData={(value: any) => onUpdateNodeSettingData(value)} />}
                {selectedNode?.type === 'ApiNode' && <ApiSettings selectedNode={selectedNode} updateNodeSettingData={(value: any) => onUpdateNodeSettingData(value)} />}
            </div>
        </div>
    )
}

export default SettingPanel
