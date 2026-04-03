import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const CreateNewUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // efficient query using index
    const user = await ctx.db
      .query("UserTable")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      const userId = await ctx.db.insert("UserTable", {
        name: args.name,
        email: args.email,
        token: 5000,
      });

      return await ctx.db.get(userId);
    }

    return user;
  },
});