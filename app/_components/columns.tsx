"use client";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "convex/react";
import { formatRelative } from "date-fns";
import { FileCardAction } from "./file-actions";

const formatDate = (timestamp: number) => {
  let formattedDate = formatRelative(new Date(timestamp), new Date());
  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
};

const UserCell = ({ userId }: { userId: Id<"users"> }) => {
  const userProfile = useQuery(api.files.getUserProfile, {
    userId: userId,
  });
  return (
    <>
      <div className="flex items-center gap-2">
        <Avatar className="w-8 h-8">
          <AvatarImage src={userProfile?.imageUrl} />
        </Avatar>
        <div>{userProfile?.name}</div>
      </div>
    </>
  );
};

export const columns: ColumnDef<Doc<"files"> & { isFavourited: boolean; url: string | null }>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    cell: ({ row }) => {
      return (
        <>
          <div>
            <UserCell userId={row.original.userId} />
          </div>
        </>
      );
    },
    header: "User",
  },
  {
    cell: ({ row }) => {
      return (
        <>
          <div>{`${formatDate(row.original._creationTime)}`}</div>
        </>
      );
    },
    header: "Uploaded at",
  },
  {
    cell: ({ row }) => {
      return (
        <>
          <FileCardAction file={row.original} isFavorited={row.original.isFavourited}/>
        </>
      );
    },
    header: "Actions",
  },
];
