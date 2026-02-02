import React from "react";

/**
 * Reusable component for probe notes
 * @param {Object} props
 * @param {string} props.notes - Current notes value
 * @param {Function} props.onNotesChange - Callback when notes change
 * @param {string} props.placeholder - Placeholder text for textarea
 * @param {string} props.label - Label for the notes section
 * @param {boolean} props.disabled - Whether the textarea is disabled
 * @param {number} props.rows - Number of rows for the textarea
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.required - Whether the notes are required
 */
const ProbeNotes = ({
  notes = "",
  onNotesChange,
  placeholder = "Add notes for this probe...",
  label = "Probe Notes",
  disabled = false,
  rows = 4,
  className = "",
  required = false,
}) => {
  const isError = required && (!notes || notes.trim() === "");

  return (
    <div className={`space-y-2 ${className}`}>
      <label className={`text-sm font-medium block ${isError ? "text-red-600" : "text-gray-700"}`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`w-full px-3 py-2 text-sm border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed ${
          isError ? "border-red-500 bg-red-50" : "border-gray-300"
        }`}
      />
      {isError && (
        <p className="text-xs text-red-500">
          Notes are required when status is "Not Met"
        </p>
      )}
      {notes && !isError && (
        <p className="text-xs text-gray-500">
          {notes.length} character{notes.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
};

export default ProbeNotes;
