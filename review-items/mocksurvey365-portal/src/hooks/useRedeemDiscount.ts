import { useState } from 'react';
import type { Discount } from '@/types/discount';

export const useRedeemDiscount = (discount: Discount) => {
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleRedeem = () => {
    setIsRedeeming(true);
    // TODO: Implement redemption flow
    // - Check if user has redeemed before
    // - Check redemption limits
    // - Generate QR code
    // - Show redemption modal/page

    setTimeout(() => {
      setIsRedeeming(false);
      alert('Redemption flow coming soon!');
    }, 1000);
  };

  // Check if discount is still valid
  const isExpired = new Date(discount.endDate) < new Date();
  const hasReachedLimit =
    discount.maxRedemptions &&
    discount.totalRedemptions &&
    discount.totalRedemptions >= discount.maxRedemptions;

  const isDisabled = isExpired || hasReachedLimit || isRedeeming;

  // Calculate days remaining
  const getDaysRemaining = () => {
    const endDate = new Date(discount.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  return {
    isRedeeming,
    isExpired,
    hasReachedLimit,
    isDisabled,
    daysRemaining,
    handleRedeem,
  };
};
