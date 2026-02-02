import React from "react";
import { cn } from "@/lib/utils";

interface SeparatorProps {
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export const Separator: React.FC<SeparatorProps> = ({ 
  className, 
  orientation = "horizontal" 
}) => {
  return (
    <div
      className={cn(
        "bg-sidebar-border",
        orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
        className
      )}
    />
  );
}; 