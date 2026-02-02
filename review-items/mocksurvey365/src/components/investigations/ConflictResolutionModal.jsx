import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

/**
 * ConflictResolutionModal - Displays data conflicts detected during team collaboration
 * 
 * @param {boolean} isOpen - Whether the modal is open
 * @param {Function} onClose - Function to close the modal
 * @param {Array} conflicts - Array of conflict objects
 * @param {Array} residents - Array of resident objects (for displaying names)
 */
const ConflictResolutionModal = ({ isOpen, onClose, conflicts = [], residents = [] }) => {
  if (!conflicts || conflicts.length === 0) {
    return null;
  }


  // Get resident name by ID
  const getResidentName = (residentId) => {
    const resident = residents.find((r) => String(r.id) === String(residentId));
    return resident?.name || `Resident ${residentId}`;
  };

  // Get probe title by resident ID and probe index
  const getProbeTitle = (residentId, probeIndex) => {
    const resident = residents.find((r) => String(r.id) === String(residentId));
    const probe = resident?.investigations?.[probeIndex];
    return probe?.title || `Investigation ${probeIndex + 1}`;
  };

  // Format conflict type for display
  const formatConflictType = (type) => {
    const types = {
      ce_pathway_answer: 'CE Pathway Answer',
      surveyor_status: 'Surveyor Status',
      overall_notes: 'Overall Notes',
    };
    return types[type] || type;
  };

  // Format value for display
  const formatValue = (value) => {
    if (value === null || value === undefined) return 'Not set';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'string' && value.trim() === '') return 'Empty';
    return String(value);
  };

  // Filter out conflicts where local value is empty
  const filteredConflicts = conflicts.filter((conflict) => {
    const localValue = conflict.localValue;
    // Skip if local value is null, undefined, empty string, or empty after trim
    if (localValue === null || localValue === undefined) return false;
    if (typeof localValue === 'string' && localValue.trim() === '') return false;
    if (localValue === '') return false;
    return true;
  });

  // Don't show modal if no conflicts after filtering
  if (filteredConflicts.length === 0) {
    return null;
  }

  // Re-group filtered conflicts by resident
  const conflictsByResident = filteredConflicts.reduce((acc, conflict) => {
    const residentId = conflict.residentId;
    if (!acc[residentId]) {
      acc[residentId] = [];
    }
    acc[residentId].push(conflict);
    return acc;
  }, {});

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Data Conflicts Detected
            </DialogTitle>
            <DialogDescription className="text-gray-600 mt-1">
              {filteredConflicts.length} conflict(s) were automatically resolved. Your changes were preserved.
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Automatic Resolution Applied
                </h3>
                <p className="text-sm text-blue-700">
                  Your local changes have been preserved, and server updates have been merged intelligently.
                  Review the details below to see what was changed.
                </p>
              </div>
            </div>

            {/* Conflicts by Resident */}
            {Object.entries(conflictsByResident).map(([residentId, residentConflicts]) => (
              <div
                key={residentId}
                className="rounded-lg p-4 bg-white"
              >
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-semibold text-gray-900">
                    {getResidentName(residentId)}
                  </h3>
                  <Badge variant="secondary" className="ml-auto">
                    {residentConflicts.length} conflict(s)
                  </Badge>
                </div>

                <div className="space-y-4">
                  {residentConflicts.map((conflict, index) => (
                    <div
                      key={index}
                      className="pl-4 py-2 bg-yellow-50 rounded"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {formatConflictType(conflict.type)}
                        </Badge>
                        {conflict.probeIndex !== undefined && (
                          <span className="text-sm text-gray-600">
                            • {getProbeTitle(residentId, conflict.probeIndex)}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        {/* Local Value */}
                        <div className="bg-white rounded p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-xs font-semibold text-gray-700 uppercase">
                              Your Value (Preserved)
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 font-medium">
                            {formatValue(conflict.localValue)}
                          </div>
                        </div>

                        {/* Server Value */}
                        <div className="bg-white rounded p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-xs font-semibold text-gray-700 uppercase">
                              Server Value (Merged)
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 font-medium">
                            {formatValue(conflict.serverValue)}
                          </div>
                        </div>
                      </div>

                      {/* Additional details for notes */}
                      {conflict.type === 'overall_notes' && (
                        <div className="mt-3 text-xs text-gray-500">
                          Note: Both notes have been combined to preserve all information.
                        </div>
                      )}

                      {/* Additional details for CE pathway answers */}
                      {conflict.type === 'ce_pathway_answer' && (
                        <div className="mt-3 text-xs text-gray-500">
                          Question: {conflict.category} • {conflict.questionKey}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Info Footer */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1">How conflicts are resolved:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Your local changes are always preserved</li>
                  <li>Server updates are merged intelligently with your changes</li>
                  <li>Notes from both sources are combined</li>
                  <li>CE Pathway answers use timestamp-based resolution</li>
                </ul>
              </div>
            </div>
          </div>
        </DialogBody>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} className="bg-[#075b7d] hover:bg-[#075b7d]/90">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConflictResolutionModal;

