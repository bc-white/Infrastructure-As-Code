import React from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

const TeamMemberManagementModal = ({
  isOpen,
  onClose,
  teamMemberSubmissions = [],
  getStatusDisplayText,
  handleTeamMemberApproval,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">
            Team Member Submissions
          </h2>
          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
        </div>

        {/* Team Member Submissions List */}
        <div className="space-y-4">
          {teamMemberSubmissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No team member submissions yet.</p>
            </div>
          ) : (
            teamMemberSubmissions.map((submission) => (
              <div
                key={submission.teamMemberId || submission.userId}
                className="border rounded-lg p-4 space-y-4"
              >
                {/* Team Member Info */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {submission.teamMemberName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {submission.teamMemberEmail}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${
                      submission.approvalStatus === "approved"
                        ? "text-green-600 border-green-600"
                        : submission.approvalStatus === "rejected"
                        ? "text-red-600 border-red-600"
                        : "text-yellow-600 border-yellow-600"
                    }`}
                  >
                    {getStatusDisplayText
                      ? getStatusDisplayText(
                          submission.approvalStatus === "pending"
                            ? "pending_review"
                            : submission.taskStatus || "pending_review"
                        )
                      : submission.taskStatus || "Pending"}
                  </Badge>
                </div>

                {/* Work Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm font-medium text-gray-700">
                      Assigned Residents
                    </p>
                    <p className="text-lg font-semibold">
                      {submission.workSummary?.totalAssigned || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm font-medium text-gray-700">
                      Completed Investigations
                    </p>
                    <p className="text-lg font-semibold">
                      {submission.workSummary?.completedInvestigations || 0}
                    </p>
                  </div>
                </div>

                {/* Assigned Residents */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Assigned Residents:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {submission.residents?.map((resident) => (
                      <Badge
                        key={resident.id}
                        variant="outline"
                        className="text-xs"
                      >
                        {resident.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Investigations */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Investigations:
                  </h4>
                  <div className="space-y-2">
                    {submission.investigations?.map((investigation) => (
                      <div
                        key={investigation.id}
                        className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-sm"
                      >
                        <div className="flex gap-4 mb-3">
                          <div className="bg-gray-100 px-3 py-1 rounded-md">
                            <p className="font-medium text-gray-800">
                              Status: {investigation.status}
                            </p>
                          </div>
                          <div className="bg-gray-100 px-3 py-1 rounded-md">
                            <p className="font-medium text-gray-800">
                              Care Area: {investigation.careArea}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-md border border-gray-200">
                          <p className="font-medium mb-2 text-gray-800">
                            Completed Probes:
                          </p>
                          <div className="max-h-40 overflow-y-auto scrollbar-hide">
                            {investigation.completedProbes
                              ?.filter(
                                (probe) =>
                                  probe && probe.name && probe.name.trim() !== ""
                              )
                              .map((probe, index) => (
                                <div
                                  key={index}
                                  className="bg-gray-50 p-2 rounded mb-2 border-l-4 border-gray-400"
                                >
                                  <div className="flex flex-wrap gap-2">
                                    <span className="font-medium text-gray-800">
                                      {probe.name}
                                    </span>
                                    <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                                      Outcome: {probe.outcome}
                                    </span>
                                    <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                                      F-Tag: {probe.ftag}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                {submission.taskStatus === "completed" && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={() =>
                        handleTeamMemberApproval(
                          submission.teamMemberId || submission.userId,
                          "approved"
                        )
                      }
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => {
                        const notes = prompt(
                          "Enter rejection notes (optional):"
                        );
                        handleTeamMemberApproval(
                          submission.teamMemberId || submission.userId,
                          "rejected",
                          notes || ""
                        );
                      }}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      size="sm"
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamMemberManagementModal;
