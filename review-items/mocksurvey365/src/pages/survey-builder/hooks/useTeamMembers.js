import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";

/**
 * Custom hook for managing team members
 * Separates team member logic from UI components
 */
export const useTeamMembers = (initialMembers = []) => {
  const [teamMembers, setTeamMembers] = useState(initialMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  // Filtered team members
  const filteredTeamMembers = useMemo(() => {
    let filtered = teamMembers;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (member) =>
          member.name?.toLowerCase().includes(query) ||
          member.email?.toLowerCase().includes(query) ||
          member.role?.toLowerCase().includes(query)
      );
    }

    // Apply role filter
    if (filter !== "all") {
      filtered = filtered.filter((member) => member.role === filter);
    }

    return filtered;
  }, [teamMembers, searchQuery, filter]);

  // Add team member
  const addTeamMember = useCallback((member) => {
    setTeamMembers((prev) => [...prev, member]);
    toast.success("Team member added successfully");
  }, []);

  // Remove team member
  const removeTeamMember = useCallback((memberId) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
    toast.success("Team member removed");
  }, []);

  // Update team member
  const updateTeamMember = useCallback((memberId, updates) => {
    setTeamMembers((prev) =>
      prev.map((member) =>
        member.id === memberId ? { ...member, ...updates } : member
      )
    );
    toast.success("Team member updated");
  }, []);

  // Set team coordinator
  const setTeamCoordinator = useCallback((memberId) => {
    setTeamMembers((prev) =>
      prev.map((member) => ({
        ...member,
        isCoordinator: member.id === memberId,
      }))
    );
    toast.success("Team coordinator updated");
  }, []);

  // Export team members
  const exportTeamMembers = useCallback(() => {
    const csv = [
      ["Name", "Email", "Role", "Assigned Tasks"].join(","),
      ...teamMembers.map((member) =>
        [
          member.name || "",
          member.email || "",
          member.role || "",
          member.assignedTasks?.join("; ") || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `team-members-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }, [teamMembers]);

  return {
    teamMembers,
    setTeamMembers,
    filteredTeamMembers,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    addTeamMember,
    removeTeamMember,
    updateTeamMember,
    setTeamCoordinator,
    exportTeamMembers,
  };
};

