import React from "react";

const LoadingModal = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[60] backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl border border-gray-200">
        <div className="flex flex-col items-center">
          {/* Animated loader */}
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-[#075b7d] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Investigation Data
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 text-center mb-4">
            Please wait while we fetch investigation data and resident
            information...
          </p>

          {/* Progress indicator */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#075b7d] h-full rounded-full animate-pulse"
              style={{ width: "70%" }}
            ></div>
          </div>

          {/* Additional info */}
          <p className="text-xs text-gray-500 mt-4 text-center">
            This may take a few moments. Do not close or refresh the page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingModal;
