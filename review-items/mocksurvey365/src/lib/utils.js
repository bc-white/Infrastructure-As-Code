import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind class names, resolving any conflicts.
 *
 * @param inputs - An array of class names to merge.
 * @returns A string of merged and optimized class names.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Get a team member by their ID or User ID from a list of team members.
 * 
 * @param {Array} teamMembers - The list of team members to search.
 * @param {string|Object} id - The ID to search for (can be teamMemberId or teamMemberUserId).
 * @returns {Object|null} The found team member or null.
 */
export function getTeamMemberById(teamMembers, id) {
  if (!teamMembers || !Array.isArray(teamMembers) || !id) return null;
  
  const searchId = typeof id === 'object' ? (id._id || id.id) : id;
  const searchIdStr = String(searchId);

  return teamMembers.find(member => {
    // Check against member.id (which we mapped to teamMemberUserId in SampleSelection)
    if (member.id && String(member.id) === searchIdStr) return true;
    
    // Check against raw _id if available
    if (member._id && String(member._id) === searchIdStr) return true;
    
    // Check against teamMemberUserId if available in the member object
    if (member.teamMemberUserId) {
      const memberUserId = typeof member.teamMemberUserId === 'object' 
        ? (member.teamMemberUserId._id || member.teamMemberUserId.id) 
        : member.teamMemberUserId;
      if (String(memberUserId) === searchIdStr) return true;
    }
    
    return false;
  }) || null;
}
