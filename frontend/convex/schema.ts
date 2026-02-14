import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Chat schema for user–admin messaging.
 * userId and adminId are external IDs from the FastAPI backend.
 */
export default defineSchema({
  /** Chats: one per user–admin conversation */
  chats: defineTable({
    /** User ID from FastAPI backend */
    userId: v.string(),
    /** Admin ID from FastAPI backend */
    adminId: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_adminId", ["adminId"])
    .index("by_userId_adminId", ["userId", "adminId"]),

  /** Messages within a chat (content is Quill HTML) */
  messages: defineTable({
    /** Convex chat document ID */
    chatId: v.id("chats"),
    /** Sender ID from FastAPI (userId or adminId) */
    senderId: v.string(),
    /** Message body (HTML from Quill) */
    content: v.string(),
  }).index("by_chatId", ["chatId"]),
});
