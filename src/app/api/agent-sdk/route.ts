import { NextRequest, NextResponse } from "next/server";
import {fetchQuery} from 'convex/nextjs'
import { api } from "../../../../convex/_generated/api";

export async function POST(req: NextRequest){
    const {userId, agentId} = await req.json();

    const agentDetails = await fetchQuery(api.agent.GetAgentById, {
        agentId
    })

    console.log("agentDetails", agentDetails)
    return NextResponse.json({agent: agentDetails}, {status: 200})
}
