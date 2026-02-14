import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get or create a chat between a user and an admin.
 * userId and adminId must be the IDs from your FastAPI backend.
 */
export const getOrCreateChat = mutation({
  args: {
    userId: v.string(),
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("chats")
      .withIndex("by_userId_adminId", (q) =>
        q.eq("userId", args.userId).eq("adminId", args.adminId)
      )
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("chats", {
      userId: args.userId,
      adminId: args.adminId,
    });
  },
});

/**
 * Get the chat document for a user–admin pair (if it exists).
 * Use the same userId and adminId as returned by FastAPI.
 */
export const getChat = query({
  args: {
    userId: v.string(),
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chats")
      .withIndex("by_userId_adminId", (q) =>
        q.eq("userId", args.userId).eq("adminId", args.adminId)
      )
      .unique();
  },
});

/**
 * List messages for a chat, oldest first.
 */
export const listMessages = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();
  },
});

/**
 * Send a message in a chat.
 * senderId must be the FastAPI user id or admin id of the sender.
 * content is the HTML from Quill.
 */
export const sendMessage = mutation({
  args: {
    chatId: v.id("chats"),
    senderId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("messages", {
      chatId: args.chatId,
      senderId: args.senderId,
      content: args.content,
    });
  },
});
