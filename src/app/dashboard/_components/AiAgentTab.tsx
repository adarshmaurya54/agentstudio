'use client'
import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MyAgents from './MyAgents'
import Templates from './Templates'
function AiAgentTab() {
    const [tab, setTab] = useState("myagents");
    return (
        <div className='md:px-0 w-full px-10  mt-14'>
            <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                    <TabsTrigger value="myagents">My Agents</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                </TabsList>
                <TabsContent value="myagents"><MyAgents /></TabsContent>
                <TabsContent value="templates"><Templates /></TabsContent>
            </Tabs>
        </div>
    )
}

export default AiAgentTab
