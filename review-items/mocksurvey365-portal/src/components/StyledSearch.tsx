"use client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Suspense } from "react";
import { SearchSkeleton } from "@/components/skeletons/SkeletonSearch";
import { cn } from "@/lib/utils";

export default function StyledSearch({ OnChange, className }: { OnChange: (value: string) => void, className: string }) {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <div className={cn("h-[44px] w-full rounded-full", className)}>
        <div className="relative h-full">
          <Input
            className="h-full w-full rounded-full bg-bg-soft-200 text-black placeholder:text-white "
            placeholder="Search"
            onChange={(e) => {
              OnChange(e.target.value);
            }}
          />
          <button
            className="absolute inset-y-0 end-[2px] flex h-full items-center justify-center rounded-e-lg border border-transparent text-muted-foreground/80 outline-offset-2 outline-ring/30 transition-colors hover:text-foreground focus-visible:outline-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:outline-ring/40"
            aria-label="Search"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white p-2">
              {" "}
              <Search size={20} aria-hidden="true" />
            </div>
          </button>
        </div>
      </div>
    </Suspense>
  );
}
