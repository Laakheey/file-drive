import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const fileType = v.union(
  v.literal("image"),
  v.literal("pdf"),
  v.literal("csv"),
  v.literal("video")
);

export const roles = v.union(v.literal("admin"), v.literal("member"));

export default defineSchema({
  files: defineTable({
    name: v.string(),
    type: fileType,
    orgId: v.string(),
    fileId: v.id("_storage"),
    userId: v.id('users'),
    isMarkedForDelete: v.optional(v.boolean()),
    markedForDeletedTime: v.optional(v.string())
  })
    .index("by_orgId", ["orgId"])
    .index("by_isMarkedForDelete", ["isMarkedForDelete"]),
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    orgIds: v.array(
      v.object({
        orgId: v.string(),
        role: roles,
      })
    ),
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),
  favorites: defineTable({
    fileId: v.id("files"),
    userId: v.id("users"),
    orgId: v.string(),
  }).index("by_userId_orgId_fileId", ["userId", "orgId", "fileId"]),
});
