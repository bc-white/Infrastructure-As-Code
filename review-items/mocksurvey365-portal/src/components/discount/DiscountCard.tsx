import type { Discount } from "@/types/discount";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Building } from "lucide-react";
import { Link } from "react-router-dom";
import { USER_ROUTES } from "@/lib/constants/routes";
import { getCategoryColor } from "@/lib/constants/categories";
import { cn } from "@/lib/utils";
import { useSavedStore } from "@/store/savedStore";
import { toast } from "sonner";

interface DiscountCardProps {
  discount: Discount;
  className?: string;
}

const DiscountCard = ({ discount, className }: DiscountCardProps) => {
  const { isSaved: checkIsSaved, toggleSaved } = useSavedStore();
  const isSaved = checkIsSaved(discount.id);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    toggleSaved(discount.id);
    toast.success(isSaved ? "Removed from saved" : "Saved for later");
  };

  const getDiscountBadge = () => {
    switch (discount.type) {
      case "percentage":
        return `${discount.value}% OFF`;
      case "fixed":
        return `GHS ${discount.value} OFF`;
      case "bogo":
        return "BOGO";
      case "freebie":
        return "FREE";
      default:
        return "DISCOUNT";
    }
  };

  return (
    <Link to={USER_ROUTES.DISCOUNT_DETAIL(discount.id)}>
      <Card
        className={cn(
          "overflow-hidden transition-all duration-300 group bg-transparent border-none w-[45vw] md:w-[20vw] lg:w-[200px]  flex-shrink-0",
          className
        )}
      >
        {/* Image Section */}
        <div className="relative aspect-square overflow-hidden rounded-2xl hover:shadow-lg">
          {discount.images && discount.images.length > 0 ? (
            <img
              src={discount.images[0]}
              alt={discount.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <span className="text-4xl">
                {getCategoryIcon(discount.category)}
              </span>
            </div>
          )}

          {/* Discount Badge */}
          <div className="absolute top-2 left-2">
            <Badge className="bg-primary-base text-white font-brico px-2 py-0.5 text-xs shadow-lg">
              {getDiscountBadge()}
            </Badge>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-md"
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5 transition-colors",
                isSaved ? "fill-red-500 text-red-500" : "text-gray-600"
              )}
            />
          </button>

          {/* Category Badge */}
          <div className="absolute bottom-2 left-2">
            <Badge
              variant="secondary"
              className={cn(
                "text-xs font-medium capitalize px-2 py-0.5",
                getCategoryColor(discount.category)
              )}
            >
              {discount.category}
            </Badge>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3">
          {/* Title */}
          <h3 className="text-text-strong-950 text-xs font-medium mb-2 line-clamp-2">
            {discount.title}
          </h3>

          {/* Merchant */}
          <div className="flex items-center space-x-2">
            {discount.merchantLogo ? (
              <img
                src={discount.merchantLogo}
                alt={discount.merchantName}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                <Building className="w-3 h-3 text-gray-500" />
              </div>
            )}
            <span className="text-xs text-text-sub-600 truncate">
              {discount.merchantName}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};

// Helper function to get category emoji icon
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    food: "🍔",
    transportation: "🚗",
    entertainment: "🎬",
    health: "💊",
    education: "📚",
    shopping: "🛍️",
    services: "💼",
  };

  return icons[category] || "🏷️";
}

export default DiscountCard;
