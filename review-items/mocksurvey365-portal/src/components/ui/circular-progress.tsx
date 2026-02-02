import { cn } from '@/lib/utils';

export interface CircularProgressProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  centerContent?: React.ReactNode;
  showPercentage?: boolean;
  className?: string;
}

const CircularProgress = ({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color = '#10b981', // green-500
  backgroundColor = '#f3f4f6', // gray-100
  label,
  centerContent,
  showPercentage = false,
  className,
}: CircularProgressProps) => {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {centerContent}
        {!centerContent && showPercentage && (
          <div className="text-center">
            <div className="text-2xl font-bold text-text-strong-950">
              {Math.round(percentage)}%
            </div>
            {label && (
              <div className="text-xs text-text-sub-600 mt-0.5">{label}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export { CircularProgress };
