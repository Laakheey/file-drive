import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import React from "react";

const Header = () => {
  return (
    <div className="border-b py-4 bg-gray-50">
      <div className="container mx-auto flex justify-between items-center">
        FileDrive
        <div className="gap-2 flex">
          <OrganizationSwitcher />
        </div>
      </div>
    </div>
  );
};

export default Header;
