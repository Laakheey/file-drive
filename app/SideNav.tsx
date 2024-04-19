"use client";

import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { FilesIcon, StarIcon, Trash } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const SideNav = () => {
  const pathName = usePathname();
  return (
    <div className="w-32 flex flex-col gap-4">
      <Link href={"/"}>
        <Button
          variant={"link"}
          className={clsx("flex gap-2", {
            "text-blue-400": pathName === "/",
          })}
        >
          <FilesIcon />
          All files
        </Button>
      </Link>
      <Link href={"/dashboard/favorites"}>
        <Button
          variant={"link"}
          className={clsx("flex gap-2", {
            "text-blue-400": pathName.includes("/dashboard/favorites"),
          })}
        >
          <StarIcon />
          Favorites
        </Button>
      </Link>

      <Link href={"/dashboard/trash"}>
        <Button
          variant={"link"}
          className={clsx("flex gap-2", {
            "text-blue-400": pathName.includes("/dashboard/trash"),
          })}
        >
          <Trash />
          Trash
        </Button>
      </Link>
    </div>
  );
};

export default SideNav;
