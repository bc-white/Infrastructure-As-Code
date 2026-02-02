import React from "react";


const ResidentListItem = ({
  resident,
  isSelected = false,
  onClick,
  assignedTeamMember = null,
  className = "",
}) => {
  if (!resident) {
    return null;
  }


  return (
    <div
      onClick={onClick}
      className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 break-words">
            {resident.name}
          </h3>

          <div className="flex flex-wrap gap-2">
            {resident.risks?.length > 0 ? (
              resident.risks.slice(0, 3).map((risk, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded"
                >
                  {risk.name}
                </span>
              ))
            ) : resident.specialTypes?.length > 0 ? (
              resident.specialTypes.slice(0, 3).map((type, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded"
                >
                  {type}
                </span>
              ))
            ) : null}
            
            {resident.risks?.length > 3 && (
              <span className="px-2 py-1 text-xs font-medium text-gray-500">
                +{resident.risks.length - 3} more
              </span>
            )}
          </div>
          
          {assignedTeamMember && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500">Assigned to:</span>
              <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                {assignedTeamMember.name}
                {assignedTeamMember.roleName && ` (${assignedTeamMember.roleName})`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResidentListItem;
