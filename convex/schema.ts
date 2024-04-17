import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const fileType = v.union(v.literal("image"), v.literal("pdf"), v.literal("csv"), v.literal("video"));

export default defineSchema({
  files: defineTable({
    name: v.string(),
    type: fileType,
    orgId: v.string(),
    fileId: v.id("_storage"),
  }).index("by_orgId", ["orgId"]),
  users: defineTable({
    tokenIdentifier: v.string(),
    orgIds: v.array(v.string()),
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),
});
