'use client'
import { UserDetailContext } from '@/context/UserDetailContext'
import { useConvex, useMutation } from 'convex/react';
import React, { useContext, useEffect, useState } from 'react'
import { api } from '../../../../convex/_generated/api';
import { Id } from "../../../../convex/_generated/dataModel";
import { Agent } from '@/types/agentTypes';
import { Bot, DeleteIcon, Trash2Icon } from 'lucide-react';
import moment from 'moment';
import AgentListSkeleton from './AgentListSkeleton';
import Link from 'next/link';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function MyAgents() {
  const [loading, setLoading] = useState(true);
  const { userDetail } = useContext(UserDetailContext);
  const [agentList, setAgentList] = useState<Agent[]>([]);
  const [mounted, setMounted] = useState(false);
  const convex = useConvex();
  const deleteAgent = useMutation(api.agent.deleteAgent);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

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
  }, [userDetail?._id]);
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
      {loading ? <AgentListSkeleton /> : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
          {agentList.map((agent) => (
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyAgents