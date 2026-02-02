"use client";

import { useContext, useState } from "react";
import { tokens } from "@/styles/theme";
import { ThemeContext } from "@/components/Heading";
import { Outlet, useNavigate } from "react-router-dom";
import HeaderNavigation from "../HeaderNavigation";
// Reuse the resolveToken utility from Heading
function resolveToken(token: string): string {
  if (!token.startsWith("{")) return token;
  const path = token.replace(/[{}]/g, "").split(".");
  let value: any = tokens;
  for (const key of path) {
    if (value[key] === undefined && tokens.Alias && tokens.Alias[key]) {
      value = tokens.Alias[key];
      continue;
    }
    if (value[key] === undefined && tokens.Brand && tokens.Brand[key]) {
      value = tokens.Brand[key];
      continue;
    }
    value = value[key];
    if (!value) return token;
  }
  if (typeof value === "string" && value.startsWith("{")) {
    return resolveToken(value);
  }
  return value;
}

export default function Layout({ showHeader = true }: { showHeader?: boolean }) {
  const theme = useContext(ThemeContext);
  const navigate = useNavigate();
  const surfaceToken =
    theme === "dark"
      ? tokens.Dark.Surface.Primary
      : tokens.Light.Surface.Primary;
  const bgColor = resolveToken(surfaceToken);

  const navigationItems = [
    { id: "overview", label: "Overview", url: "/dashboard" },
    { id: "accounts", label: "Accounts", url: "/dashboard/accounts" },
    {
      id: "resources",
      label: "Resources",
      url: "/dashboard/resources",
    },
    {
      id: "critical-elements",
      label: "Critical Elements",
      url: "/dashboard/critical-elements", 
    },
    {
      id: "setups",
      label: "Setups",
      submenu: [
        {
          id: "mandatory-tasks",
          label: "Mandatory Tasks",
          url: "/dashboard/mandatory-tasks",
        },
        // {
        //   id: "facility-entrance-initial-assessments",
        //   label: "Initial Assessments",
        //   url: "/dashboard/facility-entrance-initial-assessments",
        // },
        {
          id: "ftag-setup",
          label: "FTAG Setup",
          url: "/dashboard/ftag-setup",
        },
        {
          id: "subscriptions",
          label: "Subscriptions",
          url: "/dashboard/subscriptions",
        },
      ],
    },
    {
      id: "account-management",
      label: "Account",
      url: "/dashboard/account-management",
    },
  ];

  const [activeNavItem, setActiveNavItem] = useState("Overview");
  const handleNavItemClick = (item: {
    id: string;
    label: string;
    url?: string;
  }) => {
    setActiveNavItem(item.label);
    if (item.url) {
      navigate(item.url);
    }
  };
  return (
    <main
      className="min-h-screen font-brico w-full"
      style={{ background: bgColor }}
    >
      <main className="w-full">
        {showHeader && (
          <HeaderNavigation
            navigationItems={navigationItems}
            activeNavItem={activeNavItem}
            onNavItemClick={handleNavItemClick}
            showLogo={true}
            showUserDropdown={true}
          />
        )}
        <Outlet />
      </main>
    </main>
  );
}
