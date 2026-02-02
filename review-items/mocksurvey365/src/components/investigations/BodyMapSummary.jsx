import React from "react";

/**
 * Reusable component for displaying Body Map Observations Summary
 * @param {Object} props
 * @param {Array} props.observations - Array of body map observations
 * @param {Function} props.onEdit - Callback function when edit button is clicked
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.title - Custom title for the summary card
 * @param {boolean} props.showEditButton - Whether to show the edit button
 */
const BodyMapSummary = ({
  observations = [],
  onEdit,
  className = "",
  title = "Body Map Observations",
  showEditButton = true,
}) => {
  // Don't render if no observations
  if (!observations || observations.length === 0) {
    return null;
  }

  const getTypeColor = (type) => {
    switch (type) {
      case "pressure_ulcer":
        return "text-red-600 bg-red-50 border-red-200";
      case "bruise":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "wound":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "abrasion":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "laceration":
        return "text-pink-600 bg-pink-50 border-pink-200";
      case "burn":
        return "text-red-700 bg-red-100 border-red-300";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const formatType = (type) => {
    if (!type) return "Unknown";
    return type
      .replace("_", " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return "N/A";
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 mb-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {observations.length} observation{observations.length !== 1 ? "s" : ""} documented
          </p>
        </div>
        {showEditButton && onEdit && (
          <button
            onClick={onEdit}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Edit
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {observations.map((observation) => (
          <div
            key={observation.id}
            className={`border rounded-lg p-3 ${getTypeColor(observation.type)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold">
                    {formatType(observation.type)}
                  </span>
                  {observation.severity && (
                    <span className="text-xs px-2 py-0.5 bg-white rounded-full border">
                      {observation.severity}
                    </span>
                  )}
                </div>
                {observation.location && (
                  <p className="text-xs font-medium mb-1">
                    Location: {observation.location}
                  </p>
                )}
                {observation.description && (
                  <p className="text-xs opacity-90">
                    {observation.description}
                  </p>
                )}
              </div>
              <span className="text-xs opacity-75 ml-2">
                {formatDate(observation.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BodyMapSummary;

