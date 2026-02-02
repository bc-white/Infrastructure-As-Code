import React from "react";
import { Button } from "../ui/button";
import { CloudDownload, Save, X } from "lucide-react";

/**
 * Small, non-intrusive notification in the top-right corner.
 * Appears when unsaved changes are detected during a server sync.
 * Gives users the option to:
 * 1. Keep their unsaved changes
 * 2. Fetch fresh data from the server (discards local changes)
 * 3. Dismiss the notification
 */
const UnsavedChangesOptionsModal = ({
  open,
  onOpenChange,
  onKeepChanges,
  onFetchServerData,
  changesCount = 0,
}) => {
  if (!open) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-72">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Save className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-gray-900">
              {changesCount > 0 ? `${changesCount} unsaved` : "Unsaved"} changes
            </span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 mb-3">
          New data available. Your changes are preserved.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={() => {
              onKeepChanges?.();
              onOpenChange(false);
            }}
          >
            <Save className="h-3.5 w-3.5 text-blue-500" />
            Keep mine
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={() => {
              onFetchServerData?.();
              onOpenChange(false);
            }}
          >
            <CloudDownload className="h-3.5 w-3.5 text-green-500" />
            Fetch new
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnsavedChangesOptionsModal;
