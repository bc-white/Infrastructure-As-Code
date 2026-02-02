import React from "react";

/**
 * Reusable component for displaying Resident Information & Investigation Status
 * @param {Object} props
 * @param {Object} props.resident - Resident object containing all resident and investigation data
 * @param {Object} props.assignedTeamMember - Team member assigned to this resident
 * @param {string} props.className - Additional CSS classes
 */
const ResidentInfoCard = ({ resident, assignedTeamMember = null, className = "" }) => {
  if (!resident) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 mb-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Resident Information & Investigation Status
      </h3>
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column - Resident Information */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Risks
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {resident.risks?.length > 0 ? (
                resident.risks.map((risk, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded"
                  >
                    {risk.name}
                  </span>
                ))
              ) : resident.specialTypes?.length > 0 ? (
                resident.specialTypes.slice(0, 3).map((type, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded"
                  >
                    {type}
                  </span>
                ))
              ) : null}
            </div>
          </div>
        </div>

        {/* Right Column - Investigation Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Included in Pool</span>
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                resident.included ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
              }`}
            >
              {resident.included ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Probes</span>
            <span className="text-sm font-medium text-gray-900">
              {resident.investigations?.length || 0}
            </span>
          </div> 
          {assignedTeamMember && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Assigned Team Member</span>
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">
                  {assignedTeamMember.name}
                </span>
                {assignedTeamMember.roleName && (
                  <span className="text-xs text-gray-500">
                    {assignedTeamMember.roleName}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResidentInfoCard;
