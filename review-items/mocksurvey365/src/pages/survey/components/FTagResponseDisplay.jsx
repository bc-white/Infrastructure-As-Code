import React from "react";

/**
 * FTag Response Display Component
 * Displays F-Tag information including citation, explanation, and compliance status
 */
const FTagResponseDisplay = ({ isLoading, responseData }) => {
  if (isLoading) {
    return (
      <div className="mt-3 p-4 bg-slate-50 border-l-4 border-l-slate-300">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
          <span className="text-xs text-slate-700">Loading F-Tag information...</span>
        </div>
      </div>
    );
  }

  if (!responseData) {
    return null;
  }

  return (
    <div className="mt-3 p-4 bg-slate-50 border-l-4 border-l-slate-300 space-y-3">
      <div className="flex items-start gap-2">
        <span className="text-xs font-mono font-semibold text-slate-700">
          {responseData.ftag || 'N/A'}
        </span>
        {responseData.compliant !== undefined && (
          <span className={`text-xs font-medium ${
            responseData.compliant
              ? "text-slate-600"
              : "text-slate-700"
          }`}>
            {responseData.compliant ? 'Compliant' : 'Non-Compliant'}
          </span>
        )}
      </div>

      {responseData.citation && (
        <div>
          <p className="text-xs font-semibold text-slate-900 mb-1">Citation:</p>
          <p className="text-xs text-slate-700 leading-relaxed">{responseData.citation}</p>
        </div>
      )}

      {responseData.explanation && (
        <div>
          <p className="text-xs font-semibold text-slate-900 mb-1">Explanation:</p>
          <p className="text-xs text-slate-700 leading-relaxed">{responseData.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default FTagResponseDisplay;
