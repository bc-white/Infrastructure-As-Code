import React, { useEffect } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";

const ScopeSeverityModal = ({
  isOpen,
  onClose,
  selectedInvestigation,
  calculateScopeSeverity,
  selectedScopeSeverity,
  setSelectedScopeSeverity,
  saveScopeSeverity,
}) => {
  useEffect(() => {
    if (isOpen && selectedInvestigation && calculateScopeSeverity) {
      const calculated = calculateScopeSeverity(selectedInvestigation);
      if (!selectedScopeSeverity?.scope && !selectedScopeSeverity?.severity) {
        setSelectedScopeSeverity((prev) => ({
          ...prev,
          scope: calculated.scope,
          severity: calculated.severity,
        }));
      }
    }
  }, [isOpen, selectedInvestigation]);

  if (!isOpen) return null;

  const scopeOptions = ["Isolated", "Pattern", "Widespread"];
  const severityOptions = [
    "No Harm",
    "Minimal Harm",
    "Actual Harm",
    "Immediate Jeopardy",
  ];

  const calculated = selectedInvestigation
    ? calculateScopeSeverity(selectedInvestigation)
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Scope & Severity Assessment
            </h3>
            {selectedInvestigation && (
              <p className="text-sm text-gray-600 mt-1">
                Investigation: {selectedInvestigation.careArea} (F-Tag:{" "}
                {selectedInvestigation.fTag})
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

        {/* Calculated Recommendation */}
        {calculated && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
              <span className="mr-2">💡</span>
              Calculated Recommendation
            </h4>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <Label className="text-xs text-blue-700">Recommended Scope</Label>
                <Badge className="mt-1 bg-blue-600">{calculated.scope}</Badge>
              </div>
              <div>
                <Label className="text-xs text-blue-700">
                  Recommended Severity
                </Label>
                <Badge className="mt-1 bg-blue-600">
                  {calculated.severity}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-blue-700">{calculated.reasoning}</p>
          </div>
        )}

        {/* Scope Selection */}
        <div className="mb-6">
          <Label className="text-sm font-medium text-gray-700 mb-3 block">
            Scope *
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {scopeOptions.map((option) => (
              <button
                key={option}
                onClick={() =>
                  setSelectedScopeSeverity((prev) => ({
                    ...prev,
                    scope: option,
                  }))
                }
                className={`p-4 border-2 rounded-lg transition-all ${
                  selectedScopeSeverity?.scope === option
                    ? "border-[#075b7d] bg-[#075b7d]/10 text-[#075b7d] font-medium"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                <div className="text-center">
                  <div className="font-medium">{option}</div>
                  <div className="text-xs mt-1 opacity-70">
                    {option === "Isolated"
                      ? "1 resident"
                      : option === "Pattern"
                      ? "2-3 residents"
                      : "4+ residents"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Severity Selection */}
        <div className="mb-6">
          <Label className="text-sm font-medium text-gray-700 mb-3 block">
            Severity *
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {severityOptions.map((option) => (
              <button
                key={option}
                onClick={() =>
                  setSelectedScopeSeverity((prev) => ({
                    ...prev,
                    severity: option,
                  }))
                }
                className={`p-4 border-2 rounded-lg transition-all ${
                  selectedScopeSeverity?.severity === option
                    ? "border-[#075b7d] bg-[#075b7d]/10 text-[#075b7d] font-medium"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                <div className="text-center">
                  <div className="font-medium">{option}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Rationale */}
        <div className="mb-6">
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Rationale & Evidence
          </Label>
          <textarea
            value={selectedScopeSeverity?.rationale || ""}
            onChange={(e) =>
              setSelectedScopeSeverity((prev) => ({
                ...prev,
                rationale: e.target.value,
              }))
            }
            placeholder="Provide rationale for scope and severity determination..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Include evidence from probes, observations, and interviews
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={saveScopeSeverity}
            className="bg-[#075b7d] hover:bg-[#075b7d]/90 text-white"
            disabled={
              !selectedScopeSeverity?.scope || !selectedScopeSeverity?.severity
            }
          >
            Save Scope & Severity
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScopeSeverityModal;
