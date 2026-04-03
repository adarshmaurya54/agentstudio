'use client'
import { UserDetailContext } from '@/context/UserDetailContext'
import { useConvex } from 'convex/react';
import React, { useContext, useEffect, useState } from 'react'
import { api } from '../../../../convex/_generated/api';
import { Agent } from '@/types/agentTypes';
import { Bot } from 'lucide-react';
import moment from 'moment';
import AgentListSkeleton from './AgentListSkeleton';
import Link from 'next/link';

function MyAgents() {
  const [loading, setLoading] = useState(false);
  const { userDetail } = useContext(UserDetailContext);
  const [agentList, setAgentList] = useState<Agent[]>([]);
  const [mounted, setMounted] = useState(false);
  const convex = useConvex();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    userDetail && GetUserAgents();
  }, [userDetail?._id]);

  const GetUserAgents = async () => {
    setLoading(true);
    const result = await convex.query(api.agent.GetUserAgents, {
      userId: userDetail?._id
    });
    setAgentList(result);
    setLoading(false)
  }

  return (
    <div className='mt-5'>
      {loading ? <AgentListSkeleton /> : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
          {agentList.map((agent) => (
            <Link href={`/agent-builder/${agent.agentId}`} className='border relative rounded-2xl p-2 flex items-start flex-col justify-between' key={agent.agentId}>
              <div>
                <Bot className='bg-purple-100 p-2 h-8 w-8 rounded-md' />
                <h2 className='text-xl font-bold'>{agent.name}</h2>
              </div>

              <p className='text-xs text-right w-full text-muted-foreground'>
                {mounted ? moment(agent._creationTime).fromNow() : ''}
              </p>

            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyAgents