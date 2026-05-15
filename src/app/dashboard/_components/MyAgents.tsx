'use client'
import { UserDetailContext } from '@/context/UserDetailContext'
import { useConvex, useMutation } from 'convex/react';
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../../../../convex/_generated/api';
import { Id } from "../../../../convex/_generated/dataModel";
import { Agent } from '@/types/agentTypes';
import { Bot, PencilIcon, Search, Trash2Icon } from 'lucide-react';
import moment from 'moment';
import AgentListSkeleton from './AgentListSkeleton';
import Link from 'next/link';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';
import { Input } from '@/components/ui/input';

function MyAgents() {
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<Id<'AgentTable'> | null>(null);
  const { userDetail } = useContext(UserDetailContext);
  const [agentList, setAgentList] = useState<Agent[]>([]);
  const [mounted, setMounted] = useState(false);
  const convex = useConvex();
  const deleteAgent = useMutation(api.agent.deleteAgent);
  const updateAgentName = useMutation(api.agent.updateAgentName);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedEditAgentId, setSelectedEditAgentId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const editingAgent = useMemo(
    () => agentList.find((agent) => agent._id === editingAgentId) ?? null,
    [agentList, editingAgentId]
  );

  const filteredAgents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return agentList;

    return agentList.filter((agent) =>
      agent.name?.toLowerCase().includes(normalizedQuery)
    );
  }, [agentList, searchQuery]);

  // login to delete agent
  const handleDeleteAgent = async (id: Id<'AgentTable'>) => {
    try {
      setSelectedAgentId(id);
      await deleteAgent({ id });

      // update the UI after deletion
      setAgentList(prev => prev.filter(agent => agent._id !== id));
      toast.success("Agent deleted successfully");
    } catch (err) {
      console.error("Failed to delete agent:", err);
      toast.error("Failed to delete agent. Please try again.");
    } finally {
      setSelectedAgentId(null);
    }
  }

  const handleUpdateAgentName = async (id: Id<'AgentTable'>) => {
    const trimmedName = editingName.trim();
    if (!trimmedName) {
      toast.error("Agent name cannot be empty.");
      return;
    }

    try {
      setSelectedEditAgentId(id);
      await updateAgentName({ id, name: trimmedName });
      setAgentList((prev) =>
        prev.map((agent) => (agent._id === id ? { ...agent, name: trimmedName } : agent))
      );
      toast.success("Agent updated successfully");
      // close dialog after success
      setIsDialogOpen(false);
      setEditingName('');
    } catch (err) {
      console.error("Failed to update agent:", err);
      toast.error("Failed to update agent. Please try again.");
    } finally {
      setSelectedEditAgentId(null);
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const GetUserAgents = async () => {
      setLoading(true);

      const result = await convex.query(api.agent.GetUserAgents, {
        userId: userDetail?._id
      });

      if (isMounted) {
        setAgentList(result);
        setLoading(false);
      }
    };

    if (userDetail?._id) {
      GetUserAgents();
    }

    return () => {
      isMounted = false;
    };
  }, [convex, userDetail?._id]);
  if (agentList.length === 0 && !loading) {
    return (
      <div className='w-full h-60 mt-5 flex items-center justify-center flex-col gap-3'>
        <Bot className='h-10 w-10 text-muted-foreground' />
        <h2 className='text-muted-foreground font-semibold'>No agents created yet.</h2>
      </div>
    )
  }

  return (
    <div className='mt-5'>
      <div className='relative mb-4 w-full max-w-md'>
        <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          type='search'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder='Search agents...'
          className='pl-9 rounded-xl'
          aria-label='Search agents'
        />
      </div>
      {loading ? <AgentListSkeleton /> : (
        filteredAgents.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
            {filteredAgents.map((agent) => (
              <div className='group relative' key={agent.agentId}>
                <Link href={`/agent-builder/${agent.agentId}`} className='border h-full rounded-2xl p-2 flex items-start flex-col justify-between'>
                  <div className='space-y-3'>
                    <Bot className='bg-purple-100 p-2 h-8 w-8 rounded-md' />
                    <h2 className='text-xl font-bold'>{agent.name}</h2>
                  </div>

                  <p className='text-xs text-right w-full text-muted-foreground'>
                    {mounted ? moment(agent._creationTime).fromNow() : ''}
                  </p>
                </Link>
                <Dialog>
                  <DialogTrigger asChild>
                    <button>
                      <Trash2Icon className='bg-gray-100 hidden group-hover:flex hover:bg-gray-200 absolute top-2 right-2 p-2 h-8 w-8 rounded-md' />
                    </button>
                  </DialogTrigger>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Agent</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently delete this agent and all related data.
                      </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>

                      <Button
                        variant="destructive"
                        disabled={selectedAgentId === agent._id}
                        onClick={() => handleDeleteAgent(agent._id)}
                      >
                        {selectedAgentId === agent._id ? "Deleting..." : "Delete"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <button
                  onClick={() => {
                    setEditingAgentId(agent._id);
                    setEditingName(agent.name);
                    setIsDialogOpen(true);
                  }}
                >
                  <PencilIcon className='bg-gray-100 hidden group-hover:flex hover:bg-gray-200 absolute top-11 right-2 p-2 h-8 w-8 rounded-md' />
                </button>
                <DottedGlowBackground
                  className="pointer-events-none mask-radial-to-90% mask-radial-at-center"
                  opacity={0.5}
                  gap={9}
                  radius={1.6}
                  colorLightVar="--color-neutral-500"
                  glowColorLightVar="--color-neutral-600"
                  colorDarkVar="--color-neutral-500"
                  glowColorDarkVar="--color-sky-800"
                  backgroundOpacity={0}
                  speedMin={0.3}
                  speedMax={1.6}
                  speedScale={1}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className='w-full h-40 flex items-center justify-center flex-col gap-2'>
            <Bot className='h-8 w-8 text-muted-foreground' />
            <h2 className='text-muted-foreground font-semibold'>No agents found for &quot;{searchQuery.trim()}&quot;</h2>
          </div>
        )
      )}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingAgentId(null);
            setEditingName('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
            <DialogDescription>
              Update the agent name.
            </DialogDescription>
          </DialogHeader>

          <Input
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            placeholder='Enter agent name'
            maxLength={80}
          />

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>

            <Button
              disabled={!editingAgent || selectedEditAgentId === editingAgent._id}
              onClick={() => editingAgent && handleUpdateAgentName(editingAgent._id)}
            >
              {editingAgent && selectedEditAgentId === editingAgent._id
                ? "Saving..."
                : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MyAgents
