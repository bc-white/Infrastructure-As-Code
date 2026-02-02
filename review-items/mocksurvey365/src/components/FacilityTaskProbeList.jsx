import React from "react";
import { Badge } from "./ui/badge";
import { Loader2, ChevronRight as ChevronRightIcon } from "lucide-react";

/**
 * Helper function to find probe data from API facility tasks array
 * Matches by mandatorytaskId and probe text
 */
const findProbeDataFromAPI = (facilityTasksData, taskKey, probeText) => {
  if (!facilityTasksData || !Array.isArray(facilityTasksData)) return null;
  
  // Normalize text for comparison
  const normalizeText = (text) => {
    if (!text) return '';
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
  };
  
  const normalizedProbeText = normalizeText(probeText);
  
  // Find matching facility task by mandatorytaskId and probe text
  const matchingTask = facilityTasksData.find(task => {
    const taskMandatoryId = typeof task.mandatorytaskId === 'object' 
      ? task.mandatorytaskId?._id 
      : task.mandatorytaskId;
    
    // Match by task key (mandatorytaskId) and probe text
    // Ensure IDs are compared as strings
    if (String(taskMandatoryId) === String(taskKey) && task.probe) {
      return normalizeText(task.probe) === normalizedProbeText;
    }
    return false;
  });
  
  if (matchingTask) {
    // Map API response to expected probeData format
    return {
      status: matchingTask.status,
      probe: matchingTask.probe,
      fTag: matchingTask.fTag,
      citation: matchingTask.citation,
      explanation: matchingTask.explanation,
      citationNote: matchingTask.citationNote,
      note: matchingTask.note,
      compliant: matchingTask.compliant,
      aiAnalyzed: matchingTask.aiAnalyzed,
      originalFTag: matchingTask.originalFTag,
      timestamp: matchingTask.timestamp,
      _id: matchingTask._id,
    };
  }
  
  return null;
};

const FacilityTaskProbeList = ({
  taskKey,
  task,
  surveyData,
  facilityTasksData, // NEW: Array of facility tasks from API
  isLoadingFTag,
  loadingProbeKey,
  openResponseDropdowns,
  setOpenResponseDropdowns,
  handleProbeResponse,
  handleSurveyDataChange,
  isPageClosed,
  isSurveyClosed,
  localProbeNotes,
  handleProbeNoteChange,
  dirtyProbeNotesRef, // Track which probe notes have unsaved local edits
  checkIfInvitedUser,
  currentUser,
}) => {
  if (!task || !task.probeList) return null;




  
  return (
    <div className="mb-4">
      <h5 className="text-sm font-semibold text-gray-900 mb-3">
        Questions (Probe List) with F-Tag Mapping
      </h5>

      <div className="space-y-4">
        {Object.entries(task.probeList).map(([categoryKey, categoryData]) => {
          // Handle both new structure (object with name/items) and old structure (array)
          const categoryName = categoryData?.name || categoryKey;
          const probes = Array.isArray(categoryData)
            ? categoryData
            : categoryData?.items || [];

          // Get unique F-Tags for this category
          const uniqueFTags = [
            ...new Set(probes.map((item) => item.fTag).filter(Boolean)),
          ];

          return (
            <div
              key={categoryKey}
              className="bg-white border border-gray-200 rounded-lg p-4 mb-4"
            >
              <div className="mb-3">
                <h6 className="font-medium text-gray-900 mb-2 text-sm">
                  {categoryName}
                </h6>
                {uniqueFTags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {uniqueFTags.map((fTag, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs border-gray-300 text-gray-700 px-2 py-0.5"
                      >
                        {fTag}
                      </Badge>
                    ))}
                  </div>
                )}  
              </div>
              <div className="space-y-4">
                {probes.map((item, index) => {
                  const probeKey = `${categoryKey}_${index}`;
                  const dropdownKey = `${taskKey}_${probeKey}`;
                  const isDropdownOpen =
                    openResponseDropdowns[dropdownKey] || false;

                
                  const apiProbeData = findProbeDataFromAPI(facilityTasksData, taskKey, item.probe);
                
                  const localProbeData = 
                    surveyData?.facilityTasks?.taskProbeResponses?.[taskKey]?.[probeKey] || 
                    surveyData?.taskProbeResponses?.[taskKey]?.[probeKey];
                  
                  // MERGE STRATEGY: Start with API data as base, overlay local changes
                  // This allows local edits to show immediately while preserving server data
                  // Local data takes priority for fields that user can edit (status, note, etc.)
                  const probeData = apiProbeData && localProbeData 
                    ? {
                        ...apiProbeData,  // Base: server data (includes _id, timestamp, etc.)
                        ...localProbeData, // Overlay: local changes take priority
                        // Preserve _id from API for updates
                        _id: apiProbeData._id || localProbeData._id,
                      }
                    : localProbeData || apiProbeData;


                  const hasResponse =
                    probeData && probeData.status && probeData.status !== "";

                  return (
                    <div
                      key={index}
                      className="pb-4 border-b border-gray-100 last:border-b-0 last:pb-0"
                    >
                      {/* Question */}
                      <div className="mb-3">
                        <div className="flex items-start gap-3 mb-2">
                          <span className="text-sm text-gray-700 flex-1 leading-relaxed">
                            {item.probe}
                          </span>

                          {/* Loading indicator */}
                          {isLoadingFTag && loadingProbeKey === probeKey && (
                            <Loader2 className="w-4 h-4 animate-spin text-[#075b7d] flex-shrink-0" />
                          )}
                        </div>
                      </div>

                      {/* Option (Dropdown) */}
                      <div className="mb-3">
                        <select
                          value={probeData?.status || ""}
                          onChange={(e) => {
                            const answer = e.target.value;
                            if (answer && answer !== "") {
                              // Use the new API-integrated handler
                              handleProbeResponse(
                                taskKey,
                                categoryKey,
                                index,
                                item.probe,
                                answer,
                                item
                              );
                            } else {
                              // Clear the response if empty selection
                              const currentResponses =
                                surveyData?.facilityTasks?.taskProbeResponses ||
                                surveyData?.taskProbeResponses ||
                                {};
                              const currentTaskResponses =
                                currentResponses[taskKey] || {};
                              const updatedResponses = {
                                ...currentTaskResponses,
                                [probeKey]: {
                                  ...currentTaskResponses[probeKey], // Preserve existing fields like 'note'
                                  status: "",
                                  probe: item.probe,
                                  fTag: null,
                                  citation: "",
                                  compliant: null,
                                  explanation: "",
                                  citationNote: "",
                                  timestamp: new Date().toISOString(),
                                  aiAnalyzed: false,
                                  originalFTag: item.fTag,
                                },
                              };

                              const updatedTaskResponses = {
                                ...currentResponses,
                                [taskKey]: updatedResponses,
                              };

                              // Update facilityTasks structure
                              const updatedFacilityTasks = {
                                ...surveyData?.facilityTasks,
                                taskProbeResponses: updatedTaskResponses
                              };
                              
                              handleSurveyDataChange(
                                "facilityTasks",
                                updatedFacilityTasks
                              );
                            }
                          }}
                          disabled={
                            (isLoadingFTag && loadingProbeKey === probeKey) ||
                            isPageClosed ||
                            isSurveyClosed
                          }
                          className="w-28 h-8 px-2 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      {/* Response */}
                      {hasResponse && (
                        <div>
                          <button
                            onClick={() => {
                              setOpenResponseDropdowns((prev) => ({
                                ...prev,
                                [dropdownKey]: !prev[dropdownKey],
                              }));
                            }}
                            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 cursor-pointer transition-colors mb-2"
                          >
                            <ChevronRightIcon
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isDropdownOpen ? "rotate-90" : ""
                              }`}
                            />
                            <span>View Response</span>
                          </button>

                          {isDropdownOpen && (
                            <div className="p-3 bg-gray-50 rounded-md border border-gray-200 space-y-2.5">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <span className="text-xs font-medium text-gray-700">
                                  Response:
                                </span>
                                <span className="text-xs text-gray-900 font-medium">
                                  {probeData.status}
                                </span>
                              </div>

                              {probeData.fTag && (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                  <span className="text-xs font-medium text-gray-700">
                                    F-Tag:
                                  </span>
                                  <Badge
                                    variant={
                                      probeData.compliant === false
                                        ? "destructive"
                                        : "default"
                                    }
                                    className={`text-xs ${
                                      probeData.aiAnalyzed
                                        ? probeData.compliant === false
                                          ? "bg-red-100 text-red-800 border-red-300"
                                          : probeData.compliant === true
                                          ? "bg-green-100 text-green-800 border-green-300"
                                          : "bg-blue-100 text-blue-800 border-blue-300"
                                        : "bg-gray-100 text-gray-800 border-gray-300"
                                    }`}
                                  >
                                    {probeData.fTag}
                                  </Badge>
                                </div>
                              )}

                              {probeData.compliant !== null && (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                  <span className="text-xs font-medium text-gray-700">
                                    Status:
                                  </span>
                                  <Badge
                                    variant={
                                      probeData.compliant
                                        ? "default"
                                        : "destructive"
                                    }
                                    className={`text-xs ${
                                      probeData.compliant
                                        ? "bg-green-100 text-green-800 border-green-300"
                                        : "bg-red-100 text-red-800 border-red-300"
                                    }`}
                                  >
                                    {probeData.compliant
                                      ? "Compliant"
                                      : "Citation Required"}
                                  </Badge>
                                </div>
                              )}

                              {probeData.explanation && (
                                <div>
                                  <span className="text-xs font-medium text-gray-700 block mb-1.5">
                                    Explanation:
                                  </span>
                                  <p className="text-xs text-gray-600 leading-relaxed">
                                    {probeData.explanation}
                                  </p>
                                </div>
                              )}

                              {probeData.citation && (
                                <div>
                                  <span className="text-xs font-medium text-gray-700 block mb-1.5">
                                    Citation:
                                  </span>
                                  <p className="text-xs text-gray-600 leading-relaxed">
                                    {probeData.citation}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes */}
                      <div className="mt-3">
                        <label className="text-xs font-medium text-gray-700 block mb-1.5">
                          Notes
                        </label>
                        <textarea
                          key={`probe-note-${taskKey}-${probeKey}`}
                          value={
                            // For dirty keys (locally edited), use local state
                            // For non-dirty keys, use server data (probeData.note) to enable real-time sync
                            dirtyProbeNotesRef?.current?.[`${taskKey}_${probeKey}`]
                              ? (localProbeNotes[`${taskKey}_${probeKey}`] ?? "")
                              : (probeData?.note ?? "")
                          }
                          onChange={(e) =>
                            handleProbeNoteChange(
                              taskKey,
                              categoryKey,
                              index,
                              e.target.value
                            )
                          }
                          disabled={isPageClosed || isSurveyClosed}
                          placeholder="Add notes for this question..."
                          rows={2}
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

      
      </div>
    </div>
  );
};

export default FacilityTaskProbeList;
