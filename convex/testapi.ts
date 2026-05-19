import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const saveTestRecord = mutation({
  args: {
    id: v.string(),
    name: v.string(),
    description: v.string(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("TestApiTable", {
      id: args.id,
      name: args.name,
      description: args.description,
      source: args.source ?? "public-api",
    });
  },
});

export const listTestRecords = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const safeLimit = Math.max(1, Math.min(args.limit ?? 20, 100));

    const rows = await ctx.db
      .query("TestApiTable")
      .withIndex("by_source", (q) => q.eq("source", "public-api"))
      .order("desc")
      .take(safeLimit);

    return rows;
  },
});
