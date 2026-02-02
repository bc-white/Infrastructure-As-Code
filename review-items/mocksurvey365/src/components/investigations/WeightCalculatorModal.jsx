import React from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { DatePicker } from "../ui/date-picker";
import { toast } from "sonner";

const WeightCalculatorModal = ({
  isOpen,
  onClose,
  selectedResident,
  currentInvestigationId,
  investigations,
  weightCalculatorState,
  setWeightCalculatorState,
  onInsertToNotes,
}) => {
  if (!isOpen) return null;

  // Helper function to normalize dates (convert strings to Date objects)
  const normalizeDate = (date) => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof date === "string") {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Weight Calculator
            </h3>
            {selectedResident && (
              <p className="text-sm text-gray-600 mt-1">
                Resident: {selectedResident.name} (Room {selectedResident.room})
              </p>
            )}
            {currentInvestigationId && (
              <p className="text-xs text-gray-500 mt-1">
                Investigation:{" "}
                {investigations.find((inv) => inv.id === currentInvestigationId)
                  ?.careArea || "Unknown"}
              </p>
            )}
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
          >
            ✕
          </Button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Previous Weight (lbs)
              </Label>
              <Input
                type="number"
                placeholder="150"
                className="w-full"
                value={weightCalculatorState.previousWeight}
                onChange={(e) => {
                  const prevWeight = parseFloat(e.target.value) || 0;
                  const currentWeight =
                    parseFloat(weightCalculatorState.currentWeight) || 0;
                  const prevDate = normalizeDate(weightCalculatorState.previousDate);
                  const currentDate = normalizeDate(weightCalculatorState.currentDate);

                  let daysBetween = 0;
                  let monthlyProjection = 0;

                  if (prevDate && currentDate) {
                    const diffTime = Math.abs(
                      currentDate.getTime() - prevDate.getTime()
                    );
                    daysBetween = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (daysBetween > 0) {
                      const weightChange = currentWeight - prevWeight;
                      const dailyChange = weightChange / daysBetween;
                      monthlyProjection = dailyChange * 30;
                    }
                  }

                  const weightChange = currentWeight - prevWeight;
                  const weightChangePercent =
                    prevWeight > 0 ? (weightChange / prevWeight) * 100 : 0;

                  setWeightCalculatorState({
                    ...weightCalculatorState,
                    previousWeight: e.target.value,
                    weightChange,
                    weightChangePercent,
                    daysBetween,
                    monthlyProjection,
                  });
                }}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Previous Date
              </Label>
              <DatePicker
                date={normalizeDate(weightCalculatorState.previousDate)}
                onSelect={(date) => {
                  const prevWeight =
                    parseFloat(weightCalculatorState.previousWeight) || 0;
                  const currentWeight =
                    parseFloat(weightCalculatorState.currentWeight) || 0;
                  const currentDate = normalizeDate(weightCalculatorState.currentDate);

                  let daysBetween = 0;
                  let monthlyProjection = 0;

                  if (date && currentDate) {
                    const diffTime = Math.abs(
                      currentDate.getTime() - date.getTime()
                    );
                    daysBetween = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (daysBetween > 0) {
                      const weightChange = currentWeight - prevWeight;
                      const dailyChange = weightChange / daysBetween;
                      monthlyProjection = dailyChange * 30;
                    }
                  }

                  const weightChange = currentWeight - prevWeight;
                  const weightChangePercent =
                    prevWeight > 0 ? (weightChange / prevWeight) * 100 : 0;

                  setWeightCalculatorState({
                    ...weightCalculatorState,
                    previousDate: date,
                    weightChange,
                    weightChangePercent,
                    daysBetween,
                    monthlyProjection,
                  });
                }}
                placeholder="Select date"
                className="w-full"
              />
              {weightCalculatorState.previousDate && (() => {
                const normalized = normalizeDate(weightCalculatorState.previousDate);
                return normalized ? (
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-set to: {normalized.toLocaleDateString()}
                  </p>
                ) : null;
              })()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Current Weight (lbs)
              </Label>
              <Input
                type="number"
                placeholder="145"
                className="w-full"
                value={weightCalculatorState.currentWeight}
                onChange={(e) => {
                  const currentWeight = parseFloat(e.target.value) || 0;
                  const prevWeight =
                    parseFloat(weightCalculatorState.previousWeight) || 0;
                  const prevDate = normalizeDate(weightCalculatorState.previousDate);
                  const currentDate = normalizeDate(weightCalculatorState.currentDate);

                  let daysBetween = 0;
                  let monthlyProjection = 0;

                  if (prevDate && currentDate) {
                    const diffTime = Math.abs(
                      currentDate.getTime() - prevDate.getTime()
                    );
                    daysBetween = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (daysBetween > 0) {
                      const weightChange = currentWeight - prevWeight;
                      const dailyChange = weightChange / daysBetween;
                      monthlyProjection = dailyChange * 30;
                    }
                  }

                  const weightChange = currentWeight - prevWeight;
                  const weightChangePercent =
                    prevWeight > 0 ? (weightChange / prevWeight) * 100 : 0;

                  setWeightCalculatorState({
                    ...weightCalculatorState,
                    currentWeight: e.target.value,
                    weightChange,
                    weightChangePercent,
                    daysBetween,
                    monthlyProjection,
                  });
                }}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Current Date
              </Label>
              <DatePicker
                date={normalizeDate(weightCalculatorState.currentDate)}
                onSelect={(date) => {
                  const prevWeight =
                    parseFloat(weightCalculatorState.previousWeight) || 0;
                  const currentWeight =
                    parseFloat(weightCalculatorState.currentWeight) || 0;
                  let prevDate = normalizeDate(weightCalculatorState.previousDate);

                  // Auto-set Previous Date to 30 days before Current Date if not already set
                  if (!prevDate && date) {
                    prevDate = new Date(date);
                    prevDate.setDate(prevDate.getDate() - 30);
                  }

                  let daysBetween = 0;
                  let monthlyProjection = 0;

                  if (prevDate && date) {
                    const diffTime = Math.abs(
                      date.getTime() - prevDate.getTime()
                    );
                    daysBetween = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (daysBetween > 0) {
                      const weightChange = currentWeight - prevWeight;
                      const dailyChange = weightChange / daysBetween;
                      monthlyProjection = dailyChange * 30;
                    }
                  }

                  const weightChange = currentWeight - prevWeight;
                  const weightChangePercent =
                    prevWeight > 0 ? (weightChange / prevWeight) * 100 : 0;

                  setWeightCalculatorState({
                    ...weightCalculatorState,
                    currentDate: date,
                    previousDate: prevDate,
                    weightChange,
                    weightChangePercent,
                    daysBetween,
                    monthlyProjection,
                  });
                }}
                placeholder="Select date"
                className="w-full"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-center">
              <div
                className={`text-2xl font-bold ${
                  weightCalculatorState.weightChangePercent > 0
                    ? "text-green-600"
                    : weightCalculatorState.weightChangePercent < 0
                    ? "text-red-600"
                    : "text-gray-900"
                }`}
              >
                {weightCalculatorState.weightChangePercent > 0 ? "+" : ""}
                {weightCalculatorState.weightChangePercent.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Weight Change</div>
              <div className="text-xs text-gray-500 mt-1">
                {weightCalculatorState.weightChange > 0 ? "+" : ""}
                {weightCalculatorState.weightChange.toFixed(1)} lbs
              </div>
            </div>
          </div>

          {/* Date-based calculations */}
          {weightCalculatorState.daysBetween > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <h5 className="text-sm font-medium text-gray-900 mb-2 text-center">
                Time-Based Analysis
              </h5>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    {weightCalculatorState.daysBetween}
                  </div>
                  <div className="text-xs text-gray-600">Days Between</div>
                </div>
                <div>
                  <div
                    className={`text-lg font-semibold ${
                      weightCalculatorState.monthlyProjection > 0
                        ? "text-green-600"
                        : weightCalculatorState.monthlyProjection < 0
                        ? "text-red-600"
                        : "text-gray-900"
                    }`}
                  >
                    {weightCalculatorState.monthlyProjection > 0 ? "+" : ""}
                    {weightCalculatorState.monthlyProjection.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-600">
                    Monthly Projection (lbs)
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                Based on {weightCalculatorState.daysBetween} day period
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                if (!currentInvestigationId) {
                  toast.error("No investigation selected");
                  return;
                }

                if (
                  !weightCalculatorState.previousWeight ||
                  !weightCalculatorState.currentWeight ||
                  !weightCalculatorState.previousDate ||
                  !weightCalculatorState.currentDate
                ) {
                  toast.error(
                    "Please enter both weights and select both dates"
                  );
                  return;
                }

                // Add weight data to investigation notes
                const formatDate = (date) => {
                  if (!date) return "No date";
                  try {
                    const dateObj = date instanceof Date ? date : new Date(date);
                    if (isNaN(dateObj.getTime())) return "Invalid date";
                    return dateObj.toLocaleDateString();
                  } catch (error) {
                    return "Invalid date";
                  }
                };

                let weightData = `Weight Assessment: Previous: ${
                  weightCalculatorState.previousWeight
                } lbs (${formatDate(weightCalculatorState.previousDate)}), Current: ${
                  weightCalculatorState.currentWeight
                } lbs (${formatDate(weightCalculatorState.currentDate)}), Change: ${
                  weightCalculatorState.weightChangePercent > 0 ? "+" : ""
                }${weightCalculatorState.weightChangePercent.toFixed(1)}% (${
                  weightCalculatorState.weightChange > 0 ? "+" : ""
                }${weightCalculatorState.weightChange.toFixed(1)} lbs)`;

                if (weightCalculatorState.daysBetween > 0) {
                  weightData += `, Time Period: ${
                    weightCalculatorState.daysBetween
                  } days, Monthly Projection: ${
                    weightCalculatorState.monthlyProjection > 0 ? "+" : ""
                  }${weightCalculatorState.monthlyProjection.toFixed(
                    1
                  )} lbs/month`;
                }

                onInsertToNotes(weightData);
              }}
              className="flex-1 bg-gray-600 hover:bg-gray-700"
            >
              Insert into Notes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightCalculatorModal;
