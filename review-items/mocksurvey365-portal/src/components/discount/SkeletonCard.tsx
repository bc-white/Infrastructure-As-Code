import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  variant?: 'default' | 'horizontal-scroll';
  className?: string;
}

const SkeletonCard = ({ variant = 'default', className }: SkeletonCardProps) => {
  return (
    <div
      className={cn(
        'flex-shrink-0',
        variant === 'horizontal-scroll' && 'w-[160px]',
        className
      )}
    >
      {/* Image Skeleton */}
      <Skeleton className="w-full aspect-square rounded-2xl mb-3" />

      {/* Title Skeleton */}
      <Skeleton className="h-3 w-3/4 mb-2" />

      {/* Merchant Skeleton */}
      <div className="flex items-center space-x-2">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
};

export default SkeletonCard;
