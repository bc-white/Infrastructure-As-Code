/**
 * Helper functions for investigations
 */

/**
 * Get current user from localStorage
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem("mocksurvey_user");
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      return null;
    }
  }
  return null;
};

/**
 * Get current user's assigned residents
 */
export const getCurrentUserAssignedResidents = () => {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return [];
  }
  return currentUser.assignedResidents || [];
};


export const isInvitedUser = (surveyData = null) => {
  const currentUser = getCurrentUser();
  
  if (!currentUser) return false;

  const currentSurveyId = localStorage.getItem("currentSurveyId");
  if (!currentSurveyId) {
    return false;
  }

  // If no surveyData provided, try to get it from localStorage or return false
  if (!surveyData) {
    // Try to get survey data from localStorage if available
    const storedSurveyData = localStorage.getItem("currentSurveyData");
    if (storedSurveyData) {
      try {
        surveyData = JSON.parse(storedSurveyData);
      } catch {
        // If we can't parse, fall back to checking user's invited flag
        return currentUser.invited === true || currentUser.invited === "true";
      }
    } else {
      // No survey data available, fall back to user's invited flag
      return currentUser.invited === true || currentUser.invited === "true";
    }
  }

  // Check if user is the creator - Creator is NOT an invited user (has full access)
  if (surveyData?.createdBy) {
    // Handle case where createdBy is populated object
    if (typeof surveyData.createdBy === 'object') {
      const creatorEmail = surveyData.createdBy.email?.toLowerCase()?.trim();
      const userEmail = currentUser.email?.toLowerCase()?.trim();

      if (creatorEmail && userEmail && creatorEmail === userEmail) {
        return false; // User is the creator, NOT invited
      }
      
      if (surveyData.createdBy._id && currentUser._id && surveyData.createdBy._id === currentUser._id) {
        return false; // User is the creator, NOT invited
      }
    } 
    // Handle case where createdBy is just an ID string
    else if (typeof surveyData.createdBy === 'string') {
      if (currentUser._id && surveyData.createdBy === currentUser._id) {
        return false; // User is the creator, NOT invited
      }
    }
  }

  // Check if user is in teamMembers array
  if (surveyData?.teamMembers && Array.isArray(surveyData.teamMembers) && surveyData.teamMembers.length > 0) {
    const userEmail = currentUser.email?.toLowerCase()?.trim();
    const member = surveyData.teamMembers.find(m => m.email?.toLowerCase()?.trim() === userEmail);

    if (member) {
      // If user is a team coordinator, they are NOT invited (have full access)
      // If user is NOT a team coordinator, they ARE invited (limited access)
      return !member.teamCoordinator;
    }
  }

  // Check team coordinator email
  const coordinatorEmail = surveyData?.teamCoordinator;

  // If there's no team coordinator set, default to false (not invited)
  if (!coordinatorEmail) return false;

  // Check if current user's email matches the team coordinator email
  const userEmail = currentUser.email?.toLowerCase()?.trim();
  const coordinatorEmailLower = coordinatorEmail?.toLowerCase()?.trim();

  // If emails match, user is the team coordinator (NOT invited)
  if (userEmail && coordinatorEmailLower && userEmail === coordinatorEmailLower) {
    return false;
  }

  // If emails don't match, user is invited (not the team coordinator)
  return true;
};

/**
 * Get current user name
 */
export const getCurrentUserName = () => {
  const currentUser = getCurrentUser();
  return currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
    : "Unknown User";
};

/**
 * Get current user ID
 */
export const getCurrentUserId = () => {
  const currentUser = getCurrentUser();
  return currentUser?._id || null;
};

/**
 * Get survey ID from surveyData or localStorage
 */
export const getSurveyId = (surveyData) => {
  return surveyData?.surveyId || localStorage.getItem("currentSurveyId");
};

/**
 * Calculate scope and severity based on probe outcomes
 */
export const calculateScopeSeverity = (investigation) => {
  const completedProbes = investigation.completedProbes || [];
  const totalProbes = investigation.requiredProbes?.length || 0;

  if (completedProbes.length === 0) {
    return {
      scope: null,
      severity: null,
      reasoning: "No probes completed yet",
    };
  }

  // Calculate compliance percentage
  const metProbes = completedProbes.filter((probe) => probe.outcome === "Met").length;
  const compliancePercentage = (metProbes / totalProbes) * 100;

  // Determine scope based on resident count and pattern
  let scope = "Isolated";
  if (investigation.relatedResidents && investigation.relatedResidents.length > 1) {
    scope = investigation.relatedResidents.length <= 3 ? "Pattern" : "Widespread";
  }

  // Determine severity based on compliance and outcomes
  let severity = "No Harm";
  if (compliancePercentage < 50) {
    severity = "Actual Harm";
  } else if (compliancePercentage < 75) {
    severity = "Minimal Harm";
  } else if (compliancePercentage < 90) {
    severity = "No Harm";
  }

  // Escalate severity based on critical outcomes
  if (
    investigation.observations?.some((obs) => obs.criticalOutcome) ||
    investigation.interviews?.some((int) => int.criticalFinding)
  ) {
    severity = severity === "No Harm" ? "Minimal Harm" : severity;
  }

  return {
    scope,
    severity,
    compliancePercentage,
    reasoning: `Based on ${compliancePercentage.toFixed(1)}% compliance and ${scope.toLowerCase()} pattern`,
  };
};

/**
 * Generate deficiency draft based on investigation data
 */
export const generateDeficiencyDraft = (investigation) => {
  const fTag = investigation.fTag;
  const careArea = investigation.careArea;
  const scope = investigation.scope;
  const severity = investigation.severity;

  const regulatorySummary = "";

  // Generate narrative based on probe outcomes
  const failedProbes =
    investigation.completedProbes?.filter((probe) => probe.outcome === "Not Met") || [];
  const evidenceSummary = investigation.observations
    ?.map((obs) => `${obs.type} on ${new Date(obs.timestamp).toLocaleDateString()}`)
    .join(", ");

  const narrative = `Based on observation, interview, and record review, the facility failed to ${careArea.toLowerCase()} for Resident ${
    investigation.residentId
  }. This deficient practice resulted in ${severity.toLowerCase()} for ${
    scope === "Isolated" ? "1" : scope === "Pattern" ? "multiple" : "numerous"
  } resident(s) reviewed.

${regulatorySummary}

Evidence includes: ${evidenceSummary || "documentation review and staff interviews"}.`;

  return {
    fTag,
    careArea,
    scope,
    severity,
    regulatorySummary,
    narrative,
    evidence: {
      observations: investigation.observations || [],
      interviews: investigation.interviews || [],
      recordReview: investigation.recordReview || [],
      attachments: investigation.attachments || [],
    },
    completedAt: new Date().toISOString(),
  };
};

/**
 * Get status display text for task statuses
 */
export const getStatusDisplayText = (status) => {
  const statusMap = {
    pending: "Pending",
    in_progress: "In Progress",
    pending_review: "Pending Review",
    completed: "Completed",
    approved: "Approved",
    rejected: "Rejected",
  };
  return statusMap[status] || status;
};

/**
 * Filter residents based on search term and status filter
 */
export const filterResidents = (residents, searchTerm, statusFilter) => {
  return residents.filter((resident) => {
    const matchesSearch = resident.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || resident.investigationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });
};

/**
 * Filter investigations for a specific resident
 */
export const getInvestigationsForResident = (investigations, residentId) => {
  return investigations.filter((inv) => inv.residentId === residentId);
};

/**
 * Check if survey is closed
 */
export const isSurveyClosed = (surveyData) => {
  return surveyData?.status === "closed" || surveyData?.isClosed === true;
};
