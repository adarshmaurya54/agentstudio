import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const CreateAgent = mutation({
    args: {
        name: v.string(),
        agentId: v.string(),
        userId: v.id('UserTable')
    },
    handler: async (ctx, args) => {
        const result = await ctx.db.insert("AgentTable", {
            name: args.name,
            agentId: args.agentId,
            published: false,
            userId: args.userId
        })
        return result;
    }
})

export const GetUserAgents = query({
    args: {
        userId: v.id("UserTable")
    },
    handler: async (ctx, args) => {
        const result = await ctx.db.query("AgentTable")
            .filter(q => q.eq(q.field('userId'), args.userId))
            .order("desc")
            .collect()
        return result;
    }
})

export const GetAgentById = query({
    args: {
        agentId: v.string(),
    },
    handler: async(ctx, args) => {
        const result = await ctx.db.query("AgentTable")
            .filter(q => q.eq(q.field('agentId'), args.agentId))
            .collect()
        return result[0];
    }
})

export const updateAgentDetail = mutation({
    args: {
        id: v.id('AgentTable'),
        nodes: v.any(),
        edges: v.any()
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            edges: args.edges,
            nodes: args.nodes
        })
    }
}) 