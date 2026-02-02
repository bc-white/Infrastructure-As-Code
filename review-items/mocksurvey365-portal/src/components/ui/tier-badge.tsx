import { CircularProgress } from './circular-progress';
import { TIER_CONFIG, type TierType } from '@/types/points';
import { cn } from '@/lib/utils';

export interface TierBadgeProps {
  tier: TierType;
  currentPoints: number;
  nextTierPoints: number;
  size?: number;
  showProgress?: boolean;
  className?: string;
}

const getTierColor = (tier: TierType): string => {
  const colors = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#9333EA',
  };
  return colors[tier];
};

const TierBadge = ({
  tier,
  currentPoints,
  nextTierPoints,
  size = 120,
  showProgress = true,
  className,
}: TierBadgeProps) => {
  const tierInfo = TIER_CONFIG[tier];
  const tierColor = getTierColor(tier);

  // Calculate progress to next tier
  const currentTierMin = tierInfo.minPoints;
  const progressInTier = currentPoints - currentTierMin;
  const tierRange = nextTierPoints === Infinity ? 0 : nextTierPoints - currentTierMin;
  const progressValue = tierRange > 0 ? progressInTier : 100;
  const progressMax = tierRange > 0 ? tierRange : 100;

  const isMaxTier = tier === 'platinum';

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {showProgress && !isMaxTier ? (
        <CircularProgress
          value={progressValue}
          max={progressMax}
          size={size}
          strokeWidth={8}
          color={tierColor}
          centerContent={
            <div className="flex flex-col items-center">
              <span className="text-4xl mb-1">{tierInfo.icon}</span>
              <span className="text-xs font-semibold text-text-strong-950">
                {tierInfo.name}
              </span>
            </div>
          }
        />
      ) : (
        <div
          className="flex flex-col items-center justify-center rounded-full border-4"
          style={{
            width: size,
            height: size,
            borderColor: tierColor,
          }}
        >
          <span className="text-4xl mb-1">{tierInfo.icon}</span>
          <span className="text-xs font-semibold text-text-strong-950">
            {tierInfo.name}
          </span>
        </div>
      )}

      {!isMaxTier && (
        <div className="mt-3 text-center">
          <p className="text-xs text-text-sub-600">
            {nextTierPoints - currentPoints} pts to{' '}
            {TIER_CONFIG[
              tier === 'bronze' ? 'silver' : tier === 'silver' ? 'gold' : 'platinum'
            ].name}
          </p>
        </div>
      )}

      {isMaxTier && (
        <div className="mt-3 text-center">
          <p className="text-xs font-semibold text-purple-600">
            Max Tier Unlocked!
          </p>
        </div>
      )}
    </div>
  );
};

export { TierBadge };
