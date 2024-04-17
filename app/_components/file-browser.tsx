"use client";
import { api } from "@/convex/_generated/api";
import { useOrganization, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import SideNav from "../SideNav";
import SearchBar from "./SearchBar";
import UploadButton from "./upload-button";
import FileCard from "./file-card";

const PlaceholderState = () => {
  return (
    <div className="flex flex-col gap-4 items-center mt-12">
      <Image alt="Empty image" width={200} height={200} src={"/empty.svg"} />
      <div className="text-2xl">You have no files...</div>
      <UploadButton />
    </div>
  );
};

export default function FileBrowser({title, favorites}: {title: string, favorites?: boolean }) {
  const organization = useOrganization();
  const user = useUser();
  const [query, setQuery] = useState("");

  let orgId: string | undefined = undefined;
  if (organization.isLoaded && user.isLoaded) {
    orgId = organization.organization?.id ?? user.user?.id;
  }

  const files = useQuery(api.files.getFiles, orgId ? { orgId, query, favorites } : "skip");
  const isLoading = files === undefined;

  return (
    <main className="container mx-auto pt-8">
      <div className="flex lg:gap-8 gap-3">
        <SideNav/>
        <div className="w-full">
          <div className="flex gap-1 justify-between items-center mb-8">
            <h1 className={`font-bold lg:text-4xl ${title === 'Favorites' ? 'text-xl' : 'text-2xl'}`}>{title}</h1>
            <SearchBar query={query} setQuery={setQuery} />
            <UploadButton />
          </div>
          {isLoading && (
            <div className="flex flex-col gap-8 items-center mt-12 text-gray-600">
              <Loader2 className="h-32 w-32 animate-spin" />
              Loading...
            </div>
          )}

          {!isLoading && (
            <>
              {files.length === 0 && <PlaceholderState />}

              <div className="grid lg:grid-cols-3 gap-4 md:grid-cols-2 grid-cols-1">
                {files?.map((file) => {
                  return <FileCard key={file._id} file={file} />;
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
