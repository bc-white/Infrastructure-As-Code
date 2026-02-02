import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  bgColor?: string;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  variant?: 'default' | 'gradient' | 'striped';
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ProgressBar = ({
  value,
  max,
  color = 'bg-primary-base',
  bgColor = 'bg-bg-weak-100',
  showLabel = false,
  label,
  animated = true,
  variant = 'default',
  height = 'md',
  className,
}: ProgressBarProps) => {
  const percentage = Math.min((value / max) * 100, 100);

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const getVariantClasses = () => {
    if (variant === 'gradient') {
      return 'bg-gradient-to-r from-primary-base to-primary-dark';
    }
    if (variant === 'striped') {
      return `${color} bg-stripes`;
    }
    return color;
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-text-sub-600">
            {label}
          </span>
          <span className="text-xs font-semibold text-text-strong-950">
            {value}/{max}
          </span>
        </div>
      )}
      <div
        className={cn(
          'w-full rounded-full overflow-hidden',
          bgColor,
          heightClasses[height]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full',
            getVariantClasses(),
            animated && 'transition-all duration-500 ease-out'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export { ProgressBar };
