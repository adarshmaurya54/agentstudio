'use client'
import { Button } from '@/components/ui/button'
import {
    DialogTrigger,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useMutation } from 'convex/react'
import { Loader2, Plus } from 'lucide-react'
import React, { useContext, useState } from 'react'
import { v4 as uuidv4 } from 'uuid';
import { api } from '../../../../convex/_generated/api'
import { useRouter } from 'next/navigation'
import { UserDetailContext } from '@/context/UserDetailContext'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'

function CreateAIAgent() {
    const [openDialog, setOpenDialog] = useState(false);
    const [agentName, setAgentName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const createAgentMutation = useMutation(api.agent.CreateAgent);
    const router = useRouter();
    const { userDetail, setUserDetail } = useContext(UserDetailContext);
    const { has } = useAuth();
    const isPaidUser = has && has({ plan: 'unlimited_plan' });
    console.log(userDetail);
    const CreateAgent = async () => {
        if (!isPaidUser && userDetail && userDetail.remainingCredits <= 0) {
            toast.error("You have reached the limit of agent creation. Please upgrade to create more agents.");
            return;
        }

        if (isLoading || agentName.trim() === '') return;
        setIsLoading(true);
        const agentId = uuidv4(); // Generate unique agent id
        const result = await createAgentMutation({
            agentId,
            name: agentName.trim() ?? "",
            userId: userDetail?._id
        })
        console.log(result)
        setOpenDialog(false);
        setIsLoading(false);
        // navigate to the agent builder screen
        router.push(`/agent-builder/${agentId}`)
    }
    return (
        <div className='flex items-center w-full flex-col justify-center'>
            <div className='flex md:max-w-xl gap-3 items-center justify-center flex-col'>
                <h1 className='font-bold text-2xl'>Create AI Agent</h1>
                <p className='text-center'>Build and customize your own AI-powered agent to automate tasks, answer queries, and improve productivity.</p>
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogTrigger asChild>
                        <Button size={'lg'} onClick={() => setOpenDialog(true)} className='cursor-pointer rounded-xl'><Plus /> Create</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader className='space-y-5'>
                            <DialogTitle>Enter agent name</DialogTitle>
                            <DialogDescription>
                                <Input placeholder='Agent names' onChange={(e) => setAgentName(e.target.value)} />
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                onClick={() => CreateAgent()}
                                disabled={isLoading || agentName.trim() === ''}
                                className={`${isLoading || agentName.trim() === '' ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                                    }`}
                            >
                                {isLoading ? "Creating..." : "Create Agent"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}

export default CreateAIAgent
