import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import React from "react";


const Header = () => {
  return (
    <div className="border-b py-4 bg-gray-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2 text-xl">
        <Link href={"/"} className="flex items-center gap-2">
          <Image src={'/logo2.png'} width={40} height={40} alt="logo"/>
          DataHarbor
        </Link>
        </div>
        <div className="gap-2 flex">
          <OrganizationSwitcher />
          <UserButton/>
        </div>
      </div>
    </div>
  );
};

export default Header;
