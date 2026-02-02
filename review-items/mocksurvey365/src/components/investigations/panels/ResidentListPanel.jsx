import React from "react";
import { Badge } from "../../ui/badge";

/**
 * Left Panel: Resident List & Assignment
 * Displays list of residents with filtering and search capabilities
 */
const ResidentListPanel = ({
  viewMode,
  setViewMode,
  searchTerm,
  setSearchTerm,
  filteredResidents,
  selectedResident,
  selectedResidents,
  handleResidentSelect,
  getResidentInvestigations,
  getCEPathwayRecommendations,
  surveyData,
}) => {


  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-2xl p-6 border border-gray-200 lg:sticky lg:top-4 lg:h-[calc(100vh-120px)] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Resident List & Assignment
          </h3>
        </div>

        {/* View Mode Toggle */}
        <div className="flex space-x-1 mb-4 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setViewMode("byResident")}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
              viewMode === "byResident"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            By Resident
          </button>
         
        </div>

        {/* Search & Filters */}
        <div className="mb-4 space-y-3">
          <div className="relative">
            <input
              placeholder="Search residents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
          </div>
        </div>

        {/* Resident List */}
        <div className="space-y-3 flex-1 overflow-y-auto pr-2 scrollbar-hide">
          {filteredResidents.map((resident) => {
            const residentInvestigations = getResidentInvestigations(resident.id);
            const riskRecommendations = getCEPathwayRecommendations(resident);
            const isSelected = selectedResidents.has(resident.id);

            return (
              <div
                key={resident.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedResident?.id === resident.id
                    ? "border-gray-400 bg-gray-50"
                    : isSelected
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleResidentSelect(resident)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600">
                        {resident.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {resident.name}
                      </div>
                      
                     
                    </div>
                  </div>
                </div>

                {/* Investigation Count */}
                {residentInvestigations.length > 0 && (
                  <div className="mb-2">
                    <Badge variant="outline" className="text-xs">
                      {residentInvestigations.length} Investigation
                      {residentInvestigations.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                )}

                {/* Risk Recommendations */}
                {riskRecommendations.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs text-gray-600 mb-1">
                      Risk Recommendations
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {riskRecommendations.slice(0, 2).map((rec, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs text-gray-700 border-gray-300"
                        >
                          {rec.name}
                        </Badge>
                      ))}
                      {riskRecommendations.length > 2 && (
                        <Badge
                          variant="outline"
                          className="text-xs text-gray-700 border-gray-300"
                        >
                          +{riskRecommendations.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Risk Factors */}
                <div className="flex flex-wrap gap-1">
                  {resident.specialTypes?.slice(0, 3).map((type, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                  {resident.specialTypes?.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{resident.specialTypes.length - 3}
                    </Badge>
                  )}
                </div>
                <div className="mt-2">
                {resident.id &&
                        (() => {
                          const assignedMember = surveyData?.teamMembers?.find((m) =>
                            m.assignedResidents.includes(resident.id)
                          );
                          return assignedMember ? (
                            <small className="text-xs bg-[#075b7d] text-white border-0 mt-1 p-1 rounded-md">
                              Assigned to: {assignedMember.name}
                            </small>
                          ) : null;
                        })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResidentListPanel;
