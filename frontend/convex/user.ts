import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUserId(ctx);
    if (user == null) return null;
    return await ctx.db.get(user);
  },
});

/** Get the current user's profile (displayName, imageUrl). */
export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId == null) return null;
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    return profile;
  },
});

/** Update the current user's profile (displayName and/or imageUrl). */
export const updateProfile = mutation({
  args: {
    displayName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId == null) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...(args.displayName !== undefined && { displayName: args.displayName }),
        ...(args.imageUrl !== undefined && { imageUrl: args.imageUrl }),
      });
      return existing._id;
    }
    await ctx.db.insert("userProfiles", {
      userId,
      displayName: args.displayName,
      imageUrl: args.imageUrl,
    });
    return null;
  },
});