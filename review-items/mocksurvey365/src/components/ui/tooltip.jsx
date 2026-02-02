import { useState } from 'react';
import { cn } from '@/lib/utils';

export const TooltipProvider = ({ children }) => {
  return <>{children}</>;
};

export const Tooltip = ({ children }) => {
  return <>{children}</>;
};

export const TooltipTrigger = ({ asChild, children, ...props }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  if (asChild) {
    return (
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        {...props}
      >
        {children}
      </div>
    );
  }
  
  return (
    <div
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      {...props}
    >
      {children}
    </div>
  );
};

export const TooltipContent = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        "absolute z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}; 