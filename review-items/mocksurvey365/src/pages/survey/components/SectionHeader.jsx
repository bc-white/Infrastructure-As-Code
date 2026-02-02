import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

/**
 * Section Header Component
 * Collapsible header for clinical area sections
 */
const SectionHeader = ({ sectionId, title, isExpanded, onToggle, itemCount, isDisabled = false }) => {
  return (
    <button
      className={`w-full p-4 text-left transition-colors focus:outline-none ${isDisabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-slate-50 cursor-pointer'}`}
      onClick={onToggle}
      disabled={isDisabled}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-900 text-base truncate">{title}</h3>
          </div>
        </div>
        {itemCount !== undefined && (
          <span className="text-sm text-slate-500 font-medium flex-shrink-0">
            {itemCount} items
          </span>
        )}
      </div>
    </button>
  );
};

export default SectionHeader;
