import React from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { toast } from "sonner";

const DRAWING_TOOL_COLORS = [
  "#EF4444",
  "#F59E0B",
  "#8B5CF6",
  "#3B82F6",
  "#10B981",
  "#000000",
  "#FFFFFF",
];

const BodyMapModal = ({
  isOpen,
  onClose,
  selectedResident,
  currentInvestigationId,
  investigations,
  drawingToolState,
  setDrawingToolState,
  handleClearCanvas,
  handleBodyMapClick,
  handleAddObservation,
  handleRemoveObservation,
  handleObservationClick,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Body Map Drawing Tool
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
          <div className="flex items-center space-x-2">
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
            >
              Save & Close
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="h-6 w-6 p-0"
            >
              ✕
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Body Map Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Body Map</h4>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleClearCanvas}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={() => {
                      if (drawingToolState.observations.length > 0) {
                        const updatedObservations =
                          drawingToolState.observations.slice(0, -1);
                        setDrawingToolState((prev) => ({
                          ...prev,
                          observations: updatedObservations,
                        }));
                        toast.success("Last action undone");
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    disabled={drawingToolState.observations.length === 0}
                  >
                    Undo
                  </Button>
                </div>
              </div>

              {/* Selected Body Part Indicator */}
              {drawingToolState.currentObservation.location && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                  <strong>Selected:</strong>{" "}
                  {drawingToolState.currentObservation.location}
                </div>
              )}

              {/* Body Map SVG */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[500px] flex items-center justify-center relative">
                <svg
                  width="300"
                  height="600"
                  viewBox="0 0 300 600"
                  className="border border-gray-300 rounded"
                >
                  {/* Head */}
                  <circle
                    cx="150"
                    cy="50"
                    r="30"
                    fill="none"
                    stroke={
                      drawingToolState.currentObservation.location === "Head"
                        ? "#3B82F6"
                        : "#9CA3AF"
                    }
                    strokeWidth={
                      drawingToolState.currentObservation.location === "Head"
                        ? "3"
                        : "2"
                    }
                    className="cursor-pointer hover:stroke-gray-600 hover:stroke-2"
                    onClick={() => handleBodyMapClick(150, 50, "Head")}
                  />

                  {/* Torso */}
                  <rect
                    x="100"
                    y="80"
                    width="100"
                    height="200"
                    fill="none"
                    stroke={
                      drawingToolState.currentObservation.location === "Torso"
                        ? "#3B82F6"
                        : "#9CA3AF"
                    }
                    strokeWidth={
                      drawingToolState.currentObservation.location === "Torso"
                        ? "3"
                        : "2"
                    }
                    className="cursor-pointer hover:stroke-gray-600 hover:stroke-2"
                    onClick={() => handleBodyMapClick(150, 180, "Torso")}
                  />

                  {/* Arms */}
                  <rect
                    x="50"
                    y="100"
                    width="40"
                    height="120"
                    fill="none"
                    stroke={
                      drawingToolState.currentObservation.location ===
                      "Left Arm"
                        ? "#3B82F6"
                        : "#9CA3AF"
                    }
                    strokeWidth={
                      drawingToolState.currentObservation.location ===
                      "Left Arm"
                        ? "3"
                        : "2"
                    }
                    className="cursor-pointer hover:stroke-gray-600 hover:stroke-2"
                    onClick={() => handleBodyMapClick(70, 160, "Left Arm")}
                  />
                  <rect
                    x="210"
                    y="100"
                    width="40"
                    height="120"
                    fill="none"
                    stroke={
                      drawingToolState.currentObservation.location ===
                      "Right Arm"
                        ? "#3B82F6"
                        : "#9CA3AF"
                    }
                    strokeWidth={
                      drawingToolState.currentObservation.location ===
                      "Right Arm"
                        ? "3"
                        : "2"
                    }
                    className="cursor-pointer hover:stroke-gray-600 hover:stroke-2"
                    onClick={() => handleBodyMapClick(230, 160, "Right Arm")}
                  />

                  {/* Legs */}
                  <rect
                    x="110"
                    y="280"
                    width="35"
                    height="200"
                    fill="none"
                    stroke={
                      drawingToolState.currentObservation.location ===
                      "Left Leg"
                        ? "#3B82F6"
                        : "#9CA3AF"
                    }
                    strokeWidth={
                      drawingToolState.currentObservation.location ===
                      "Left Leg"
                        ? "3"
                        : "2"
                    }
                    className="cursor-pointer hover:stroke-gray-600 hover:stroke-2"
                    onClick={() => handleBodyMapClick(127, 380, "Left Leg")}
                  />
                  <rect
                    x="155"
                    y="280"
                    width="35"
                    height="200"
                    fill="none"
                    stroke={
                      drawingToolState.currentObservation.location ===
                      "Right Leg"
                        ? "#3B82F6"
                        : "#9CA3AF"
                    }
                    strokeWidth={
                      drawingToolState.currentObservation.location ===
                      "Right Leg"
                        ? "3"
                        : "2"
                    }
                    className="cursor-pointer hover:stroke-gray-600 hover:stroke-2"
                    onClick={() => handleBodyMapClick(172, 380, "Right Leg")}
                  />

                  {/* Sample wound markers - these would be interactive in a real implementation */}
                  {drawingToolState.observations.map((observation, index) => (
                    <circle
                      key={observation.id}
                      cx={observation.x || 120 + index * 20}
                      cy={observation.y || 150 + index * 20}
                      r={observation.size || 8}
                      fill={observation.color || "#EF4444"}
                      stroke="#DC2626"
                      strokeWidth="2"
                      className="cursor-pointer hover:r-12"
                      onClick={() => handleObservationClick(observation)}
                    />
                  ))}
                </svg>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-gray-400 text-sm">
                    {drawingToolState.currentObservation.location
                      ? `Selected: ${drawingToolState.currentObservation.location}. Fill in the observation details above.`
                      : "Click on body areas to add observations"}
                  </p>
                </div>
              </div>

              {/* Drawing Tools */}
              <div className="mt-4 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Tool:</span>
                  <select
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                    value={drawingToolState.selectedTool}
                    onChange={(e) =>
                      setDrawingToolState((prev) => ({
                        ...prev,
                        selectedTool: e.target.value,
                      }))
                    }
                  >
                    <option value="wound">Wound</option>
                    <option value="bruise">Bruise</option>
                    <option value="pressure">Pressure Sore</option>
                    <option value="injury">Injury</option>
                    <option value="marking">Marking</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Size:</span>
                  <input
                    type="range"
                    min="4"
                    max="20"
                    value={drawingToolState.selectedSize}
                    onChange={(e) =>
                      setDrawingToolState((prev) => ({
                        ...prev,
                        selectedSize: parseInt(e.target.value),
                      }))
                    }
                    className="w-20"
                  />
                  <span className="text-xs text-gray-600 w-6">
                    {drawingToolState.selectedSize}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Color:</span>
                  <div className="flex space-x-1">
                    {DRAWING_TOOL_COLORS.map((color) => (
                      <div
                        key={color}
                        className={`w-4 h-4 rounded-full cursor-pointer border-2 ${
                          drawingToolState.selectedColor === color
                            ? "border-gray-800"
                            : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() =>
                          setDrawingToolState((prev) => ({
                            ...prev,
                            selectedColor: color,
                          }))
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Documentation Panel */}
          <div className="space-y-4">
            {/* Current Observation */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Current Observation
              </h4>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium text-gray-700 mb-1 block">
                    Type
                  </Label>
                  <select
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    value={drawingToolState.currentObservation.type}
                    onChange={(e) =>
                      setDrawingToolState((prev) => ({
                        ...prev,
                        currentObservation: {
                          ...prev.currentObservation,
                          type: e.target.value,
                        },
                      }))
                    }
                  >
                    <option value="">Select Type</option>
                    <option value="pressure_ulcer">Pressure Ulcer</option>
                    <option value="wound">Wound</option>
                    <option value="bruise">Bruise</option>
                    <option value="abrasion">Abrasion</option>
                    <option value="laceration">Laceration</option>
                    <option value="burn">Burn</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-700 mb-1 block">
                    Location
                  </Label>
                  <input
                    type="text"
                    placeholder="e.g., Left hip, Stage 2"
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    value={drawingToolState.currentObservation.location}
                    onChange={(e) =>
                      setDrawingToolState((prev) => ({
                        ...prev,
                        currentObservation: {
                          ...prev.currentObservation,
                          location: e.target.value,
                        },
                      }))
                    }
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-700 mb-1 block">
                    Description
                  </Label>
                  <textarea
                    placeholder="Describe the observation in detail..."
                    rows={3}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 resize-none"
                    value={drawingToolState.currentObservation.description}
                    onChange={(e) =>
                      setDrawingToolState((prev) => ({
                        ...prev,
                        currentObservation: {
                          ...prev.currentObservation,
                          description: e.target.value,
                        },
                      }))
                    }
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium text-gray-700 mb-1 block">
                    Severity
                  </Label>
                  <select
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                    value={drawingToolState.currentObservation.severity}
                    onChange={(e) =>
                      setDrawingToolState((prev) => ({
                        ...prev,
                        currentObservation: {
                          ...prev.currentObservation,
                          severity: e.target.value,
                        },
                      }))
                    }
                  >
                    <option value="">Select Severity</option>
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    className="bg-gray-600 hover:bg-gray-700 text-white text-xs flex-1"
                    onClick={handleAddObservation}
                  >
                    Add Observation
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs flex-1"
                    onClick={() =>
                      setDrawingToolState((prev) => ({
                        ...prev,
                        currentObservation: {
                          type: "",
                          location: "",
                          description: "",
                          severity: "",
                          x: 0,
                          y: 0,
                          size: 8,
                          color: "#EF4444",
                        },
                      }))
                    }
                  >
                    Clear Form
                  </Button>
                </div>
              </div>
            </div>

            {/* Observations List */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Documented Observations
              </h4>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {drawingToolState.observations.length > 0 ? (
                  drawingToolState.observations.map((observation) => (
                    <div
                      key={observation.id}
                      className="bg-white border border-gray-200 rounded p-2"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-medium ${
                            observation.type === "pressure_ulcer"
                              ? "text-red-600"
                              : observation.type === "bruise"
                              ? "text-yellow-600"
                              : observation.type === "wound"
                              ? "text-purple-600"
                              : "text-gray-600"
                          }`}
                        >
                          {observation.type
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(observation.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-700">
                        {observation.location}: {observation.description}
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-xs text-gray-500">
                          Severity: {observation.severity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-4 w-4 p-0 text-xs"
                          onClick={() =>
                            handleRemoveObservation(observation.id)
                          }
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 text-xs">
                    No observations yet. Add observations using the form above.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BodyMapModal;
