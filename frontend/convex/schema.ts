import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

/**
 * Schema: Convex Auth tables + chat/messages.
 * userId and adminId in chats are external IDs from the FastAPI backend.
 */
export default defineSchema({
  ...authTables,
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

  /** User profiles: display name and avatar (keyed by auth user id) */
  userProfiles: defineTable({
    userId: v.string(),
    displayName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }).index("by_userId", ["userId"]),
});
