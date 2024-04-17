import { ConvexError, v } from "convex/values";
import { MutationCtx, QueryCtx, mutation, query } from "./_generated/server";
import { getUser } from "./users";
import { fileType } from "./schema";

export const generateUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError("You must be logged in to upload a file!");
  };

  return await ctx.storage.generateUploadUrl();
});

export const hasAccessToOrg = async (
  tokenIdentifier: string,
  ctx: QueryCtx | MutationCtx,
  orgId: string
) => {
  const user = await getUser(ctx, tokenIdentifier);

  const hasAccess =
    user.orgIds.includes(orgId) || user.tokenIdentifier.includes(orgId);

  return hasAccess;
};

export const createFile = mutation({
  args: {
    name: v.string(),
    type: fileType,
    fileId: v.id('_storage'),
    orgId: v.string(),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new ConvexError("You must be logged in to upload a file!");
    }

    const hasAccess = hasAccessToOrg(identity.tokenIdentifier, ctx, args.orgId);

    if (!hasAccess) {
      throw new ConvexError("You do not have access to this organization");
    }

    await ctx.db.insert("files", {
      name: args.name,
      type: args.type,
      orgId: args.orgId,
      fileId: args.fileId
    });
  },
});

export const getFiles = query({
  args: {
    orgId: v.string(),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const hasAccess = hasAccessToOrg(identity.tokenIdentifier, ctx, args.orgId);

    if (!hasAccess) {
      return [];
    }

    return ctx.db
      .query("files")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();
  },
});

export const deleteFile = mutation({
  args: { fileId: v.id("files") },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError("You must be logged in to upload a file!");
    }

    const file = await ctx.db.get(args.fileId);
    if(!file){
      throw new ConvexError("This file does not exist!");
    };

    const hasAccess = hasAccessToOrg(identity.tokenIdentifier, ctx, file.orgId);

    if (!hasAccess) {
      throw new ConvexError("You do not have access to delete this file!");
    }

    await ctx.db.delete(args.fileId);
  }
})
