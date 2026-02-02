import React from "react";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";

const ProbeEditModal = ({
  isOpen,
  onClose,
  editingProbe,
  probeEditData,
  setProbeEditData,
  handleProbeFileUpload,
  uploadingFiles,
  saveProbeEdit,
}) => {
  if (!isOpen || !editingProbe) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Probe</h3>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
          >
            ✕
          </Button>
        </div>

        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">
              {editingProbe.probe.name}
            </h4>
            <p className="text-sm text-gray-600">
              {editingProbe.probe.description}
            </p>
            <div className="text-xs text-gray-500 mt-2">
              <strong>Evidence required:</strong>{" "}
              {editingProbe.probe.evidenceTypes.join(", ")}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Outcome *
              </Label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                value={probeEditData.outcome}
                onChange={(e) =>
                  setProbeEditData((prev) => ({
                    ...prev,
                    outcome: e.target.value,
                  }))
                }
              >
                <option value="">Select Outcome</option>
                <option value="Met">Met</option>
                <option value="Not Met">Not Met</option>
                <option value="NA">N/A</option>
              </select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Evidence Text
              </Label>
              <textarea
                placeholder="Brief evidence notes (e.g., observation, interview)"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none"
                value={probeEditData.evidence}
                onChange={(e) =>
                  setProbeEditData((prev) => ({
                    ...prev,
                    evidence: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Additional Notes
            </Label>
            <textarea
              placeholder="Additional notes about this probe assessment..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none"
              value={probeEditData.notes}
              onChange={(e) =>
                setProbeEditData((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Evidence Files (Optional)
            </Label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
              onChange={async (e) => {
                const files = Array.from(e.target.files);
                if (files.length > 0) {
                  const uploadedFiles = await handleProbeFileUpload(files);
                  setProbeEditData((prev) => ({
                    ...prev,
                    files: [...prev.files, ...uploadedFiles],
                  }));
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm"
              disabled={uploadingFiles}
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload supporting documents (PDFs, images, spreadsheets)
            </p>

            {/* Display uploaded files */}
            {probeEditData.files && probeEditData.files.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-xs font-medium text-gray-700 mb-2">
                  Uploaded Files ({probeEditData.files.length})
                </div>
                {probeEditData.files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-600">📄</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {file.fileName}
                        </div>
                        <div className="text-gray-500">
                          {file.uploadedBy && `Uploaded by ${file.uploadedBy}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {file.fileUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(file.fileUrl, "_blank")}
                          className="h-5 px-2 text-xs text-blue-600"
                          title="View file"
                        >
                          View
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setProbeEditData((prev) => ({
                            ...prev,
                            files: prev.files.filter((_, i) => i !== index),
                          }));
                        }}
                        className="h-5 w-5 p-0 text-red-600"
                        title="Remove file"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={saveProbeEdit}
              disabled={!probeEditData.outcome || uploadingFiles}
              className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300"
            >
              {uploadingFiles ? "Uploading..." : "Save Probe"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProbeEditModal;
