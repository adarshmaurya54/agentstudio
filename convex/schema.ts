import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    UserTable: defineTable({
        name: v.string(),
        email: v.string(),
        subscription: v.optional(v.string()),
        token: v.number()
    }).index("by_email", ["email"]),
    AgentTable: defineTable({
        agentId: v.string(),
        name: v.string(),
        config: v.optional(v.any()),
        nodes: v.optional(v.any()),
        edges: v.optional(v.any()),
        published: v.boolean(),
        userId: v.id("UserTable"),
        agentToolConfig: v.optional(v.any())
    }),
    ConversationTable: defineTable({
        conversationId: v.string(),
        agentId: v.string(),
        userId: v.string(),
        role: v.union(v.literal("system"), v.literal("user"), v.literal("assistant")),
        content: v.string(),
    })
        .index("by_conversationId_and_agentId_and_userId", ["conversationId", "agentId", "userId"])
        .index("by_agentId_and_userId", ["agentId", "userId"]),
    TestApiTable: defineTable({
        id: v.string(),
        name: v.string(),
        description: v.string(),
        source: v.string(),
    }).index("by_source", ["source"]),
})
