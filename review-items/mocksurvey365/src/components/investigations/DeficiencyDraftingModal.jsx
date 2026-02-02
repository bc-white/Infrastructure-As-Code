import React from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";

const DeficiencyDraftingModal = ({
  isOpen,
  onClose,
  selectedInvestigation,
  draftDeficiency,
  setDraftDeficiency,
  saveDeficiencyDraft,
}) => {
  if (!isOpen || !draftDeficiency) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-5xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Deficiency Drafting
            </h3>
            {selectedInvestigation && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  F-Tag: {draftDeficiency.fTag}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {draftDeficiency.scope}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {draftDeficiency.severity}
                </Badge>
              </div>
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

        <Tabs defaultValue="narrative" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="narrative">Narrative</TabsTrigger>
            <TabsTrigger value="regulatory">Regulatory Summary</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
          </TabsList>

          {/* Narrative Tab */}
          <TabsContent value="narrative" className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Deficiency Narrative
              </Label>
              <textarea
                value={draftDeficiency.narrative || ""}
                onChange={(e) =>
                  setDraftDeficiency((prev) => ({
                    ...prev,
                    narrative: e.target.value,
                  }))
                }
                placeholder="Enter the deficiency narrative..."
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                This narrative will be used in the final deficiency report.
                Include specific examples and evidence.
              </p>
            </div>

            {/* Quick Insert Buttons */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Quick Insert
              </h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    setDraftDeficiency((prev) => ({
                      ...prev,
                      narrative:
                        prev.narrative +
                        "\n\nBased on observation, interview, and record review...",
                    }))
                  }
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  + Standard Opening
                </Button>
                <Button
                  onClick={() =>
                    setDraftDeficiency((prev) => ({
                      ...prev,
                      narrative:
                        prev.narrative +
                        "\n\nFindings include the following:",
                    }))
                  }
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  + Findings Section
                </Button>
                <Button
                  onClick={() =>
                    setDraftDeficiency((prev) => ({
                      ...prev,
                      narrative:
                        prev.narrative +
                        `\n\nResident #${selectedInvestigation?.residentId || "[ID]"}...`,
                    }))
                  }
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  + Resident Reference
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Regulatory Summary Tab */}
          <TabsContent value="regulatory" className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Regulatory Summary
              </Label>
              <textarea
                value={draftDeficiency.regulatorySummary || ""}
                onChange={(e) =>
                  setDraftDeficiency((prev) => ({
                    ...prev,
                    regulatorySummary: e.target.value,
                  }))
                }
                placeholder="Enter regulatory guidance and requirements..."
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Include relevant CFR citations and state survey guidance.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Care Area: {draftDeficiency.careArea}
              </h4>
              <p className="text-xs text-blue-700">
                Reference applicable regulations and interpretive guidelines for
                this care area.
              </p>
            </div>
          </TabsContent>

          {/* Evidence Tab */}
          <TabsContent value="evidence" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Observations */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Observations ({draftDeficiency.evidence?.observations?.length || 0})
                </h4>
                {draftDeficiency.evidence?.observations?.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {draftDeficiency.evidence.observations.map((obs, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-white p-2 rounded border border-gray-200"
                      >
                        <div className="font-medium text-gray-700">
                          {obs.type || "Observation"}
                        </div>
                        <div className="text-gray-600 mt-1">
                          {obs.description || obs.notes || "No details"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    No observations recorded
                  </p>
                )}
              </div>

              {/* Interviews */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Interviews ({draftDeficiency.evidence?.interviews?.length || 0})
                </h4>
                {draftDeficiency.evidence?.interviews?.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {draftDeficiency.evidence.interviews.map((int, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-white p-2 rounded border border-gray-200"
                      >
                        <div className="font-medium text-gray-700">
                          {int.interviewee || "Staff Interview"}
                        </div>
                        <div className="text-gray-600 mt-1">
                          {int.summary || int.notes || "No details"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No interviews recorded</p>
                )}
              </div>

              {/* Record Review */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Record Review ({draftDeficiency.evidence?.recordReview?.length || 0})
                </h4>
                {draftDeficiency.evidence?.recordReview?.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {draftDeficiency.evidence.recordReview.map((rec, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-white p-2 rounded border border-gray-200"
                      >
                        <div className="font-medium text-gray-700">
                          {rec.documentType || "Document"}
                        </div>
                        <div className="text-gray-600 mt-1">
                          {rec.findings || rec.notes || "No details"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    No record reviews documented
                  </p>
                )}
              </div>

              {/* Attachments */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Attachments ({draftDeficiency.evidence?.attachments?.length || 0})
                </h4>
                {draftDeficiency.evidence?.attachments?.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {draftDeficiency.evidence.attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-white p-2 rounded border border-gray-200"
                      >
                        <div className="font-medium text-gray-700">
                          {att.name || att.fileName || "File"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No attachments</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={saveDeficiencyDraft}
            className="bg-[#075b7d] hover:bg-[#075b7d]/90 text-white"
          >
            Save Deficiency Draft
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeficiencyDraftingModal;
