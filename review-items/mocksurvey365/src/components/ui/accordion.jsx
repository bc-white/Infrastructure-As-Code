import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Accordion = ({ type = "single", collapsible = false, className, children, value, onValueChange }) => {
  return (
    <div className={cn("w-full", className)}>
      {children}
    </div>
  );
};

export const AccordionItem = ({ value, className, children }) => {
  return (
    <div className={cn("", className)}>
      {children}
    </div>
  );
};

export const AccordionTrigger = ({ className, children, onClick, isOpen, ...props }) => {
  return (
    <button
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
      <ChevronDown className={cn(
        "h-4 w-4 shrink-0 transition-transform duration-200",
        isOpen && "rotate-180"
      )} />
    </button>
  );
};

export const AccordionContent = ({ className, children, isOpen }) => {
  return (
    <div className={cn(
      "overflow-hidden text-sm transition-all duration-300 ease-in-out",
      isOpen ? "max-h-none opacity-100" : "max-h-0 opacity-0"
    )}>
      <div className="pb-4 pt-0">
        {children}
      </div>
    </div>
  );
}; 