import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { ChevronDown, FileText } from "lucide-react";
import { toast } from "sonner";

const CEPathwayModal = ({
  isOpen,
  onClose,
  currentInvestigationId,
  investigations,
  selectedResident,
  apiLoading,
  selectedProbeForCE,
  setSelectedProbeForCE,
  ceAccordionOpen,
  setCeAccordionOpen,
  pathwayQuestionChecks,
  setPathwayQuestionChecks,
  pathwayQuestionNotes,
  setPathwayQuestionNotes,
  isSurveyClosed,
  isInvitedUser,
  surveyData,
  currentUserName,
  currentUserId,
  setInvestigations,
  handleSurveyDataChange,
}) => {
  if (!isOpen || !currentInvestigationId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Critical Element Pathways Assessment
            </h3>
            {(() => {
              const investigation = investigations.find(
                (inv) => inv.id === currentInvestigationId
              );
              return investigation ? (
                <div>
                  <p className="text-sm text-gray-600 mt-1">
                    {investigation.careArea} - {selectedResident?.name}
                  </p>
                  {investigation.cePathwayAssessment?.lastUpdated && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last saved:{" "}
                      {new Date(
                        investigation.cePathwayAssessment.lastUpdated
                      ).toLocaleString()}
                      {investigation.cePathwayAssessment.updatedBy &&
                        ` by ${investigation.cePathwayAssessment.updatedBy}`}
                    </p>
                  )}
                </div>
              ) : null;
            })()}
          </div>
          <Button
            onClick={() => {
              onClose();
              // Clear the state when closing
              setPathwayQuestionChecks({});
              setPathwayQuestionNotes({});
            }}
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
          >
            ✕
          </Button>
        </div>

        {(() => {
          const investigation = investigations.find(
            (inv) => inv.id === currentInvestigationId
          );

          // Get probes with CE pathway questions
          const probesWithQuestions =
            investigation?.requiredProbes?.filter(
              (probe) =>
                probe.cePathwayQuestions &&
                Object.keys(probe.cePathwayQuestions).length > 0
            ) || [];

          if (probesWithQuestions.length === 0) {
            return (
              <div className="p-8 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  No CE Pathway Questions Available
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Critical Element Pathway questions have not been loaded for
                  this investigation yet.
                </p>
                <p className="text-xs text-gray-500">
                  {apiLoading
                    ? "Loading pathway questions..."
                    : "Pathway questions are being loaded automatically"}
                </p>
              </div>
            );
          }

          // Get the currently selected probe or default to first one
          const currentProbe =
            probesWithQuestions.find((p) => p.id === selectedProbeForCE) ||
            probesWithQuestions[0];
          const cePathwayQuestions = currentProbe?.cePathwayQuestions || {};

          return (
            <div className="space-y-4">
              {/* Simple Tab Guidance */}
              <div className="text-center py-2 px-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  Select a tab below to review questions for each F-Tag or care
                  area
                </p>
              </div>

              {/* Probe Selection Tabs using shadcn tabs */}
              <Tabs
                value={selectedProbeForCE || probesWithQuestions[0]?.id}
                onValueChange={setSelectedProbeForCE}
                className="w-full"
              >
                <TabsList className="flex w-full flex-wrap gap-1 p-1 bg-gray-50 h-auto">
                  {probesWithQuestions.map((probe) => (
                    <TabsTrigger
                      key={probe.id}
                      value={probe.id}
                      className="flex flex-col items-start p-3 text-left min-h-[80px] flex-1 min-w-[200px] data-[state=active]:bg-white data-[state=active]:text-[#075b7d] data-[state=active]:shadow-sm border border-gray-200"
                    >
                      <div className="font-medium text-sm">{probe.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {probe.ftag}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {probe.pathwayName}
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* TabsContent for each probe */}
                {probesWithQuestions.map((probe) => (
                  <TabsContent
                    key={probe.id}
                    value={probe.id}
                    className="mt-6 space-y-4"
                  >
                    {/* Current Probe Info */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {probe.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {probe.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge
                              variant="outline"
                              className="text-xs border-[#075b7d] text-[#075b7d]"
                            >
                              {probe.ftag}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs border-[#075b7d] text-[#075b7d]"
                            >
                              {probe.pathwayName}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <div>Status: {probe.status}</div>
                          <div>{probe.required ? "Required" : "Optional"}</div>
                        </div>
                      </div>
                    </div>

                    {/* CE Pathway Questions organized by category */}
                    <div className="w-full space-y-3">
                      {Object.entries(probe.cePathwayQuestions || {}).map(
                        ([category, questions], categoryIndex) => {
                          if (
                            !questions ||
                            !Array.isArray(questions) ||
                            questions.length === 0
                          ) {
                            return null;
                          }

                          const isOpen = ceAccordionOpen[category] || false;

                          return (
                            <div
                              key={category}
                              className="border border-gray-200 rounded-lg overflow-hidden"
                            >
                              <button
                                onClick={() => {
                                  setCeAccordionOpen((prev) => ({
                                    ...prev,
                                    [category]: !prev[category],
                                  }));
                                }}
                                className={`w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200 ${
                                  isOpen ? "bg-gray-100" : ""
                                }`}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <h4 className="font-semibold text-gray-900 text-sm text-left">
                                    {category}
                                  </h4>
                                  <div className="flex items-center space-x-2">
                                    <Badge
                                      variant="outline"
                                      className="text-xs border-gray-300 text-gray-600"
                                    >
                                      {questions.length}{" "}
                                      {questions.length === 1
                                        ? "question"
                                        : "questions"}
                                    </Badge>
                                    {(() => {
                                      const checkedCount = (
                                        questions || []
                                      ).filter((_, i) => {
                                        const questionKey = `${category}_${i}`;
                                        return pathwayQuestionChecks?.[
                                          questionKey
                                        ];
                                      }).length;

                                      if (checkedCount > 0) {
                                        return (
                                          <Badge
                                            variant="outline"
                                            className="text-xs bg-[#075b7d]/10 text-[#075b7d] border-[#075b7d]"
                                          >
                                            ✓ {checkedCount}
                                          </Badge>
                                        );
                                      }
                                      return null;
                                    })()}
                                    <ChevronDown
                                      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                                        isOpen ? "rotate-180" : ""
                                      }`}
                                    />
                                  </div>
                                </div>
                              </button>

                              <div
                                className={`transition-all duration-300 ease-in-out ${
                                  isOpen
                                    ? "max-h-[600px] opacity-100"
                                    : "max-h-0 opacity-0"
                                } overflow-hidden`}
                              >
                                <div className="px-4 pb-3 pt-2">
                                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {(questions || []).map(
                                      (question, index) => {
                                        const questionKey = `${probe.id}_${category}_${index}`;
                                        const isChecked =
                                          pathwayQuestionChecks?.[
                                            questionKey
                                          ] || false;
                                        const notes =
                                          pathwayQuestionNotes?.[questionKey] ||
                                          "";

                                        // Format question text - split on " o " to create bullet points
                                        const formatQuestionText = (text) => {
                                          if (typeof text !== "string")
                                            return text;

                                          // Check if the text contains " o " (bullet point marker)
                                          if (text.includes(" o ")) {
                                            const parts = text
                                              .split(" o ")
                                              .filter((part) => part.trim());
                                            return (
                                              <div className="space-y-1">
                                                {parts.map((part, i) => (
                                                  <div
                                                    key={i}
                                                    className="flex items-start space-x-2"
                                                  >
                                                    <span className="text-[#075b7d] mt-0.5">
                                                      •
                                                    </span>
                                                    <span className="flex-1">
                                                      {part.trim()}
                                                    </span>
                                                  </div>
                                                ))}
                                              </div>
                                            );
                                          }

                                          return text;
                                        };

                                        return (
                                          <div
                                            key={index}
                                            className={`p-3 bg-white border rounded-lg transition-all ${
                                              isChecked
                                                ? "border-[#075b7d] bg-[#075b7d]/5"
                                                : "border-gray-200 hover:border-gray-300"
                                            }`}
                                          >
                                            <div className="flex items-start space-x-3 mb-2">
                                              <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                  setPathwayQuestionChecks(
                                                    (prev) => ({
                                                      ...prev,
                                                      [questionKey]:
                                                        e.target.checked,
                                                    })
                                                  );
                                                }}
                                                disabled={isSurveyClosed}
                                                className="mt-1 w-4 h-4 text-[#075b7d] border-gray-300 rounded focus:ring-[#075b7d] focus:ring-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                              />
                                              <span className="flex-shrink-0 w-6 h-6 bg-[#075b7d] text-white rounded-full flex items-center justify-center text-xs font-medium">
                                                {index + 1}
                                              </span>
                                              <div
                                                className={`text-sm flex-1 leading-relaxed ${
                                                  isChecked
                                                    ? "text-gray-900 font-medium"
                                                    : "text-gray-700"
                                                }`}
                                              >
                                                {formatQuestionText(question)}
                                              </div>
                                            </div>

                                            {/* Notes textarea */}
                                            <div className="ml-10 mt-2">
                                              <textarea
                                                placeholder="Add notes for this question..."
                                                value={notes}
                                                onChange={(e) => {
                                                  setPathwayQuestionNotes(
                                                    (prev) => ({
                                                      ...prev,
                                                      [questionKey]:
                                                        e.target.value,
                                                    })
                                                  );
                                                }}
                                                disabled={isSurveyClosed}
                                                rows={2}
                                                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                                              />
                                            </div>
                                          </div>
                                        );
                                      }
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>

                    {/* Summary and Export Options for this probe */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-1">
                            CE Pathway Questions Assessment - {probe.name}
                          </h5>
                          <div className="space-y-1">
                            <p className="text-xs text-gray-600">
                              {Object.values(
                                probe.cePathwayQuestions || {}
                              ).reduce(
                                (total, questions) =>
                                  total + (questions?.length || 0),
                                0
                              )}{" "}
                              total questions across{" "}
                              {Object.keys(probe.cePathwayQuestions || {})
                                .length}{" "}
                              categories
                              {probesWithQuestions.length > 1 &&
                                ` for ${probe.name}`}
                            </p>
                            <div className="flex items-center space-x-3 text-xs">
                              <span className="text-[#075b7d] font-medium">
                                ✓{" "}
                                {
                                  Object.keys(
                                    pathwayQuestionChecks || {}
                                  ).filter(
                                    (key) =>
                                      key.startsWith(`${probe.id}_`) &&
                                      pathwayQuestionChecks[key]
                                  ).length
                                }{" "}
                                checked
                              </span>
                              <span className="text-gray-600">
                                📝{" "}
                                {
                                  Object.keys(
                                    pathwayQuestionNotes || {}
                                  ).filter(
                                    (key) =>
                                      key.startsWith(`${probe.id}_`) &&
                                      pathwayQuestionNotes[key]?.trim()
                                  ).length
                                }{" "}
                                with notes
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        Check off questions as you review them and add notes for
                        important findings.
                        {probesWithQuestions.length > 1 && (
                          <span className="ml-2 text-[#075b7d]">
                            Switch between tabs above to review different
                            F-Tags.
                          </span>
                        )}
                      </div>

                      {/* Save Assessment Button */}
                      <div className="mt-3 flex justify-end">
                        <Button
                          onClick={() => {
                            // Save the pathway assessment to the investigation
                            if (!currentInvestigationId) {
                              toast.error("No investigation selected");
                              return;
                            }

                            // Find the current investigation to get residentId
                            const currentInvestigation = investigations.find(
                              (inv) => inv.id === currentInvestigationId
                            );
                            if (!currentInvestigation) {
                              toast.error("Investigation not found");
                              return;
                            }

                            const updatedInvestigation = {
                              ...currentInvestigation,
                              cePathwayAssessment: {
                                checks: pathwayQuestionChecks,
                                notes: pathwayQuestionNotes,
                                lastUpdated: new Date().toISOString(),
                                updatedBy: currentUserName,
                                updatedById: currentUserId,
                              },
                            };

                            // Update investigations array
                            const updatedInvestigations = investigations.map(
                              (inv) => {
                                if (inv.id === currentInvestigationId) {
                                  return updatedInvestigation;
                                }
                                return inv;
                              }
                            );

                            setInvestigations(updatedInvestigations);
                            handleSurveyDataChange(
                              "investigations",
                              updatedInvestigations
                            );

                            // CRITICAL: Also update the resident's investigations object
                            // This prevents the useEffect from overwriting our changes
                            const currentResidents =
                              surveyData?.investigationSurvey?.residents || [];
                            const updatedResidents = currentResidents.map(
                              (resident) => {
                                if (
                                  resident.id ===
                                  currentInvestigation.residentId
                                ) {
                                  return {
                                    ...resident,
                                    investigations: updatedInvestigation,
                                  };
                                }
                                return resident;
                              }
                            );

                            handleSurveyDataChange("investigationSurvey", {
                              ...surveyData?.investigationSurvey,
                              residents: updatedResidents,
                            });

                            toast.success(
                              "CE Pathway assessment saved successfully"
                            );
                          }}
                          disabled={
                            isSurveyClosed ||
                            (isInvitedUser() &&
                              surveyData?.investigationSurvey?.teamMemberPayload?.some(
                                (submission) =>
                                  submission.taskStatus === "approved"
                              ))
                          }
                          size="sm"
                          className="bg-[#075b7d] hover:bg-[#064d63] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Save Assessment Progress
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default CEPathwayModal;
