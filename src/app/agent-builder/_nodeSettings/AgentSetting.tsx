import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { FileJson } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

function AgentSetting({ selectedNode, updateNodeSettingData }: any) {
    const [agentSettings, setAgentSettings] = useState({
        name: '',
        instructions: '',
        includeHistory: true,
        model: 'gemini-flash-1.2',
        output: 'text',
        schema: ''
    });
    const handleSettings = (key: string, value: any) => {
        setAgentSettings((prev) => ({ ...prev, [key]: value }));
    }
    const onSave = async () => {
        updateNodeSettingData(agentSettings);
    }

    useEffect(() => {
        if (selectedNode?.data.settings)
            selectedNode && setAgentSettings(selectedNode?.data?.settings)
    }, [])
    return (
        <div className='p-1 space-y-3'>
            <h2 className='font-bold'>My Agent</h2>
            <p className='text-sm text-muted-foreground'>Call the AI model with your instructions and tools</p>
            <div className='space-y-2'>
                <Label>Name</Label>
                <Input className='rounded-xl' placeholder='Agent Name' value={agentSettings.name} onChange={(e) => handleSettings('name', e.target.value)} />
            </div>
            <div className='space-y-2'>
                <Label>Instructions</Label>
                <Textarea className='rounded-xl' placeholder='Instructions' value={agentSettings.instructions} onChange={(e) => handleSettings('instructions', e.target.value)} />
                <h2 className='text-xs p-1 flex items-center gap-2'>Add context <FileJson className='w-3 h-3' /></h2>
            </div>
            <div className='space-y-2 flex items-center justify-between'>
                <Label>Add Chat History</Label>
                <Switch checked={agentSettings.includeHistory} onCheckedChange={(checked) => handleSettings('includeHistory', checked)} />
            </div>
            <div className='flex items-center justify-between mt-4'>
                <Label>Model</Label>
                <Select value={agentSettings.model} onValueChange={(value) => handleSettings('model', value)}>
                    <SelectTrigger className='rounded-xl'>
                        <SelectValue placeholder="gemini-flash-1.2"></SelectValue>
                    </SelectTrigger>
                    <SelectContent className='rounded-xl'>
                        <SelectItem value='gemini-flash-1.5'>Gemini Flash 1.5</SelectItem>
                        <SelectItem value='gemini-pro-1.2'>Gemini Pro 1.2</SelectItem>
                        <SelectItem value='gemini-pro-2.0'>Gemini Pro 2.0</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Tabs value={agentSettings.output} defaultValue="text" onValueChange={(value) => handleSettings('output', value)}>
                <div className='flex justify-between'>
                    <Label>Output Format</Label>
                    <TabsList className='p-1'>
                        <TabsTrigger value="text" className='text-xs'>Text</TabsTrigger>
                        <TabsTrigger value="json" className='text-xs'>JSON</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="text">
                    <h2 className='text-muted-foreground'>Output will be text.</h2>
                </TabsContent>
                <TabsContent className='space-y-2' value="json">
                    <Label >Enter json format</Label>
                    <Textarea value={agentSettings.schema} className='rounded-xl' placeholder='{key: value}' onChange={(e) => handleSettings("schema", e.target.value)} />
                </TabsContent>
            </Tabs>
            <div>
                <Button
                disabled={(JSON.stringify(selectedNode.data.settings) === JSON.stringify(agentSettings))}
                onClick={() => onSave()} className='w-full cursor-pointer rounded-xl'>Save</Button>
            </div>
        </div>
    )
}

export default AgentSetting
