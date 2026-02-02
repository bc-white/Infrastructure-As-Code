import { useState } from 'react';
import { cn } from '@/lib/utils';

export const NavigationMenu = ({ children }) => {
  return <div className="relative">{children}</div>;
};

export const NavigationMenuList = ({ children }) => {
  return <ul className="flex items-center space-x-1">{children}</ul>;
};

export const NavigationMenuItem = ({ children }) => {
  return <li>{children}</li>;
};

export const NavigationMenuTrigger = ({ children, className, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <button
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
        className
      )}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      {...props}
    >
      {children}
    </button>
  );
};

export const NavigationMenuContent = ({ children }) => {
  return (
    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
      {children}
    </div>
  );
};

export const navigationMenuTriggerStyle = "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"; 