import { useState, useCallback } from 'react';
import { toast } from "sonner";

/**
 * Hook to manage Probes and Critical Element Pathways logic.
 * Handles state for probe editing, CE pathway assessment, and updating investigations with probe outcomes.
 */
export const useInvestigationPathways = ({
  investigations,
  setInvestigations,
  currentUserName,
  currentUserId,
  onSave, // Function to persist changes (updateInvestigationsInSurveyData)
  onEditStart, // Function to mark investigation as being edited
  onEditEnd, // Function to mark investigation as done editing (optional)
  userAPI // API service for file uploads
}) => {
  // Phase 2 features state
  const [showProbeEditModal, setShowProbeEditModal] = useState(false);
  const [editingProbe, setEditingProbe] = useState(null);
  const [probeEditData, setProbeEditData] = useState({
    outcome: "",
    evidence: "",
    notes: "",
    files: [],
  });
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // CE Pathway Assessment state
  const [selectedCEPathway, setSelectedCEPathway] = useState(null);
  const [pathwayAnswers, setPathwayAnswers] = useState({});
  const [pathwayQuestionChecks, setPathwayQuestionChecks] = useState({});
  const [pathwayQuestionNotes, setPathwayQuestionNotes] = useState({});
  const [selectedProbeForCE, setSelectedProbeForCE] = useState(null);

  // Add probe outcome
  const addProbeOutcome = useCallback((
    investigationId,
    probeId,
    outcome,
    evidence,
    notes,
    files = []
  ) => {
    if (onEditStart) onEditStart(investigationId);

    const investigation = investigations.find(
      (inv) => inv.id === investigationId
    );
    if (!investigation) return;

    const probe = investigation.requiredProbes?.find((p) => p.id === probeId);
    if (!probe) return;

    const probeOutcome = {
      id: probeId,
      name: probe.name,
      description: probe.description,
      ftag: probe.ftag,
      outcome,
      evidence,
      evidenceFiles: files,
      notes,
      completedAt: new Date().toISOString(),
      completedBy: currentUserName,
      completedById: currentUserId,
    };

    const updatedInvestigations = investigations.map((inv) => {
      if (inv.id === investigationId) {
        const existingProbes = inv.completedProbes || [];
        const updatedProbes = existingProbes.filter((p) => p.id !== probeId);
        updatedProbes.push(probeOutcome);

        return {
          ...inv,
          completedProbes: updatedProbes,
          status: inv.status || "In Progress",
        };
      }
      return inv;
    });

    setInvestigations(updatedInvestigations);
    if (onSave) onSave(updatedInvestigations);
    if (onEditEnd) onEditEnd();

    toast.success(`Probe "${probe.name}" marked as ${outcome}`);
  }, [investigations, setInvestigations, currentUserName, currentUserId, onSave, onEditStart, onEditEnd]);

  // Edit probe outcome
  const editProbeOutcome = useCallback((
    investigationId,
    probeId,
    outcome,
    evidence,
    notes,
    files = []
  ) => {
    if (onEditStart) onEditStart(investigationId);

    const investigation = investigations.find(
      (inv) => inv.id === investigationId
    );
    if (!investigation) return;

    const probe = investigation.requiredProbes?.find((p) => p.id === probeId);
    if (!probe) return;

    const updatedInvestigations = investigations.map((inv) => {
      if (inv.id === investigationId) {
        const existingProbes = inv.completedProbes || [];
        const existingProbeIndex = existingProbes.findIndex(
          (p) => p.id === probeId
        );

        let updatedProbes;
        if (existingProbeIndex >= 0) {
          // Update existing probe
          updatedProbes = existingProbes.map((p) =>
            p.id === probeId
              ? {
                  ...p,
                  name: probe.name,
                  description: probe.description,
                  ftag: probe.ftag,
                  outcome,
                  evidence,
                  evidenceFiles: files.length > 0 ? files : p.evidenceFiles || [],
                  notes,
                  updatedAt: new Date().toISOString(),
                  updatedBy: currentUserName,
                  updatedById: currentUserId,
                }
              : p
          );
        } else {
          // Add new probe to completedProbes
          const newProbe = {
            id: probeId,
            name: probe.name,
            description: probe.description,
            ftag: probe.ftag,
            outcome,
            evidence: evidence || [],
            evidenceFiles: files || [],
            notes: notes || "",
            completedAt: new Date().toISOString(),
            completedBy: currentUserName,
            completedById: currentUserId,
            updatedAt: new Date().toISOString(),
            updatedBy: currentUserName,
            updatedById: currentUserId,
          };
          updatedProbes = [...existingProbes, newProbe];
        }

        return {
          ...inv,
          completedProbes: updatedProbes,
          status: inv.status || "In Progress",
        };
      }
      return inv;
    });

    setInvestigations(updatedInvestigations);
    if (onSave) onSave(updatedInvestigations);
    if (onEditEnd) onEditEnd();

    toast.success(`Probe "${probe.name}" updated to ${outcome}`);
  }, [investigations, setInvestigations, currentUserName, currentUserId, onSave, onEditStart, onEditEnd]);

  // Open probe edit modal
  const openProbeEditModal = useCallback((investigationId, probeId) => {
    const investigation = investigations.find(
      (inv) => inv.id === investigationId
    );
    if (!investigation) return;

    const probe = investigation.requiredProbes?.find((p) => p.id === probeId);
    if (!probe) return;

    const completedProbe = investigation.completedProbes?.find(
      (p) => p.id === probeId
    );

    setEditingProbe({
      investigationId,
      probeId,
      probe,
      completedProbe,
    });

    setProbeEditData({
      outcome: completedProbe?.outcome || "",
      evidence: completedProbe?.evidence?.join(", ") || "",
      notes: completedProbe?.notes || "",
      files: completedProbe?.evidenceFiles || [],
    });

    setShowProbeEditModal(true);
  }, [investigations]);

  // Handle file upload for probe evidence
  const handleProbeFileUpload = useCallback(async (files) => {
    if (!files || files.length === 0) return [];

    setUploadingFiles(true);
    const uploadedFiles = [];

    try {
      for (const file of files) {
        const uploadToast = toast.loading(`Uploading ${file.name}...`);

        try {
          const response = await userAPI.uploadFile(file);

          if ((response.status || response.success) && response.data) {
            const fileUrl =
              typeof response.data === "string"
                ? response.data
                : response.data.url;

            uploadedFiles.push({
              fileName: file.name,
              fileUrl: fileUrl,
              uploadedAt: new Date().toISOString(),
              uploadedBy: currentUserName,
              uploadedById: currentUserId,
            });
            toast.dismiss(uploadToast);
            toast.success(`${file.name} uploaded successfully`);
          } else {
            throw new Error(response.message || "Upload failed");
          }
        } catch (error) {
          toast.dismiss(uploadToast);
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
        }
      }
    } catch (error) {
      // General error handling
    } finally {
      setUploadingFiles(false);
    }

    return uploadedFiles;
  }, [userAPI, currentUserName, currentUserId]);

  // Save probe edit
  const saveProbeEdit = useCallback(async () => {
    if (!editingProbe || !probeEditData.outcome) {
      toast.error("Please select an outcome");
      return;
    }

    const evidence = probeEditData.evidence
      ? probeEditData.evidence
          .split(",")
          .map((e) => e.trim())
          .filter((e) => e)
      : [];

    if (editingProbe.completedProbe) {
      editProbeOutcome(
        editingProbe.investigationId,
        editingProbe.probeId,
        probeEditData.outcome,
        evidence,
        probeEditData.notes,
        probeEditData.files
      );
    } else {
      addProbeOutcome(
        editingProbe.investigationId,
        editingProbe.probeId,
        probeEditData.outcome,
        evidence,
        probeEditData.notes,
        probeEditData.files
      );
    }

    setShowProbeEditModal(false);
    setEditingProbe(null);
    setProbeEditData({ outcome: "", evidence: "", notes: "", files: [] });
  }, [editingProbe, probeEditData, editProbeOutcome, addProbeOutcome]);

  return {
    // State
    showProbeEditModal,
    setShowProbeEditModal,
    editingProbe,
    setEditingProbe,
    probeEditData,
    setProbeEditData,
    uploadingFiles,
    selectedCEPathway,
    setSelectedCEPathway,
    pathwayAnswers,
    setPathwayAnswers,
    pathwayQuestionChecks,
    setPathwayQuestionChecks,
    pathwayQuestionNotes,
    setPathwayQuestionNotes,
    selectedProbeForCE,
    setSelectedProbeForCE,

    // Methods
    openProbeEditModal,
    handleProbeFileUpload,
    saveProbeEdit,
    addProbeOutcome,
    editProbeOutcome
  };
};
