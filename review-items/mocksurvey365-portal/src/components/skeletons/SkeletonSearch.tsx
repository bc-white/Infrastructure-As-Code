import { Skeleton } from "@/components/ui/skeleton";

export const SearchSkeleton = () => {
  return (
    <div className="hidden h-[44px] lg:block">
      <div className="relative h-full">
        <Skeleton className="h-full w-[413px] rounded-full" />
      </div>
    </div>
  );
};
