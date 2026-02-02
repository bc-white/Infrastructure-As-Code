import React from "react";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";

const NotesPanel = ({
  isOpen,
  onClose,
  pinned,
  setPinned,
  size,
  setSize,
  selectedResident,
  residentGeneralNotes,
  setResidentGeneralNotes,
  isSurveyClosed,
  handleSaveNotes,
  handleLoadNotesHistory,
  notes,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed right-4 top-20 bg-white rounded-lg border border-gray-200 shadow-lg ${
        pinned ? "z-50" : "z-40"
      }`}
      style={{
        width:
          size === "small"
            ? "300px"
            : size === "medium"
            ? "400px"
            : "500px",
      }}
    >
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h4 className="font-medium text-gray-900">
          Resident Notes for {selectedResident?.name}
        </h4>
        <div className="flex items-center space-x-1">
          <Button
            onClick={() => setPinned(!pinned)}
            size="sm"
            variant="outline"
            className="h-6 w-6 p-0"
          >
            {pinned ? "📌" : "📍"}
          </Button>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="text-xs border border-gray-300 rounded px-1 py-0.5"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
          <Button
            onClick={onClose}
            size="sm"
            variant="outline"
            className="h-6 w-6 p-0"
          >
            ✕
          </Button>
        </div>
      </div>

      <div className="p-3">
        <div className="space-y-3">
          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
            <strong>Editing:</strong> General notes for {selectedResident?.name}{" "}
            (applies to all investigations)
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-700 mb-1 block">
              Resident General Notes
            </Label>
            <textarea
              placeholder="Add general notes about this resident (medical history, preferences, family info, etc.)..."
              value={residentGeneralNotes}
              onChange={(e) => setResidentGeneralNotes(e.target.value)}
              disabled={isSurveyClosed}
              rows={6}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              These notes apply to the resident across all investigations and
              care areas
            </p>
          </div>

          <div className="flex space-x-2">
            <Button
              size="sm"
              className="bg-gray-600 hover:bg-gray-700 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSaveNotes}
              disabled={isSurveyClosed}
            >
              Save Notes
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={handleLoadNotesHistory}
            >
              History
            </Button>
          </div>

          {/* Notes Status */}
          {selectedResident &&
            notes[`resident_${selectedResident.id}`]?.lastUpdated && (
              <div className="text-xs text-gray-500 text-center">
                Last updated:{" "}
                {new Date(
                  notes[`resident_${selectedResident.id}`].lastUpdated
                ).toLocaleString()}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default NotesPanel;
