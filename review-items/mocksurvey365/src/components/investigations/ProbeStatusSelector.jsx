import React from "react";


const ProbeStatusSelector = ({
  status,
  onStatusChange,
  label = "Surveyor Assessment:",
  className = "",
  showStatusText = true,
}) => {
  const statusOptions = [
    { value: "Met", label: "Met", activeClass: "bg-green-600 text-white", inactiveClass: "bg-white text-gray-700 border border-gray-300 hover:bg-green-50" },
    { value: "Not Met", label: "Not Met", activeClass: "bg-red-600 text-white", inactiveClass: "bg-white text-gray-700 border border-gray-300 hover:bg-red-50" },
    { value: "N/A", label: "N/A", activeClass: "bg-gray-600 text-white", inactiveClass: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50" },
  ];

  return (
    <div className={`mt-4 pt-3 border-t border-gray-300 ${className}`}>
      <label className="text-xs font-medium text-gray-700 mb-2 block">
        {label}
      </label>
      <div className="flex gap-2">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onStatusChange(option.value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              status === option.value
                ? option.activeClass
                : option.inactiveClass
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {showStatusText && status && (
        <p className="text-xs text-gray-500 mt-2">
          Status: <span className="font-medium">{status}</span>
        </p>
      )}
    </div>
  );
};

export default ProbeStatusSelector;
