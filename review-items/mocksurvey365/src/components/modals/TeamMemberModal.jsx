import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { X, CheckSquare, Users } from "lucide-react";
import { toast } from "sonner";

/**
 * Reusable Team Member Modal Component
 * Used for adding and editing team members in both SurveyBuilder and SurveySetup
 */
const TeamMemberModal = ({
  // Modal state
  isOpen,
  onClose,
  
  // Form data
  memberData,
  onMemberDataChange,
  editingMemberId,
  
  // Role data
  availableRoles = [],
  roleMapping = {},
  getRoleName = (roleId) => roleId,
  
  // Task data
  facilityTasks = [],
  loadingTasks = false,
  
  // Team data for validation
  teamMembers = [],
  surveyData = {},
  
  // Callbacks
  onSubmit,
}) => {
  if (!isOpen) return null;

  // Handle task assignment change
  const handleTaskChange = (taskId, isAssigned) => {
    const currentTasks = memberData.assignedFacilityTasks || [];
    
    // Check if task already exists before adding (prevent duplicates)
    const taskAlreadyExists = currentTasks.some(t => 
      (typeof t === 'object' ? t._id : t) === taskId
    );
    
    let updatedTasks;
    if (isAssigned) {
      updatedTasks = taskAlreadyExists ? currentTasks : [...currentTasks, taskId];
    } else {
      updatedTasks = currentTasks.filter(t => 
        (typeof t === 'object' ? t._id : t) !== taskId
      );
    }
    
    onMemberDataChange("assignedFacilityTasks", updatedTasks);
  };

  // Select all available tasks
  const handleSelectAllTasks = () => {
    if (loadingTasks) {
      toast.info("Facility tasks are still loading", {
        position: "top-right",
      });
      return;
    }

    const availableTaskIds = facilityTasks
      .filter((task) => {
        // Don't include tasks assigned to other members
        return !teamMembers.some(
          (member) =>
            member.id !== editingMemberId &&
            member.assignedFacilityTasks &&
            member.assignedFacilityTasks.some(t => 
              (typeof t === 'object' ? t._id : t) === task._id
            )
        );
      })
      .map((task) => task._id);

    // Deduplicate with existing tasks
    const currentTasks = memberData.assignedFacilityTasks || [];
    const mergedTasks = [...new Set([
      ...currentTasks.map(t => typeof t === 'object' ? t._id : t),
      ...availableTaskIds
    ])];

    onMemberDataChange("assignedFacilityTasks", mergedTasks);
  };

  // Clear all tasks
  const handleClearAllTasks = () => {
    onMemberDataChange("assignedFacilityTasks", []);
  };

  // Get available tasks count
  const getAvailableTasksCount = () => {
    return facilityTasks.filter((task) => {
      return !teamMembers.some(
        (member) =>
          member.id !== editingMemberId &&
          member.assignedFacilityTasks &&
          member.assignedFacilityTasks.some(t => 
            (typeof t === 'object' ? t._id : t) === task._id
          )
      );
    }).length;
  };

  // Check if a task is assigned to current member
  const isTaskAssigned = (taskId) => {
    return (memberData.assignedFacilityTasks || []).some(t => 
      (typeof t === 'object' ? t._id : t) === taskId
    );
  };

  // Check if a task is assigned to another member
  const isTaskAssignedToOther = (taskId) => {
    return teamMembers.some(
      (member) =>
        member.id !== editingMemberId &&
        member.assignedFacilityTasks &&
        member.assignedFacilityTasks.some(t => 
          (typeof t === 'object' ? t._id : t) === taskId
        )
    );
  };

  // Get the member who has a task assigned
  const getTaskAssignedMember = (taskId) => {
    return teamMembers.find(
      (member) =>
        member.id !== editingMemberId &&
        member.assignedFacilityTasks &&
        member.assignedFacilityTasks.some(t => 
          (typeof t === 'object' ? t._id : t) === taskId
        )
    );
  };

  // Format task name for display
  const formatTaskName = (task) => {
    if (task && typeof task === 'object') {
      return task.title || task.name || "Unknown Task";
    }
    // If it's an ID, find the task
    const foundTask = facilityTasks.find((t) => t._id === task);
    return foundTask ? (foundTask.name || foundTask.title) : task;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingMemberId ? "Edit Team Member" : "Add Team Member"}
          </h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={memberData.name}
                onChange={(e) => onMemberDataChange("name", e.target.value)}
                placeholder="Enter team member name"
                className="h-10 text-sm rounded-lg"
              />
            </div>

            {/* Role Field */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Role <span className="text-red-500">*</span>
              </Label>
              <select
                value={memberData.role}
                onChange={(e) => onMemberDataChange("role", e.target.value)}
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d]"
              >
                <option value="">Select role</option>
                {availableRoles.map((role) => (
                  <option key={role._id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Email Field */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Email
              </Label>
              <Input
                type="email"
                value={memberData.email}
                onChange={(e) => onMemberDataChange("email", e.target.value)}
                placeholder="Enter email address"
                className={`h-10 text-sm rounded-lg ${editingMemberId ? "bg-gray-100 cursor-not-allowed" : ""}`}
                disabled={!!editingMemberId}
              />
            </div>

            {/* Phone Field */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Phone
              </Label>
              <Input
                type="tel"
                value={memberData.phone}
                onChange={(e) => onMemberDataChange("phone", e.target.value)}
                placeholder="Enter phone number"
                className="h-10 text-sm rounded-lg"
              />
            </div>

            {/* Specialization Field */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Specialization
              </Label>
              <Input
                value={memberData.specialization}
                onChange={(e) => onMemberDataChange("specialization", e.target.value)}
                placeholder="Enter specialization (optional)"
                className="h-10 text-sm rounded-lg"
              />
            </div>

            {/* Mandatory Facility Tasks Assignment */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium text-gray-700">
                  Assign Facility Tasks (Optional)
                </Label>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSelectAllTasks}
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    disabled={loadingTasks || facilityTasks.length === 0}
                  >
                    Select Available
                  </Button>
                  <Button
                    onClick={handleClearAllTasks}
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Task Availability Summary */}
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-xs text-blue-800">
                  <strong>Task Availability:</strong>{" "}
                  {loadingTasks
                    ? "Loading..."
                    : `${getAvailableTasksCount()} of ${facilityTasks.length} tasks available`}
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                {loadingTasks ? (
                  <p className="text-xs text-gray-600">Loading tasks...</p>
                ) : facilityTasks.length === 0 ? (
                  <p className="text-xs text-gray-600">
                    No facility tasks available to assign.
                  </p>
                ) : (
                  facilityTasks.map((task) => {
                    const isAssigned = isTaskAssigned(task._id);
                    const isAssignedToOther = isTaskAssignedToOther(task._id);
                    const assignedToMember = getTaskAssignedMember(task._id);

                    return (
                      <label
                        key={task._id}
                        className={`flex items-center space-x-2 p-2 rounded ${
                          isAssignedToOther
                            ? "bg-gray-100 cursor-not-allowed opacity-60"
                            : "cursor-pointer hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          disabled={isAssignedToOther}
                          onChange={(e) => handleTaskChange(task._id, e.target.checked)}
                          className="w-4 h-4 text-[#075b7d] border-gray-300 rounded focus:ring-[#075b7d] disabled:opacity-50"
                        />
                        <div className="flex-1">
                          <span
                            className={`text-sm ${
                              isAssignedToOther ? "text-gray-500" : "text-gray-700"
                            }`}
                          >
                            {task.name || task.title}
                          </span>
                          {isAssignedToOther && assignedToMember && (
                            <div className="text-xs text-gray-500 mt-1">
                              Already assigned to {assignedToMember.name}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              {/* Selected Tasks Summary */}
              {memberData.assignedFacilityTasks &&
                memberData.assignedFacilityTasks.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckSquare className="w-4 h-4 text-[#075b7d]" />
                      <span className="text-sm font-medium text-gray-800">
                        Selected Tasks ({memberData.assignedFacilityTasks.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {memberData.assignedFacilityTasks.map((task, idx) => {
                        const taskId = typeof task === 'object' ? (task._id || idx) : (task || idx);
                        return (
                          <Badge
                            key={taskId}
                            variant="outline"
                            className="text-xs bg-[#075b7d]/5 text-[#075b7d] border-[#075b7d]/20"
                          >
                            {formatTaskName(task)}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

              <p className="text-xs text-gray-500 mt-2">
                Select which facility tasks this member will be responsible for
              </p>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 flex justify-end space-x-3 p-6 pt-4 border-t border-gray-200 bg-white rounded-b-2xl">
          <Button onClick={onClose} variant="outline" className="px-4">
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!memberData.name || !memberData.role}
            className="px-4 bg-[#075b7d] hover:bg-[#075b7d] disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {editingMemberId ? "Update Member" : "Add Member"}
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Remove Team Member Confirmation Modal
 */
export const RemoveTeamMemberModal = ({
  isOpen,
  onClose,
  member,
  isTeamCoordinator,
  getRoleName = (roleId) => roleId,
  onConfirm,
}) => {
  if (!isOpen || !member) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Remove Team Member
          </h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            {isTeamCoordinator
              ? "Are you sure you want to remove the Team Coordinator? This will automatically assign a new Team Coordinator from the remaining members."
              : "Are you sure you want to remove this team member from the survey team?"}
          </p>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#075b7d]/10 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-[#075b7d]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  {member.name}
                  {isTeamCoordinator && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#075b7d]/10 text-[#075b7d]">
                      Team Coordinator
                    </span>
                  )}
                </h4>
                <p className="text-xs text-gray-600">
                  {getRoleName(member.role)}
                  {member.email && ` • ${member.email}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button onClick={onClose} variant="outline" className="px-4">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="px-4 bg-red-600 hover:bg-red-700 text-white"
          >
            Remove Member
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberModal;
