'use client'

import { Button } from '@/components/ui/button';
import { UserDetailContext } from '@/context/UserDetailContext';
import { AGENT_TEMPLATES } from '@/lib/agentTemplates';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { useAuth } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { Bot, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useContext, useState } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

function Templates() {
  const { userDetail } = useContext(UserDetailContext);
  const createAgentMutation = useMutation(api.agent.CreateAgent);
  const updateAgentDetails = useMutation(api.agent.updateAgentDetail);
  const router = useRouter();
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
  const { has } = useAuth();
  const isPaidUser = has && has({ plan: 'unlimited_plan' });

  const applyTemplate = async (templateId: string) => {
    const template = AGENT_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;

    if (!isPaidUser && userDetail && userDetail.remainingCredits <= 0) {
      toast.error('You have reached the limit of agent creation. Please upgrade to create more agents.');
      return;
    }

    if (!userDetail?._id) {
      toast.error('User details are not ready yet. Please try again.');
      return;
    }

    setCreatingTemplateId(template.id);

    try {
      const agentId = uuidv4();
      const createdAgentDocId = await createAgentMutation({
        agentId,
        name: template.suggestedAgentName,
        userId: userDetail._id,
      });

      await updateAgentDetails({
        id: createdAgentDocId as Id<'AgentTable'>,
        nodes: structuredClone(template.nodes),
        edges: structuredClone(template.edges),
      });

      toast.success(`${template.name} template created.`);
      router.push(`/agent-builder/${agentId}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create agent from template.');
    } finally {
      setCreatingTemplateId(null);
    }
  };

  return (
    <div className='mt-5'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
        {AGENT_TEMPLATES.map((template) => (
          <div key={template.id} className='border rounded-2xl p-4 bg-card flex flex-col justify-between gap-5'>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Sparkles className='bg-purple-100 p-2 h-8 w-8 rounded-md' />
                <span className='text-xs text-muted-foreground'>{template.category}</span>
              </div>
              <h2 className='text-xl font-bold'>{template.name}</h2>
              <p className='text-sm text-muted-foreground'>{template.description}</p>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-xs text-muted-foreground flex items-center gap-1'>
                <Bot className='h-3 w-3' />
                {template.nodes.length} nodes
              </span>
              <Button
                onClick={() => applyTemplate(template.id)}
                disabled={creatingTemplateId === template.id}
                className='rounded-xl'
              >
                {creatingTemplateId === template.id ? 'Creating...' : 'Use Template'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Templates;
