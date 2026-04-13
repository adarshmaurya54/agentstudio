import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const SaveConversationMessage = mutation({
  args: {
    conversationId: v.string(),
    agentId: v.string(),
    userId: v.string(),
    role: v.union(v.literal("system"), v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ConversationTable", {
      conversationId: args.conversationId,
      agentId: args.agentId,
      userId: args.userId,
      role: args.role,
      content: args.content,
    });
  },
});

export const GetConversationMessages = query({
  args: {
    conversationId: v.string(),
    agentId: v.string(),
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const safeLimit = Math.max(1, Math.min(args.limit ?? 20, 100));

    const rows = await ctx.db
      .query("ConversationTable")
      .withIndex("by_conversationId_and_agentId_and_userId", (q) =>
        q
          .eq("conversationId", args.conversationId)
          .eq("agentId", args.agentId)
          .eq("userId", args.userId),
      )
      .order("desc")
      .take(safeLimit);

    return rows.reverse();
  },
});

export const DeleteConversation = mutation({
  args: {
    conversationId: v.string(),
    agentId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("ConversationTable")
      .withIndex("by_conversationId_and_agentId_and_userId", (q) =>
        q
          .eq("conversationId", args.conversationId)
          .eq("agentId", args.agentId)
          .eq("userId", args.userId)
      )
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }

    return true;
  },
});