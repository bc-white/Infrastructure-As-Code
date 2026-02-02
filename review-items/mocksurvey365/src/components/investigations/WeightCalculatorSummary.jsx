import React from "react";

/**
 * Reusable component for displaying Weight Calculator Summary
 * @param {Object} props
 * @param {Object} props.weightData - Weight calculator data object
 * @param {Function} props.onEdit - Callback function when edit button is clicked
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.title - Custom title for the summary card
 * @param {boolean} props.showEditButton - Whether to show the edit button
 */
const WeightCalculatorSummary = ({
  weightData,
  onEdit,
  className = "",
  title = "Weight Calculator Summary",
  showEditButton = true,
}) => {
  // Don't render if no weight data or no weights entered
  if (
    !weightData ||
    (!weightData.currentWeight && !weightData.previousWeight)
  ) {
    return null;
  }

  const formatDate = (date) => {
    if (!date) return null;
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return null;
      return dateObj.toLocaleDateString();
    } catch (error) {
      return null;
    }
  };

  const getWeightChangeColor = (percent) => {
    if (percent > 0) return "text-green-600";
    if (percent < 0) return "text-red-600";
    return "text-gray-900";
  };

  const getProjectionColor = (projection) => {
    if (projection > 0) return "text-green-600";
    if (projection < 0) return "text-red-600";
    return "text-gray-900";
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 mb-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {showEditButton && onEdit && (
          <button
            onClick={onEdit}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Edit
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Previous Weight
            </label>
            <p className="text-sm text-gray-900 mt-1">
              {weightData.previousWeight || "N/A"} lbs
              {weightData.previousDate && formatDate(weightData.previousDate) && (
                <span className="text-gray-500 ml-2">
                  ({formatDate(weightData.previousDate)})
                </span>
              )}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Current Weight
            </label>
            <p className="text-sm text-gray-900 mt-1">
              {weightData.currentWeight || "N/A"} lbs
              {weightData.currentDate && formatDate(weightData.currentDate) && (
                <span className="text-gray-500 ml-2">
                  ({formatDate(weightData.currentDate)})
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Weight Change
            </label>
            <p
              className={`text-sm font-semibold mt-1 ${getWeightChangeColor(
                weightData.weightChangePercent || 0
              )}`}
            >
              {weightData.weightChangePercent > 0 ? "+" : ""}
              {weightData.weightChangePercent?.toFixed(1) || "0.0"}%
              {weightData.weightChange !== undefined && (
                <span className="text-gray-600 ml-2 font-normal">
                  ({weightData.weightChange > 0 ? "+" : ""}
                  {weightData.weightChange?.toFixed(1) || "0.0"} lbs)
                </span>
              )}
            </p>
          </div>
          {weightData.daysBetween > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Monthly Projection
              </label>
              <p
                className={`text-sm font-semibold mt-1 ${getProjectionColor(
                  weightData.monthlyProjection || 0
                )}`}
              >
                {weightData.monthlyProjection > 0 ? "+" : ""}
                {weightData.monthlyProjection?.toFixed(1) || "0.0"} lbs/month
                <span className="text-gray-500 text-xs font-normal ml-2">
                  ({weightData.daysBetween} days)
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeightCalculatorSummary;
