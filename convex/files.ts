import { ConvexError, v } from "convex/values";
import {
  MutationCtx,
  QueryCtx,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { fileType } from "./schema";
import { Id } from "./_generated/dataModel";

export const generateUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError("You must be logged in to upload a file!");
  }

  return await ctx.storage.generateUploadUrl();
});

export const hasAccessToOrg = async (
  ctx: QueryCtx | MutationCtx,
  orgId: string
) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .first();

  if (!user) {
    return null;
  }

  const hasAccess =
    user.orgIds.some((item) => item.orgId === orgId) ||
    user.tokenIdentifier.includes(orgId);

  if (!hasAccess) {
    return null;
  }

  return {
    user,
  };
};

export const createFile = mutation({
  args: {
    name: v.string(),
    type: fileType,
    fileId: v.id("_storage"),
    orgId: v.string(),
  },
  async handler(ctx, args) {
    const hasAccess = await hasAccessToOrg(ctx, args.orgId);

    if (!hasAccess) {
      throw new ConvexError("You do not have access to this organization");
    }

    await ctx.db.insert("files", {
      name: args.name,
      type: args.type,
      orgId: args.orgId,
      fileId: args.fileId,
      userId: hasAccess.user._id,
    });
  },
});

export const getFiles = query({
  args: {
    orgId: v.string(),
    query: v.optional(v.string()),
    favorites: v.optional(v.boolean()),
    deletedOnly: v.optional(v.boolean()),
  },
  async handler(ctx, args) {
    const hasAccess = await hasAccessToOrg(ctx, args.orgId);

    if (!hasAccess) {
      return [];
    }

    let files = await ctx.db
      .query("files")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .collect();

    const query = args.query;

    if (query) {
      files = files.filter((files) =>
        files.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (args.favorites) {
      const favorites = await ctx.db
        .query("favorites")
        .withIndex("by_userId_orgId_fileId", (q) =>
          q.eq("userId", hasAccess.user._id).eq("orgId", args.orgId)
        )
        .collect();

      files = files.filter((file) =>
        favorites.some((fav) => fav.fileId === file._id)
      );
    }

    if (args.deletedOnly) {
      files = files.filter((file) => file.isMarkedForDelete);
    } else {
      files = files.filter((file) => !file.isMarkedForDelete);
    }

    return files;
  },
});

export const deleteAllFiles = internalMutation({
  args: {},
  async handler(ctx, args) {
    const files = await ctx.db
      .query("files")
      .withIndex("by_isMarkedForDelete", (q) => q.eq("isMarkedForDelete", true))
      .collect();
    await Promise.all(
      files.map(async (file) => {
        if (isTimestampOlderThan30Days(file.markedForDeletedTime)) {
          const isFavExist = await ctx.db
            .query("favorites")
            .withIndex("by_userId_orgId_fileId", (q) =>
              q
                .eq("userId", file.userId)
                .eq("orgId", file.orgId)
                .eq("fileId", file._id)
            )
            .first();

          if (isFavExist) {
            await ctx.db.delete(isFavExist._id);
          }
          await ctx.storage.delete(file.fileId);
          return await ctx.db.delete(file._id);
        }
        return null;
      })
    );
  },
});

// export const permaDeleteFile = internalMutation({
//   args: { fileId: v.id("files") },
//   async handler(ctx, args) {
//     const hasAccess = await hasAccessToFile(ctx, args.fileId);

//     if (!hasAccess) {
//       throw new ConvexError("You do not have access to this file!");
//     }

//     const isAdmin =
//       hasAccess.user.orgIds.find((org) => org.orgId === hasAccess.file.orgId)
//         ?.role === "admin";

//     if (!isAdmin) {
//       throw new ConvexError("You have no admin access to delete file");
//     }
//     const isFavExist = await ctx.db
//       .query("favorites")
//       .withIndex("by_userId_orgId_fileId", (q) =>
//         q
//           .eq("userId", hasAccess.user._id)
//           .eq("orgId", hasAccess.file.orgId)
//           .eq("fileId", hasAccess.file._id)
//       )
//       .first();

//     if (isFavExist) {
//       await ctx.db.delete(isFavExist._id);
//     }
//     await ctx.storage.delete(hasAccess.file.fileId);
//     return await ctx.db.delete(hasAccess.file._id);
//   },
// });

export const deleteFile = mutation({
  args: { fileId: v.id("files") },
  async handler(ctx, args) {
    const hasAccess = await hasAccessToFile(ctx, args.fileId);

    if (!hasAccess) {
      throw new ConvexError("You do not have access to this file!");
    }

    const isAdmin =
      hasAccess.user.orgIds.find((org) => org.orgId === hasAccess.file.orgId)
        ?.role === "admin";

    if (!isAdmin) {
      throw new ConvexError("You have no admin access to delete file");
    }

    await ctx.db.patch(args.fileId, {
      isMarkedForDelete: true,
      markedForDeletedTime: new Date().getTime().toString(),
    });
  },
});

export const toggleFavorite = mutation({
  args: { fileId: v.id("files") },
  async handler(ctx, args) {
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new ConvexError("This file does not exist!");
    }

    const hasAccess = await hasAccessToOrg(ctx, file.orgId);

    if (!hasAccess) {
      throw new ConvexError("You do not have access to delete this file!");
    }

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId_orgId_fileId", (q) =>
        q
          .eq("userId", hasAccess.user._id)
          .eq("orgId", file.orgId)
          .eq("fileId", file._id)
      )
      .first();

    if (!favorites) {
      await ctx.db.insert("favorites", {
        fileId: file._id,
        orgId: file.orgId,
        userId: hasAccess.user._id,
      });
    } else {
      await ctx.db.delete(favorites._id);
    }
  },
});

export const getAllFavorite = query({
  args: { orgId: v.string() },
  async handler(ctx, args) {
    const hasAccess = await hasAccessToOrg(ctx, args.orgId);

    if (!hasAccess) {
      return [];
    }

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_userId_orgId_fileId", (q) =>
        q.eq("userId", hasAccess.user._id).eq("orgId", args.orgId)
      )
      .collect();

    return favorites;
  },
});

const hasAccessToFile = async (
  ctx: QueryCtx | MutationCtx,
  fileId: Id<"files">
) => {
  const file = await ctx.db.get(fileId);
  if (!file) {
    return null;
  }

  const hasAccess = await hasAccessToOrg(ctx, file.orgId);

  if (!hasAccess) {
    return null;
  }
  return {
    user: hasAccess.user,
    file,
  };
};

export const restoreFile = mutation({
  args: { fileId: v.id("files") },
  async handler(ctx, args) {
    const hasAccess = await hasAccessToFile(ctx, args.fileId);

    if (!hasAccess) {
      throw new ConvexError("You do not have access to this file!");
    }

    const isAdmin =
      hasAccess.user.orgIds.find((org) => org.orgId === hasAccess.file.orgId)
        ?.role === "admin";

    if (!isAdmin) {
      throw new ConvexError("You have no admin access to delete file");
    }

    await ctx.db.patch(args.fileId, {
      isMarkedForDelete: false,
    });
  },
});

export const getUserProfile = query({
  args: { userId: v.id("users") },
  async handler(ctx, args) {
    const user = await ctx.db.get(args.userId);
    return {
      name: user?.name,
      imageUrl: user?.imageUrl,
    };
  },
});

function isTimestampOlderThan30Days(timestamp: string | undefined) {
  if (!timestamp) {
    return false;
  }
  console.log("isTimestampOlderThan30Days", timestamp);
  const currentTimestamp = Date.now();
  const differenceInMilliseconds = currentTimestamp - parseInt(timestamp);
  const millisecondsInOneDay = 1000 * 60 * 60 * 24;
  const differenceInDays = differenceInMilliseconds / millisecondsInOneDay;
  return differenceInDays >= 30;
}
