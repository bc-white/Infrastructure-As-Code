// Example usage of HeaderNavigation component

import HeaderNavigation from "@/components/HeaderNavigation";
import { useState } from "react";

// Example 1: Custom navigation items for different pages
export const CustomHeaderExample = () => {
  const [activeNavItem, setActiveNavItem] = useState('Dashboard');
  
  const customNavigationItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'reports', label: 'Reports' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <HeaderNavigation
      navigationItems={customNavigationItems}
      activeNavItem={activeNavItem}
      onNavItemClick={(item: { id: string; label: string }) => setActiveNavItem(item.label)}
    />
  );
};

// Example 2: Header without user dropdown (for public pages)
export const PublicHeaderExample = () => {
  const publicNavigationItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <HeaderNavigation
      navigationItems={publicNavigationItems}
      showUserDropdown={false}
      showLogo={true}
    />
  );
};

// Example 3: Header with custom styling
export const StyledHeaderExample = () => {
  return (
    <HeaderNavigation
      navigationItems={[]}
      showUserDropdown={true}
      showLogo={true}
      className="border-b-2 border-blue-500"
    />
  );
};
