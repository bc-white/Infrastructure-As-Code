import React, { useMemo } from "react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { ChevronDown } from "lucide-react";
import useInvestigationStore from "../../../stores/useInvestigationStore";

/**
 * Right Panel: Investigation Workspace
 * Main workspace for viewing and managing investigations for selected resident
 * Uses investigation store as primary data source
 */
const InvestigationWorkspace = ({
  selectedResident,
  surveyData,
  getResidentInvestigations,
  investigations, // Fallback prop
  filteredResidentsForUser,
  apiLoading,
  isInvitedUser,
  // Investigation data and state
  notes,
  selectedInvestigation,
  // Modal and panel state setters
  setCurrentInvestigationId,
  setShowCEPathwayModal,
  setShowNotesPanel,
  setShowMDSModal,
  setShowDrawingTool,
  setShowWeightCalculator,
  setSelectedInvestigation,
  // Investigation handlers
  startInvestigation,
  completeInvestigation,
  reopenInvestigation,
  openScopeSeverityWizard,
  openDeficiencyDrafting,
  // Probe handlers
  editProbeOutcome,
  addProbeOutcome,
  openProbeEditModal,
  // Other data
  criticalElementPathways,
  pathwayQuestionChecks,
  pathwayQuestionNotes,
  isSurveyClosed,
  apiError,
  fetchInvestigationData,
}) => {
  // Get resident investigations from store
  const storeResidentInvestigations = useMemo(() => {
    if (!selectedResident?.id) return [];
    
    const store = useInvestigationStore.getState();
    const surveyId = surveyData?.surveyId || localStorage.getItem("currentSurveyId");
    const storedData = store.getApiResidentsData(surveyId);
    
    if (storedData?.residents && Array.isArray(storedData.residents)) {
      const resident = storedData.residents.find(r => r.id === selectedResident.id);
      if (resident?.investigations) {
        // investigations is a single object, return as array for compatibility
        return typeof resident.investigations === 'object' && !Array.isArray(resident.investigations)
          ? [resident.investigations]
          : Array.isArray(resident.investigations)
          ? resident.investigations
          : [];
      }
    }
    
    // Fallback to getResidentInvestigations function or investigations prop
    return getResidentInvestigations?.(selectedResident.id) || [];
  }, [selectedResident, surveyData, getResidentInvestigations]);

  if (!selectedResident) {
    return (
      <div className="lg:col-span-2 lg:h-[calc(100vh-120px)] lg:overflow-y-auto scrollbar-hide">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 text-center mb-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-400 text-lg font-medium">👤</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filteredResidentsForUser?.length === 0
              ? apiLoading
                ? "Loading Residents..."
                : isInvitedUser?.()
                ? "No Residents Assigned to You"
                : "No Residents Loaded"
              : "Select a Resident"}
          </h3>
          <p className="text-gray-500">
            {filteredResidentsForUser?.length === 0
              ? apiLoading
                ? "Please wait while investigation data is being loaded"
                : isInvitedUser?.()
                ? "No residents have been assigned to you yet"
                : "Investigation data is being loaded automatically"
              : "Choose a resident from the list to begin investigation work"}
          </p>
        </div>
      </div>
    );
  }

  const residentInvestigations = getResidentInvestigations(selectedResident.id);



  return (
    <div className="lg:col-span-2 lg:h-[calc(100vh-120px)] lg:overflow-y-auto scrollbar-hide">
      <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-4">
        {/* Resident Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {selectedResident?.name || "No Resident Selected"}
            </h3>
           

            {/* Diagnosis Information */}
            {selectedResident?.diagnosis && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Diagnosis:</span>{" "}
                {selectedResident.diagnosis}
              </div>
            )}

            {/* Selection Reason */}
            {selectedResident?.selectionReason && (
              <div className="mt-1 text-sm text-gray-500">
                <span className="font-medium">Selection Reason:</span>{" "}
                {selectedResident.selectionReason}
              </div>
            )}

            {selectedResident?.id &&
              (() => {
                const assignedMember = surveyData?.teamMembers?.find((m) =>
                  m.assignedResidents.includes(selectedResident.id)
                );
                return assignedMember ? (
                  <small className="text-xs bg-[#075b7d] text-white border-0 mt-4 p-1 rounded-md">
                    <span className="font-medium">Assigned to:</span>{" "}
                    {assignedMember.name}
                  </small>
                ) : null;
              })()}
          </div>
        </div>

        {/* Resident Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {residentInvestigations.length}
              </div>
              <div className="text-gray-600">Total Investigations</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {residentInvestigations.filter((inv) => inv.status === "Pending").length}
              </div>
              <div className="text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {residentInvestigations.filter((inv) => inv.status === "In Progress").length}
              </div>
              <div className="text-gray-600">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {residentInvestigations.filter((inv) => inv.status === "Completed").length}
              </div>
              <div className="text-gray-600">Completed</div>
            </div>
          </div>

          {/* Priority Summary */}
          {residentInvestigations.filter(
            (inv) => inv.priority === "Critical" || inv.priority === "High"
          ).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {residentInvestigations.filter((inv) => inv.priority === "Critical").length}
                  </div>
                  <div className="text-gray-600">Critical Priority</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {residentInvestigations.filter((inv) => inv.priority === "High").length}
                  </div>
                  <div className="text-gray-600">High Priority</div>
                </div>
              </div>
            </div>
          )}

          {/* Risk Factors Summary */}
          {selectedResident &&
            selectedResident.specialTypes &&
            selectedResident.specialTypes.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Risk Factors:
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedResident.specialTypes.map((type, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Investigations List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              Active Investigations for{" "}
              {selectedResident?.name || "Resident"}
            </h4>
            <div className="text-sm text-gray-500">
              {residentInvestigations.length} investigation
              {residentInvestigations.length !== 1 ? "s" : ""}
            </div>
          </div>

          {residentInvestigations.length > 0 ? (
            residentInvestigations.map((investigation) => (
              <div
                key={investigation.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">
                      {investigation.careArea}
                    </h5>

                    {/* Badges Row */}
                    <div className="flex items-center space-x-2">
                      {investigation.fTag && (
                        <Badge variant="outline" className="text-xs">
                          {investigation.fTag}
                        </Badge>
                      )}
                      <Badge
                        variant={
                          investigation.status === "Completed"
                            ? "default"
                            : investigation.status === "In Progress"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {investigation.status}
                      </Badge>
                      {/* Priority Badge */}
                      {investigation.priority && (
                        <Badge
                          variant={
                            investigation.priority === "Critical"
                              ? "destructive"
                              : investigation.priority === "High"
                              ? "default"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {investigation.priority}
                        </Badge>
                      )}

                      {/* Notes Indicator */}
                      {notes[investigation.id] &&
                        (notes[investigation.id].investigation ||
                          notes[investigation.id].resident) && (
                          <Badge
                            variant="outline"
                            className="text-xs text-green-600 border-green-300"
                          >
                            Notes
                          </Badge>
                        )}
                    </div>
                  </div>
                </div>

                {investigation.reason && (
                  <div className="mb-3 text-sm text-gray-600">
                    <strong>Reason:</strong> {investigation.reason}
                  </div>
                )}

                {/* Risk Factors and CE Pathways */}
                {(investigation.riskFactors ||
                  investigation.cePathways) && (
                  <div className="mb-3 space-y-2">
                    {investigation.riskFactors &&
                      investigation.riskFactors.length > 0 && (
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">
                            Risk Factors:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {investigation.riskFactors.map(
                              (factor, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs text-gray-600 border-gray-300"
                                >
                                  {factor}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )} 
                    {investigation.cePathways &&
                      investigation.cePathways.length > 0 && (
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">
                            CE Pathways:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {investigation.cePathways.map(
                              (pathway, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs text-gray-600 border-gray-300"
                                >
                                  {pathway}
                                </Badge>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                <div className="mb-3 text-xs text-gray-500">
                  <strong>Created:</strong>{" "}
                  {new Date(
                    investigation.createdAt
                  ).toLocaleDateString()}
                  {investigation.startedAt && (
                    <span className="ml-3">
                      <strong>Started:</strong>{" "}
                      {new Date(
                        investigation.startedAt
                      ).toLocaleDateString()}
                    </span>
                  )}
                  {investigation.completedAt && (
                    <span className="ml-3">
                      <strong>Completed:</strong>{" "}
                      {new Date(
                        investigation.completedAt
                      ).toLocaleDateString()}
                    </span>
                  )}
                  {investigation.reopenedAt && (
                    <span className="ml-3">
                      <strong>Reopened:</strong>{" "}
                      {new Date(
                        investigation.reopenedAt
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  {/* Start Investigation Button */}
                  {investigation.status === "Pending" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        startInvestigation(investigation.id)
                      }
                      disabled={
                        isSurveyClosed ||
                        (isInvitedUser() &&
                          surveyData?.investigationSurvey?.teamMemberPayload?.some(
                            (submission) =>
                              submission.taskStatus === "approved"
                          ))
                      }
                      className="text-xs bg-[#075b7d]/10 text-gray-800 border-[#075b7d] hover:bg-[#075b7d]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Start Investigation
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCurrentInvestigationId(investigation.id);
                      setShowCEPathwayModal(true);
                    }}
                    className="text-xs"
                  >
                    CE Pathways
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCurrentInvestigationId(investigation.id);
                      setShowNotesPanel(true);
                    }}
                    className="text-xs"
                  >
                    Notes
                  </Button>
                  {investigation.status === "Completed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCurrentInvestigationId(investigation.id);
                        setShowMDSModal(true);
                      }}
                      className="text-xs"
                    >
                      MDS Data
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCurrentInvestigationId(investigation.id);
                      setShowDrawingTool(true);
                    }}
                    className="text-xs"
                  >
                    Body Map
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCurrentInvestigationId(investigation.id);
                      setShowWeightCalculator(true);
                    }}
                    className="text-xs"
                  >
                    Weight Calc
                  </Button>
                  {/* Phase 2: Scope & Severity */}
                  {investigation.completedProbes &&
                    investigation.completedProbes.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          openScopeSeverityWizard(investigation)
                        }
                        disabled={isSurveyClosed}
                        className="text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Scope & Severity
                      </Button>
                    )}

                  {/* Phase 2: Deficiency Drafting */}
                  {investigation.scope && investigation.severity && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        openDeficiencyDrafting(investigation)
                      }
                      disabled={isSurveyClosed}
                      className="text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Draft Deficiency
                    </Button>
                  )}
                  {investigation.status === "In Progress" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        completeInvestigation(investigation.id)
                      }
                      disabled={isSurveyClosed}
                      className="text-xs bg-[#075b7d]/20 text-gray-800 border-[#075b7d] hover:bg-[#075b7d]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Complete Investigation
                    </Button>
                  )}

                  {/* Reopen Investigation Button */}
                  {investigation.status === "Completed" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        reopenInvestigation(investigation.id)
                      }
                      disabled={
                        isSurveyClosed ||
                        (isInvitedUser() &&
                          surveyData?.investigationSurvey?.teamMemberPayload?.some(
                            (submission) =>
                              submission.taskStatus === "approved"
                          ))
                      }
                      className="text-xs bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Edit Investigation
                    </Button>
                  )}
                </div>

                {/* Probe Progress Indicator - Only show when investigation is started */}
                {investigation.requiredProbes &&
                  investigation.requiredProbes.length > 0 &&
                  (investigation.status === "In Progress" ||
                    investigation.status === "Completed") && (
                    <div className="mt-3 mb-3 p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700">
                            Required Probes
                          </span>
                          {investigation.pathwayAssessment && (
                            <Badge
                              variant="outline"
                              className="text-xs text-blue-700 border-blue-300"
                            >
                              Pathway Determined
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {investigation.completedProbes?.length || 0} /{" "}
                          {investigation.requiredProbes.length} completed
                        </span>
                      </div>

                      {investigation.pathwayAssessment && (
                        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                          <div className="text-blue-700">
                            <strong>Pathway Assessment:</strong>{" "}
                            {criticalElementPathways[
                              investigation.pathwayAssessment.pathwayKey
                            ]?.name || "Unknown Pathway"}
                          </div>
                          <div className="text-blue-600 mt-1">
                            Completed:{" "}
                            {new Date(
                              investigation.pathwayAssessment.completedAt
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        {investigation.requiredProbes.map((probe) => {
                          const completedProbe =
                            investigation.completedProbes?.find(
                              (p) => p.id === probe.id
                            );
                          return (
                            <div
                              key={probe.id}
                              className="flex items-center justify-between p-2 bg-white rounded border"
                            >
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {probe.name}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {probe.description}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Evidence required:{" "}
                                  {probe.evidenceTypes.join(", ")}
                                </div>
                                {completedProbe && (
                                  <>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {completedProbe.updatedAt
                                        ? `Updated: ${new Date(
                                            completedProbe.updatedAt
                                          ).toLocaleString()}`
                                        : `Completed: ${new Date(
                                            completedProbe.completedAt
                                          ).toLocaleString()}`}
                                    </div>
                                    {completedProbe.evidenceFiles &&
                                      completedProbe.evidenceFiles.length > 0 && (
                                        <div className="mt-2 flex items-center space-x-1">
                                          <Badge
                                            variant="outline"
                                            className="text-xs text-blue-700 border-blue-300"
                                          >
                                            📎{" "}
                                            {completedProbe.evidenceFiles.length}{" "}
                                            file
                                            {completedProbe.evidenceFiles.length !==
                                            1
                                              ? "s"
                                              : ""}
                                          </Badge>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                              openProbeEditModal(
                                                investigation.id,
                                                probe.id
                                              )
                                            }
                                            className="h-5 px-2 text-xs"
                                          >
                                            View Files
                                          </Button>
                                        </div>
                                      )}
                                  </>
                                )}
                              </div>

                              <div className="flex items-center space-x-2 ml-4">
                                {completedProbe ? (
                                  <div className="flex items-center space-x-2">
                                    <Badge
                                      variant={
                                        completedProbe.outcome === "Met"
                                          ? "default"
                                          : completedProbe.outcome === "Not Met"
                                          ? "destructive"
                                          : "outline"
                                      }
                                      className="text-xs"
                                    >
                                      {completedProbe.outcome}
                                    </Badge>
                                    {investigation.status !== "Completed" &&
                                      investigation.status !== "Pending" && (
                                        <>
                                          <div className="flex space-x-1">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() =>
                                                editProbeOutcome(
                                                  investigation.id,
                                                  probe.id,
                                                  "Met",
                                                  completedProbe.evidence ||
                                                    [],
                                                  completedProbe.notes || "",
                                                  completedProbe.evidenceFiles ||
                                                    []
                                                )
                                              }
                                              disabled={isSurveyClosed}
                                              className={`text-xs h-6 px-2 ${
                                                completedProbe.outcome === "Met"
                                                  ? "bg-green-100 text-green-800 border-green-400"
                                                  : "bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                              Met
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() =>
                                                editProbeOutcome(
                                                  investigation.id,
                                                  probe.id,
                                                  "Not Met",
                                                  completedProbe.evidence ||
                                                    [],
                                                  completedProbe.notes || "",
                                                  completedProbe.evidenceFiles ||
                                                    []
                                                )
                                              }
                                              disabled={isSurveyClosed}
                                              className={`text-xs h-6 px-2 ${
                                                completedProbe.outcome === "Not Met"
                                                  ? "bg-red-100 text-red-800 border-red-400"
                                                  : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                              Not Met
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() =>
                                                editProbeOutcome(
                                                  investigation.id,
                                                  probe.id,
                                                  "NA",
                                                  completedProbe.evidence || [],
                                                  completedProbe.notes || "",
                                                  completedProbe.evidenceFiles ||
                                                    []
                                                )
                                              }
                                              disabled={isSurveyClosed}
                                              className={`text-xs h-6 px-2 ${
                                                completedProbe.outcome === "NA"
                                                  ? "bg-gray-100 text-gray-800 border-gray-400"
                                                  : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                              N/A
                                            </Button>
                                          </div>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                              openProbeEditModal(
                                                investigation.id,
                                                probe.id
                                              )
                                            }
                                            className="text-xs h-6 px-2"
                                            title="Add evidence files and notes"
                                          >
                                            📎 Evidence
                                          </Button>
                                        </>
                                      )}
                                  </div>
                                ) : (
                                  investigation.status !== "Completed" &&
                                  investigation.status !== "Pending" && (
                                    <>
                                      <div className="flex space-x-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            addProbeOutcome(
                                              investigation.id,
                                              probe.id,
                                              "Met",
                                              [],
                                              "",
                                              []
                                            )
                                          }
                                          disabled={isSurveyClosed}
                                          className="text-xs h-6 px-2 bg-green-50 text-green-700 border-green-300 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          Met
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            addProbeOutcome(
                                              investigation.id,
                                              probe.id,
                                              "Not Met",
                                              [],
                                              "",
                                              []
                                            )
                                          }
                                          disabled={isSurveyClosed}
                                          className="text-xs h-6 px-2 bg-red-50 text-red-700 border-red-300 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          Not Met
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() =>
                                            addProbeOutcome(
                                              investigation.id,
                                              probe.id,
                                              "NA",
                                              [],
                                              "",
                                              []
                                            )
                                          }
                                          disabled={isSurveyClosed}
                                          className="text-xs h-6 px-2 bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          N/A
                                        </Button>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          openProbeEditModal(
                                            investigation.id,
                                            probe.id
                                          )
                                        }
                                        className="text-xs h-6 px-2"
                                        title="Add evidence files and notes"
                                      >
                                        📝 Details
                                      </Button>
                                    </>
                                  )
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* Probes Source Information - Only show before investigation starts */}
                {investigation.requiredProbes &&
                  investigation.requiredProbes.length > 0 &&
                  investigation.status === "Pending" && (
                    <div className="mb-3 p-2 border border-blue-200 rounded-lg mt-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-blue-800">
                          ✓{" "}
                          {investigation.requiredProbes.reduce((count, probe) => {
                            const checkedCount = Object.keys(
                              pathwayQuestionChecks || {}
                            ).filter(
                              (key) =>
                                key.startsWith(`${probe.id}_`) &&
                                pathwayQuestionChecks[key]
                            ).length;
                            return count + checkedCount;
                          }, 0)}{" "}
                          checked
                        </span>
                        <span className="text-gray-600">
                          📝{" "}
                          {investigation.requiredProbes.reduce((count, probe) => {
                            const notesCount = Object.keys(
                              pathwayQuestionNotes || {}
                            ).filter(
                              (key) =>
                                key.startsWith(`${probe.id}_`) &&
                                pathwayQuestionNotes[key]?.trim()
                            ).length;
                            return count + notesCount;
                          }, 0)}{" "}
                          with notes
                        </span>
                      </div>
                    </div>
                  )}

                {/* No Probes Determined Message - Only show before investigation starts */}
                {(!investigation.requiredProbes ||
                  investigation.requiredProbes.length === 0) &&
                  investigation.status === "Pending" && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-yellow-800">
                          Probes Not Available
                        </span>
                      </div>
                      <p className="text-xs text-yellow-700 mb-2">
                        No probes have been determined for this investigation
                        yet. Use the CE Pathways tool to determine required
                        probes.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCurrentInvestigationId(investigation.id);
                          setShowCEPathwayModal(true);
                        }}
                        className="text-xs text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                      >
                        Determine Probes via CE Pathways
                      </Button>
                    </div>
                  )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-gray-400 text-lg font-medium">📋</span>
              </div>
              <p>
                No investigations available for{" "}
                {selectedResident?.name || "this resident"}
              </p>
              <p className="text-sm">
                {apiLoading
                  ? "Loading investigation data..."
                  : "Investigation data is being loaded"}
              </p>
              {apiError && (
                <Button
                  onClick={fetchInvestigationData}
                  size="sm"
                  className="mt-3 bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Retry Loading
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Notes Display */}
        <div className="mt-6 space-y-4">
          {/* Resident General Notes - Always show if they exist */}
          {notes[`resident_${selectedResident.id}`]?.general && (
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 flex items-center">
                  General Notes for{" "}
                  {selectedResident?.name || "Resident"}
                </h4>
                <Button
                  onClick={() => {
                    setSelectedInvestigation(null);
                    setShowNotesPanel(true);
                  }}
                  size="sm"
                  variant="outline"
                  className="text-gray-600 border-gray-300 hover:bg-gray-100"
                >
                  Edit
                </Button>
              </div>
              <div className="p-3 bg-white rounded text-sm text-gray-800">
                {notes[`resident_${selectedResident.id}`].general}
              </div>
            </div>
          )}

          {/* No Notes Message */}
          {!notes[`resident_${selectedResident.id}`]?.general && (
            <div className="p-4 border border-gray-200 rounded-lg text-center">
              <p className="text-gray-600 text-sm">
                No notes yet for{" "}
                {selectedResident?.name || "this resident"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Click "Resident Notes" to add general notes about this resident
              </p>
            </div>
          )}

          {/* Investigation-Specific Notes */}
          {selectedInvestigation && notes[selectedInvestigation.id] && (
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 flex items-center">
                  Investigation Notes: {selectedInvestigation.careArea}
                </h4>
                <Button
                  onClick={() => setShowNotesPanel(true)}
                  size="sm"
                  variant="outline"
                  className="text-gray-600 border-gray-300 hover:bg-gray-100"
                >
                  Edit
                </Button>
              </div>

              {/* Body Map Observations */}
              {notes[selectedInvestigation.id].bodyMapObservations &&
                notes[selectedInvestigation.id].bodyMapObservations.length >
                  0 && (
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Body Map Observations:
                    </h5>
                    <div className="space-y-2">
                      {notes[
                        selectedInvestigation.id
                      ].bodyMapObservations.map((observation, index) => (
                        <div
                          key={index}
                          className="p-2 bg-white border border-gray-200 rounded text-xs text-gray-800"
                        >
                          {observation}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Weight Data */}
              {notes[selectedInvestigation.id].weightData && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Weight Assessment:
                  </h5>
                  <div className="p-2 bg-white border border-gray-200 rounded text-xs text-gray-800">
                    {notes[selectedInvestigation.id].weightData}
                  </div>
                </div>
              )}

              {notes[selectedInvestigation.id].lastUpdated && (
                <div className="text-xs text-gray-500 text-center">
                  Last updated:{" "}
                  {new Date(
                    notes[selectedInvestigation.id].lastUpdated
                  ).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestigationWorkspace;
