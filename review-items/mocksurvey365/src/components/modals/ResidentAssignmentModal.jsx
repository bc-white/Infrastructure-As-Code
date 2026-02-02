import React, { useState, useCallback, useMemo, memo, useEffect } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { X, Info, AlertTriangle, Loader2 } from "lucide-react";
import api from "../../service/api";
import { toast } from "sonner";

/**
 * Helper function to get team member by ID with multiple ID format support
 */
const getTeamMemberById = (teamMembers, id) => {
  if (!id || !teamMembers?.length) return null;
  
  const idStr = String(id);
  
  return teamMembers.find((tm) => {
    // Check all possible ID fields
    const possibleIds = [
      tm.id,
      tm._id,
      tm.teamMemberUserId,
      typeof tm.teamMemberUserId === "object" 
        ? tm.teamMemberUserId?._id || tm.teamMemberUserId?.id 
        : null,
    ].filter(Boolean).map(String);
    
    return possibleIds.includes(idStr);
  });
};


const ResidentAssignmentModal = memo(({
  isOpen,
  onClose,
  residents = [],
  allResidents = [],
  teamMembers = [],
  localTeamMembers = [],
  onBulkAssignment,
  onUnassignResident,
  isDisabled = false,
  title = "Assign Residents to Team Members",
  surveyId = null, // Add surveyId prop for API call
}) => {
  // Local state for the modal
  const [selectedResidentsForBulkAssignment, setSelectedResidentsForBulkAssignment] = useState(new Set());
  const [bulkAssignmentTeamMember, setBulkAssignmentTeamMember] = useState("");
  const [selectedResidentForDetails, setSelectedResidentForDetails] = useState(null);
  const [assignmentWarning, setAssignmentWarning] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false); // Loading state for bulk assignment
  const [isUnassigning, setIsUnassigning] = useState(null); // Track which resident is being unassigned (by ID)
  
  // API-fetched assignment data
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [apiTeamMemberAssignments, setApiTeamMemberAssignments] = useState([]);

  // Fetch team member assignments from API when modal opens
  useEffect(() => {
    const fetchAssignments = async () => {
      const currentSurveyId = surveyId || localStorage.getItem("currentSurveyId");
      if (!isOpen || !currentSurveyId) return;

      setIsLoadingAssignments(true);
      try {
        const response = await api.survey.viewTeamMembersInSurvey(currentSurveyId);
        if (response && (response.success || response.status === true || response.statusCode === 200)) {
          const apiTeamMembers = response.data || [];
          // Map the API response - assignedResidents is now array of objects with residentId, generatedId, name, etc.
          const mappedTeamMembers = apiTeamMembers.map((member) => ({
            id: member.teamMemberId || member._id || member.id,
            _id: member.teamMemberId || member._id || member.id,
            name: member.firstName || member.name || "Unknown",
            firstName: member.firstName || member.name || "",
            lastName: member.lastName || "",
            email: member.email || "",
            teamMemberUserId: member.teamMemberUserId,
            // Keep assignedResidents as array of objects for richer data
            assignedResidents: member.assignedResidents || [],
          }));
          setApiTeamMemberAssignments(mappedTeamMembers);
        }
      } catch (error) {
       ///
      } finally {
        setIsLoadingAssignments(false);
      }
    };

    fetchAssignments();
  }, [isOpen, surveyId]);

  // Effective team members - prioritize API data, then props
  const effectiveTeamMembers = useMemo(() => {
    if (apiTeamMemberAssignments.length > 0) return apiTeamMemberAssignments;
    if (teamMembers.length > 0) return teamMembers;
    return localTeamMembers;
  }, [apiTeamMemberAssignments, teamMembers, localTeamMembers]);

  // Helper to check if a resident is assigned - prioritize API data
  const getResidentAssignment = useCallback((resident) => {
    let assignedMember = null;
    let isAssigned = false;

    // PRIORITY 1: Check API-fetched team member assignments (most accurate, fresh from server)
    if (apiTeamMemberAssignments.length > 0) {
      const apiTeamMember = apiTeamMemberAssignments.find(
        (tm) => tm.assignedResidents?.some((assignedResident) => {
          // Handle new API format: assignedResidents is array of objects with residentId and generatedId
          if (typeof assignedResident === 'object' && assignedResident !== null) {
            return String(assignedResident.residentId) === String(resident.id) ||
                   String(assignedResident.generatedId) === String(resident.generatedId) ||
                   String(assignedResident.residentId) === String(resident.generatedId) ||
                   String(assignedResident.generatedId) === String(resident.id);
          }
          // Fallback for old format: assignedResidents is array of string IDs
          return String(assignedResident) === String(resident.id) || 
                 String(assignedResident) === String(resident.generatedId);
        })
      );

      if (apiTeamMember) {
        isAssigned = true;
        assignedMember = apiTeamMember;
        return { isAssigned, assignedMember };
      }
      
      // If API data is loaded and resident not found in any team member's list, it's unassigned
      return { isAssigned: false, assignedMember: null };
    }

    // PRIORITY 2: Check if resident has assignedTeamMemberId in allResidents
    const residentInAll = allResidents.find((r) => r.id === resident.id);
    const assignedTeamMemberId = residentInAll?.assignedTeamMemberId;

    if (assignedTeamMemberId) {
      isAssigned = true;
      assignedMember = getTeamMemberById(effectiveTeamMembers, assignedTeamMemberId);
    }

    // PRIORITY 3: Check if resident is in any team member's assignedResidents list
    if (!assignedMember) {
      const backendTeamMember = localTeamMembers.find(
        (tm) => tm.assignedResidents?.includes(String(resident.id))
      );

      if (backendTeamMember) {
        isAssigned = true;
        const backendMemberId = backendTeamMember.teamMemberUserId || backendTeamMember.id || backendTeamMember._id;
        assignedMember = getTeamMemberById(effectiveTeamMembers, backendMemberId);

        if (!assignedMember && backendTeamMember.firstName) {
          assignedMember = backendTeamMember;
        }
      }
    }

    return { isAssigned, assignedMember };
  }, [allResidents, effectiveTeamMembers, localTeamMembers, apiTeamMemberAssignments]);

  // Get unassigned residents
  const unassignedResidents = useMemo(() => {
    return residents.filter((r) => !getResidentAssignment(r).isAssigned);
  }, [residents, getResidentAssignment]);

  // Calculate assignment stats - prioritize API data
  const assignmentStats = useMemo(() => {
    const allAssignedResidentIds = new Set();

    // PRIORITY 1: Use API-fetched data (fresh from server)
    if (apiTeamMemberAssignments.length > 0) {
      apiTeamMemberAssignments.forEach((tm) => {
        (tm.assignedResidents || []).forEach((assignedResident) => {
          // Handle new API format: assignedResidents is array of objects
          if (typeof assignedResident === 'object' && assignedResident !== null) {
            if (assignedResident.residentId) {
              allAssignedResidentIds.add(String(assignedResident.residentId));
            }
            if (assignedResident.generatedId) {
              allAssignedResidentIds.add(String(assignedResident.generatedId));
            }
          } else {
            // Fallback for old format: array of string IDs
            allAssignedResidentIds.add(String(assignedResident));
          }
        });
      });
    } else {
      // Fallback to local data only if API data not loaded
      localTeamMembers.forEach((tm) => {
        (tm.assignedResidents || []).forEach((residentId) => {
          allAssignedResidentIds.add(String(residentId));
        });
      });

      allResidents.forEach((r) => {
        if (r.assignedTeamMemberId) {
          allAssignedResidentIds.add(String(r.id));
        }
      });
    }

    const assignedCount = allResidents.filter((r) =>
      allAssignedResidentIds.has(String(r.id)) || allAssignedResidentIds.has(String(r.generatedId))
    ).length;

    return {
      assignedCount,
      unassignedCount: allResidents.length - assignedCount,
    };
  }, [allResidents, localTeamMembers, apiTeamMemberAssignments]);

  // Handle close modal
  const handleClose = useCallback(() => {
    setSelectedResidentsForBulkAssignment(new Set());
    setBulkAssignmentTeamMember("");
    setSelectedResidentForDetails(null);
    setAssignmentWarning(null);
    setApiTeamMemberAssignments([]); // Reset API data on close
    onClose();
  }, [onClose]);

  // Handle select all
  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      setSelectedResidentsForBulkAssignment(
        new Set(unassignedResidents.map((r) => r.id))
      );
    } else {
      setSelectedResidentsForBulkAssignment(new Set());
    }
  }, [unassignedResidents]);

  // Function to refetch assignments from API
  const refetchAssignments = useCallback(async () => {
    const currentSurveyId = surveyId || localStorage.getItem("currentSurveyId");
    if (!currentSurveyId) return;

    try {
      const response = await api.survey.viewTeamMembersInSurvey(currentSurveyId);
      if (response && (response.success || response.status === true || response.statusCode === 200)) {
        const apiTeamMembers = response.data || [];
        const mappedTeamMembers = apiTeamMembers.map((member) => ({
          id: member.teamMemberId || member._id || member.id,
          _id: member.teamMemberId || member._id || member.id,
          name: member.firstName || member.name || "Unknown",
          firstName: member.firstName || member.name || "",
          lastName: member.lastName || "",
          email: member.email || "",
          teamMemberUserId: member.teamMemberUserId,
          assignedResidents: member.assignedResidents || [],
        }));
        setApiTeamMemberAssignments(mappedTeamMembers);
      }
    } catch (error) {
      //
    }
  }, [surveyId]);

  // Handle unassign with loading state - call API directly and refetch
  const handleUnassign = useCallback(async (resident) => {
    const currentSurveyId = surveyId || localStorage.getItem("currentSurveyId");
    if (!currentSurveyId) {
      toast.error("Survey ID not found");
      return;
    }
    
    setIsUnassigning(resident.id);
    try {
      // Call the API directly to unassign the resident
      const payload = {
        surveyId: currentSurveyId,
        generatedId: resident.generatedId || resident._id || resident.id,
      };

      const response = await api.survey.removeTeamMemberInitialPool(payload);

      if (response.statusCode === 200 || response.success) {
        toast.success(`${resident.name} has been unassigned successfully`);
        
        // Refetch assignments from API to get fresh data
        await refetchAssignments();
        
        // Also notify parent if callback provided (for parent state sync)
        if (onUnassignResident) {
          // Pass a flag to indicate the unassign already happened
          onUnassignResident(resident, true);
        }
      } else {
        throw new Error(response.message || "Failed to unassign resident");
      }
    } catch (error) {
     
      toast.error(error.message || "Failed to unassign resident. Please try again.");
    } finally {
      setIsUnassigning(null);
    }
  }, [surveyId, refetchAssignments, onUnassignResident]);

  // Handle resident selection toggle
  const handleResidentToggle = useCallback((residentId, checked) => {
    setSelectedResidentsForBulkAssignment((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(residentId);
      } else {
        newSet.delete(residentId);
      }
      return newSet;
    });
  }, []);

  // Handle bulk assignment
  const handleBulkAssignment = useCallback(async () => {
    if (selectedResidentsForBulkAssignment.size > 0 && bulkAssignmentTeamMember) {
      setIsAssigning(true);
      try {
        await onBulkAssignment(
          Array.from(selectedResidentsForBulkAssignment),
          bulkAssignmentTeamMember
        );
        // Reset selection after successful assignment
        setSelectedResidentsForBulkAssignment(new Set());
        setBulkAssignmentTeamMember("");
        // Refetch assignments from API to get fresh data
        await refetchAssignments();
      } catch (error) {
        // Keep selection on error so user can retry
        //
      } finally {
        setIsAssigning(false);
      }
    }
  }, [selectedResidentsForBulkAssignment, bulkAssignmentTeamMember, onBulkAssignment, refetchAssignments]);

  // Check if all unassigned are selected
  const allUnassignedSelected = useMemo(() => {
    return unassignedResidents.length > 0 &&
      unassignedResidents.every((r) => selectedResidentsForBulkAssignment.has(r.id));
  }, [unassignedResidents, selectedResidentsForBulkAssignment]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)] max-h-[calc(100vh-1rem)] sm:max-h-[85vh] flex flex-col shadow-2xl">
        {/* Fixed Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {residents.length} residents • {effectiveTeamMembers.length} team members
              </p>
            </div>
            <Button
              onClick={handleClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Panel - Residents List */}
          <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto">
            <div className="p-3 sm:p-4">
              {/* Loading State */}
              {isLoadingAssignments ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#075b7d] mb-3" />
                  <p className="text-sm text-gray-600">Loading assignments...</p>
                </div>
              ) : (
                <>
                  {/* Select All Checkbox */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <label className={`flex items-center space-x-3 ${isAssigning ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        checked={allUnassignedSelected}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        disabled={isDisabled || isAssigning}
                        className="w-4 h-4 text-[#075b7d] border-gray-300 rounded focus:ring-2 focus:ring-[#075b7d] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        Select all residents (Unassigned only)
                      </span>
                    </label>
                  </div>

                  {/* Residents List */}
                  <div className="space-y-1">
                    {residents.map((resident) => {
                      const isSelected = selectedResidentsForBulkAssignment.has(resident.id);
                      const isDetailsSelected = selectedResidentForDetails?.id === resident.id;
                      const { isAssigned, assignedMember } = getResidentAssignment(resident);

                      return (
                        <label
                          key={resident.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                            isAssigned
                              ? "opacity-60 cursor-not-allowed"
                              : "cursor-pointer hover:bg-gray-50"
                          } ${
                            isDetailsSelected
                              ? "bg-[#075b7d]/10 border border-[#075b7d]"
                          : isSelected
                          ? "bg-gray-50"
                          : ""
                      }`}
                      onClick={(e) => {
                        if (isAssigned) {
                          e.preventDefault();
                          return;
                        }
                        setSelectedResidentForDetails(resident);
                        setAssignmentWarning(null);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (isAssigned || isAssigning) return;
                          handleResidentToggle(resident.id, e.target.checked);
                        }}
                        disabled={isDisabled || isAssigned || isAssigning}
                        className="w-4 h-4 text-[#075b7d] border-gray-300 rounded focus:ring-2 focus:ring-[#075b7d] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {resident.name}
                          </span>
                          {isAssigned && (
                            <div className="flex items-center gap-1">
                              <Badge className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 font-normal">
                                Assigned{assignedMember ? ` to ${assignedMember.firstName || assignedMember.name}` : ''}
                              </Badge>
                              {!isDisabled && onUnassignResident && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-100 bg-red-50 rounded cursor-pointer flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleUnassign(resident);
                                  }}
                                  disabled={isUnassigning === resident.id}
                                  title="Unassign resident"
                                >
                                  {isUnassigning === resident.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <X className="w-3 h-3" />
                                  )}
                                  <span className="hidden sm:inline">
                                    {isUnassigning === resident.id ? 'Unassigning...' : 'Unassign'}
                                  </span>
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          Room {resident.room}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
                </>
              )}
            </div>
          </div>

          {/* Right Panel - Resident Details & Assignment */}
          <div className="w-full lg:w-1/2 overflow-y-auto bg-gray-50">
            <div className="p-4 sm:p-6">
              {selectedResidentForDetails ? (
                <div className="space-y-4 sm:space-y-6">
                  {/* Resident Details Header */}
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-1">
                      {selectedResidentForDetails.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Room {selectedResidentForDetails.room}
                    </p>
                  </div>

                  {/* Info Icon with Description */}
                  <div className="flex items-start space-x-2 text-sm text-gray-600">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>
                      Select a team member to assign this resident. The team
                      member will be able to view and work with this
                      resident's data.
                    </p>
                  </div>

                  {/* Warning Message Display */}
                  {assignmentWarning && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-amber-800">
                            {assignmentWarning}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resident Information */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    {selectedResidentForDetails.risks &&
                      selectedResidentForDetails.risks.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-gray-500">
                            Risks:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedResidentForDetails.risks.map((risk, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs"
                              >
                                {risk.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <Info className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      Select a resident from the list to view details and
                      assign to a team member
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-white">
          <div className="px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
            {/* Assignment Stats */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
              <div>
                <span className="text-gray-600">Assigned:</span>
                <span className="ml-2 font-semibold text-[#075b7d]">
                  {assignmentStats.assignedCount}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Unassigned:</span>
                <span className="ml-2 font-semibold text-gray-900">
                  {assignmentStats.unassignedCount}
                </span>
              </div>
              {selectedResidentsForBulkAssignment.size > 0 && (
                <div>
                  <span className="text-gray-600">Selected:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {selectedResidentsForBulkAssignment.size}
                  </span>
                </div>
              )}
            </div>

            {/* Bulk Assignment Controls */}
            {selectedResidentsForBulkAssignment.size > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  Assign {selectedResidentsForBulkAssignment.size} selected:
                </span>
                <Select
                  value={bulkAssignmentTeamMember}
                  onValueChange={setBulkAssignmentTeamMember}
                  disabled={isDisabled || isAssigning}
                >
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Select Team Member" />
                  </SelectTrigger>
                  <SelectContent>
                    {effectiveTeamMembers.map((member) => {
                      // Backend only accepts teamMemberUserId - skip members without it
                      if (!member.teamMemberUserId) return null;
                      
                      return (
                        <SelectItem
                          key={member._id || member.id}
                          value={member.teamMemberUserId}
                        >
                          {member.firstName || member.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleBulkAssignment}
                  disabled={!bulkAssignmentTeamMember || isDisabled || isAssigning}
                  size="sm"
                  className="bg-[#075b7d] hover:bg-[#064d63] text-white h-9 min-w-[80px]"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    "Assign"
                  )}
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Button
                onClick={handleClose}
                variant="outline"
                className="w-full sm:w-auto px-4 text-sm"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ResidentAssignmentModal.displayName = "ResidentAssignmentModal";

export default ResidentAssignmentModal;
