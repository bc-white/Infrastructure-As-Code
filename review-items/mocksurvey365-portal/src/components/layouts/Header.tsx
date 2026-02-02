// src/components/Header.tsx

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Constants from "@/constants";
import { useLocation } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Menu, Plus } from "lucide-react";
import { useState } from "react";
import Logo from "../Logo";
import { DropdownMenuArrow } from "@radix-ui/react-dropdown-menu";
import { useLogOut } from "@/api/services/auth";

export default function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  const logOutMutation = useLogOut();

  const handleAddOrganizationClick = () => {
    // TODO: open organization creation modal when available
  };

  const handleLogout = () => {
    logOutMutation.mutate();
  };

  return (
    <header className="h-20 w-full  rounded-2xl bg-alpha-gray-alpha-5 flex px-4 sm:px-6 lg:px-[120px] items-center justify-between mb-4">
      {/* Logo */}
      <Logo />

      {/* Desktop Navigation */}
      <nav className="hidden md:flex space-x-4 lg:space-x-6 font-medium font-brico text-base lg:text-lg">
        <a
          href="/"
          className={`rounded-[32px] py-2 px-5 ${
            location.pathname === "/"
              ? "bg-white `text-blue-800"
              : "text-sub-600"
          }`}
        >
          Home
        </a>
        <a
          href="/facility"
          className={`py-2 px-5 rounded-[32px] ${
            location.pathname === "/facility" || "/facility/:id"
              ? "bg-white `text-blue-800"
              : "text-gray-600"
          }`}
        >
          Facilities
        </a>
        <a
          href="/support"
          className={`py-2 px-5 rounded-[32px] ${
            location.pathname === "/support"
              ? "bg-white `text-blue-800"
              : "text-gray-600"
          }`}
        >
          Support
        </a>
      </nav>

      {/* Actions */}
      <div className="hidden md:flex items-center space-x-4 lg:space-x-10">
        <Button
          onClick={handleAddOrganizationClick}
          variant="secondary"
          styleType={"stroke"}
          className="border-gray-500 hidden bg-alpha-gray-alpha-5 h-10 border lg:flex items-center hover:bg-white justify-center text-gray-600 rounded-lg p-3 text-sm font-brico font-medium transition-colors"
        >
          Add New Organization <Plus className="ms-1 w-5 h-5" />
        </Button>
        <Button
          onClick={handleAddOrganizationClick}
          variant="secondary"
          styleType={"stroke"}
          className="border-gray-500 md:flex lg:hidden bg-alpha-gray-alpha-5 h-10 border flex items-center hover:bg-white justify-center text-gray-600 rounded-lg p-3 text-sm font-brico font-medium transition-colors"
        >
          Add <Plus className="ms-1 w-5 h-5" />
        </Button>
        {/* User profile Avatar */}
        <div className="flex items-center space-x-2">
          <Avatar className="cursor-pointer">
            <AvatarImage
              src={Constants.ProfileAvatar}
              className="object-cover"
              alt="User"
            />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          {/* Dropdown Menu for desktop and Tablet*/}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="cursor-pointer">
              <ChevronDown />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="font-brico text-sm hover:text-sub-600-dark"
              aria-label="User menu"
              role="menu"
            >
              <DropdownMenuItem role="menuitem">Profile</DropdownMenuItem>
              <DropdownMenuItem role="menuitem">Settings</DropdownMenuItem>
              <DropdownMenuItem role="menuitem" onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation menu toggle */}
      <div className="md:hidden flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="cursor-pointer">
            <button
              aria-label="Toggle mobile menu"
              className=""
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
            >
              <Menu className="w-6 h-6 " />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="font-brico text-sm hover:text-sub-600-dark"
          >
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>User Settings</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent sideOffset={5}>
                  <DropdownMenuItem role="menuitem">Profile</DropdownMenuItem>
                  <DropdownMenuItem role="menuitem">Settings</DropdownMenuItem>
                  <DropdownMenuItem role="menuitem" onClick={handleLogout}>Logout</DropdownMenuItem>
                  <DropdownMenuArrow />
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              {" "}
              <a
                href="/dashboard"
                className={` py-2 ${
                  location.pathname === "/dashboard"
                    ? "text-blue-800"
                    : "text-gray-600"
                }`}
              >
                Home
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem>
              {" "}
              <a
                href="/facility"
                className={`py-2 ${
                  location.pathname === "/facilities"
                    ? "text-blue-800"
                    : "text-gray-600"
                }`}
              >
                Facilities
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem>
              {" "}
              <a
                href="/support"
                className={`py-2${
                  location.pathname === "/support"
                    ? "text-blue-800"
                    : "text-gray-600"
                }`}
              >
                Support
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Button
                onClick={handleAddOrganizationClick}
                variant="secondary"
                styleType={"stroke"}
                className="border-gray-500 bg-alpha-gray-alpha-5 h-10 border flex items-center hover:bg-white justify-center text-gray-600 rounded-lg p-3 text-sm font-brico font-medium transition-colors"
              >
                Add New Organization <Plus className="ms-1 w-5 h-5" />
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </header>
  );
}
