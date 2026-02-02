import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { DataTable } from "../components/data-table";
import { DateRangePicker } from "../components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogBody,
} from "../components/ui/dialog";
import { useAuth } from "../contexts/AuthContext";
import { surveyAPI } from "../service/api";
import { 
  BarChart3, 
  TrendingUp, 
  Building2, 
  FileText, 
  Calendar,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  ArrowUpDown,
  Loader2,
  Download,
  Eye,
  StickyNote,
  Package,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";

const Reports = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("30 days");
  const [selectedTab, setSelectedTab] = useState("Citation Reports");
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined
  });
  const [pendingDateRange, setPendingDateRange] = useState({
    from: undefined,
    to: undefined
  });
  const [apiFilters, setApiFilters] = useState({
    page: 1,
    limit: 25
  });
  const [filtersCleared, setFiltersCleared] = useState(false);
  
  // Survey Notes state
  const [surveyNotesData, setSurveyNotesData] = useState([]);
  const [surveyNotesLoading, setSurveyNotesLoading] = useState(false);
  
  // Loads state
  const [loadsData, setLoadsData] = useState([]);
  const [loadsLoading, setLoadsLoading] = useState(false);
  
  // Survey Notes Preview Modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});

  // Toggle section collapse
  const toggleSection = (key) => {
    setCollapsedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const timePeriods = ["12 months", "6 months", "3 months", "30 days"];

  // Fetch reports data
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Calculate date range based on selected period
        const endDate = new Date();
        const startDate = new Date();
        
        switch (selectedPeriod) {
          case "30 days":
            startDate.setDate(endDate.getDate() - 30);
            break;
          case "3 months":
            startDate.setMonth(endDate.getMonth() - 3);
            break;
          case "6 months":
            startDate.setMonth(endDate.getMonth() - 6);
            break;
          case "12 months":
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
          default:
            startDate.setDate(endDate.getDate() - 30);
        }

        // Prepare API parameters
        const apiParams = {
          page: apiFilters.page,
          limit: apiFilters.limit
        };

        // Only add date parameters if filters are not cleared and custom date range is selected
        if (!filtersCleared && dateRange.from && dateRange.to) {
          apiParams.startDate = dateRange.from.toISOString().split('T')[0];
          apiParams.endDate = dateRange.to.toISOString().split('T')[0];
        } else if (!filtersCleared) {
          // Use time period defaults when no custom date range (but filters not cleared)
          apiParams.startDate = startDate.toISOString().split('T')[0];
          apiParams.endDate = endDate.toISOString().split('T')[0];
        }
        // If filtersCleared is true, don't add any date parameters

        const response = await surveyAPI.getReports(apiParams);

        if (response.status && response.data) {
          setReportsData(response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch reports');
        }
      } catch (err) {
        
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [selectedPeriod, apiFilters, filtersCleared]);

  // Fetch Surveys for Survey Notes tab (notes are fetched per survey when downloading)
  useEffect(() => {
    const fetchSurveysForNotes = async () => {
      if (selectedTab !== 'Survey Notes') return;
      
      try {
        setSurveyNotesLoading(true);
        
        const apiParams = {
          page: apiFilters.page,
          limit: apiFilters.limit
        };
        
        if (!filtersCleared && dateRange.from && dateRange.to) {
          apiParams.startDate = dateRange.from.toISOString().split('T')[0];
          apiParams.endDate = dateRange.to.toISOString().split('T')[0];
        }
        
        // Fetch survey list - notes will be fetched per survey on download
        const response = await surveyAPI.getUserSurveyList(apiParams);
        
        if (response.status && response.data) {
          // Handle the API response structure
          const surveys = Array.isArray(response.data) 
            ? response.data 
            : (response.data.surveyData || response.data.surveys || []);
          
          // Map to simple structure for the table
          const surveyItems = surveys.map(survey => ({
            _id: survey._id,
            surveyId: survey._id,
            facilityName: survey.facilityId?.name || survey.createdBy?.organization || 'N/A',
            createdAt: survey.createdAt || survey.surveyCreationDate,
            surveyCategory: survey.surveyCategory,
            createdBy: survey.createdBy
          }));
          
          setSurveyNotesData(surveyItems);
        } else {
          setSurveyNotesData([]);
        }
      } catch (err) {
        
        setSurveyNotesData([]);
      } finally {
        setSurveyNotesLoading(false);
      }
    };

    fetchSurveysForNotes();
  }, [selectedTab, apiFilters, filtersCleared, dateRange]);

  // Fetch Loads when tab is selected
  useEffect(() => {
    const fetchLoads = async () => {
      if (selectedTab !== 'Loads') return;
      
      try {
        setLoadsLoading(true);
        
        const apiParams = {
          page: apiFilters.page,
          limit: apiFilters.limit
        };
        
        if (!filtersCleared && dateRange.from && dateRange.to) {
          apiParams.startDate = dateRange.from.toISOString().split('T')[0];
          apiParams.endDate = dateRange.to.toISOString().split('T')[0];
        }
        
        const response = await surveyAPI.getReports(apiParams);
        
        if (response.status && response.data?.loads) {
          setLoadsData(response.data.loads);
        }
      } catch (err) {
        // console.error('Error fetching loads:', err);
      } finally {
        setLoadsLoading(false);
      }
    };

    fetchLoads();
  }, [selectedTab, apiFilters, filtersCleared, dateRange]);

  // Helper function to escape HTML for safe rendering
  const escapeHtml = (text) => {
    if (text === null || text === undefined) return '';
    const str = String(text);
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return str.replace(/[&<>"']/g, m => map[m]);
  };

  // Helper function to format key names for display
  const formatKeyName = (key) => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  };

  // Helper function to render initial pool residents table
  const renderInitialPoolTable = (residents) => {
    if (!Array.isArray(residents) || residents.length === 0) return '';
    const rows = residents.map(resident => {
      return `<tr>
        <td>${escapeHtml(resident.name || 'N/A')}</td>
        <td>${escapeHtml(resident.room || 'N/A')}</td>
        <td>${escapeHtml(resident.admissionDate || 'N/A')}</td>
        <td>${escapeHtml(resident.status || 'N/A')}</td>
        <td>${escapeHtml(resident.diagnosis || 'N/A')}</td>
        <td>${escapeHtml(resident.selectionReason || 'N/A')}</td>
        <td>${escapeHtml(resident.notes || 'N/A')}</td>
      </tr>`;
    }).join('');
    return `<table class="data-table">
      <thead><tr>
        <th>Name</th><th>Room</th><th>Admission Date</th><th>Status</th><th>Diagnosis</th><th>Selection Reason</th><th>Notes</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  };

  // Helper function to render facility tasks
  const renderFacilityTasks = (tasks) => {
    if (!tasks || typeof tasks !== 'object') return '';
    let html = '';
    Object.keys(tasks).forEach(taskCategory => {
      const categoryData = tasks[taskCategory];
      if (!categoryData || typeof categoryData !== 'object') return;
      html += `<div class="task-category"><h4>${escapeHtml(formatKeyName(taskCategory))}</h4>`;
      Object.keys(categoryData).forEach(taskKey => {
        const taskItem = categoryData[taskKey];
        if (!taskItem || typeof taskItem !== 'object') return;
        html += `<div class="task-item">`;
        Object.keys(taskItem).forEach(key => {
          if (taskItem[key] !== null && taskItem[key] !== undefined && taskItem[key] !== '') {
            let value;
            if (Array.isArray(taskItem[key])) {
              value = taskItem[key].map(v => escapeHtml(String(v))).join(', ');
            } else if (typeof taskItem[key] === 'boolean') {
              value = taskItem[key] ? 'Yes' : 'No';
            } else {
              value = escapeHtml(String(taskItem[key]));
            }
            html += `<p><strong>${escapeHtml(formatKeyName(key))}:</strong> ${value}</p>`;
          }
        });
        html += `</div>`;
      });
      html += `</div>`;
    });
    return html;
  };

  // Helper function to render team member tasks
  const renderTeamMemberTasks = (teamPayload) => {
    if (!Array.isArray(teamPayload) || teamPayload.length === 0) return '';
    return teamPayload.map((member, index) => {
      let html = `<div class="team-member">
        <h4>Team Member ${index + 1}: ${escapeHtml(member.teamMemberName || 'N/A')}</h4>
        <p><strong>Email:</strong> ${escapeHtml(member.teamMemberEmail || 'N/A')}</p>
        <p><strong>Status:</strong> ${escapeHtml(member.taskStatus || 'N/A')}</p>`;
      if (member.assignedTasks && Array.isArray(member.assignedTasks)) {
        html += `<p><strong>Assigned Tasks:</strong> ${escapeHtml(member.assignedTasks.join(', '))}</p>`;
      }
      if (member.workSummary) {
        html += `<p><strong>Progress:</strong> ${member.workSummary.completedTasks || 0} of ${member.workSummary.totalAssigned || 0} tasks completed (${member.workSummary.completionPercentage || 0}%)</p>`;
      }
      html += `</div>`;
      return html;
    }).join('');
  };

  // Helper function to render nested objects
  const renderNestedObject = (obj, level = 0) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return '';
    let html = '';
    const indent = level * 15;
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (value === null || value === undefined || value === '') return;
      if (Array.isArray(value)) {
        html += `<div style="margin-left: ${indent}px;"><strong>${escapeHtml(formatKeyName(key))}:</strong>`;
        value.forEach((item, idx) => {
          if (typeof item === 'string') {
            html += `<p style="margin-left: 15px;">${idx + 1}. ${escapeHtml(item)}</p>`;
          } else if (typeof item === 'object') {
            html += `<div class="nested-item">${renderNestedObject(item, level + 1)}</div>`;
          }
        });
        html += `</div>`;
      } else if (typeof value === 'object') {
        html += `<div style="margin-left: ${indent}px;"><strong>${escapeHtml(formatKeyName(key))}:</strong>${renderNestedObject(value, level + 1)}</div>`;
      } else {
        const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : escapeHtml(String(value));
        html += `<p style="margin-left: ${indent}px;"><strong>${escapeHtml(formatKeyName(key))}:</strong> ${displayValue}</p>`;
      }
    });
    return html;
  };

  // Preview survey note before downloading
  const handlePreviewNote = useCallback(async (note) => {
    try {
      setPreviewLoading(true);
      setPreviewModalOpen(true);
      
      const noteId = note._id || note.surveyId;
      if (!noteId) {
        toast.error('Note ID not found');
        setPreviewLoading(false);
        setPreviewModalOpen(false);
        return;
      }
      
      // Fetch the full notes data
      const response = await surveyAPI.getSurveyNotes(noteId);
      
      if (response.status && response.data) {
        // Note fields we care about
        const noteFields = ['overallNotes', 'notes', 'additionalComments', 'note', 'comments'];
        
        // Helper function to check if a value has content
        const hasNoteContent = (value) => {
          if (value === null || value === undefined || value === '') return false;
          if (typeof value === 'string' && value.trim() === '') return false;
          if (Array.isArray(value) && value.length === 0) return false;
          if (typeof value === 'object' && Object.keys(value).length === 0) return false;
          return true;
        };
        
        // Helper function to check if an item has any meaningful note content
        const itemHasNoteContent = (item) => {
          if (!item || typeof item !== 'object') return false;
          for (const field of noteFields) {
            if (item[field] && hasNoteContent(item[field])) return true;
          }
          if (item.investigations && Array.isArray(item.investigations)) {
            return item.investigations.some(inv => 
              noteFields.some(field => inv[field] && hasNoteContent(inv[field]))
            );
          }
          return false;
        };
        
        // Helper function to recursively filter out items without note content
        const filterEmptyNoteFields = (obj) => {
          if (!obj || typeof obj !== 'object') return obj;
          if (Array.isArray(obj)) {
            return obj.filter(item => itemHasNoteContent(item)).map(item => filterEmptyNoteFields(item));
          }
          const filtered = {};
          Object.keys(obj).forEach(key => {
            const value = obj[key];
            if (noteFields.includes(key) && !hasNoteContent(value)) return;
            if (typeof value === 'object' && value !== null) {
              const filteredValue = filterEmptyNoteFields(value);
              if (Array.isArray(filteredValue) && filteredValue.length > 0) {
                filtered[key] = filteredValue;
              } else if (!Array.isArray(filteredValue) && filteredValue && Object.keys(filteredValue).length > 0) {
                filtered[key] = filteredValue;
              }
            } else if (value !== null && value !== undefined && value !== '') {
              filtered[key] = value;
            }
          });
          return filtered;
        };
        
        const filteredData = filterEmptyNoteFields(response.data);
        
        // Exclude metadata keys
        const excludeKeys = ['_id', '__v', 'id', 'createdAt', 'updatedAt', 'userId', 'surveyId', 'facilityId', 'fileUrl', 'wordlink', 'pdfUrl', 'facilityName', 'surveyCategory', 'createdBy', 'facility', 'type', 'noteType', 'surveyCreationDate'];
        const dataKeys = Object.keys(filteredData).filter(key => {
          if (excludeKeys.includes(key)) return false;
          if (key.endsWith('Id') || key.endsWith('ID')) return false;
          if (filteredData[key] === null || filteredData[key] === undefined || filteredData[key] === '') return false;
          return true;
        });
        
        // Count sections with content
        let sectionCount = 0;
        dataKeys.forEach(key => {
          const value = filteredData[key];
          if (Array.isArray(value) && value.length === 0) return;
          if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) return;
          sectionCount++;
        });
        
        setPreviewData({
          note,
          filteredData,
          dataKeys,
          sectionCount,
          facilityName: note.facilityName || note.facility?.name || note.createdBy?.organization || 'Survey',
          surveyDate: note.surveyCreationDate || note.createdAt,
          surveyType: note.surveyCategory || note.type || note.noteType || 'Survey Notes'
        });
      } else {
        toast.error('Failed to load notes data');
        setPreviewModalOpen(false);
      }
    } catch (err) {
      toast.error('Failed to load notes preview');
      setPreviewModalOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  // Download survey note as Word - generates a booklet-style document
  const handleDownloadNote = useCallback(async (note) => {
    try {
      const noteId = note._id || note.surveyId;
      if (!noteId) {
        toast.error('Note ID not found');
        return;
      }
      
      // Check if note already has a file URL for direct download
      const directFileUrl = note.fileUrl || note.wordlink || note.pdfUrl;
      if (directFileUrl) {
        window.open(directFileUrl, '_blank');
        toast.success('Notes download started!');
        return;
      }
      
      // Check if the note object already contains the notes data
      // If so, use it directly; otherwise fetch from API
      let notesData = note;
      
      // If the note doesn't have content data, fetch it
      const hasContent = note.facilityEntrance || note.kitchenQuickVisitNote || 
                         note.facilityTasks || note.initialPoolProcess || 
                         note.lifeSafetySurvey || note.investigationSurvey ||
                         note.content || note.notes;
      
      if (!hasContent) {
        // Fetch the full notes data
        const response = await surveyAPI.getSurveyNotes(noteId);
        
     
        
        if (response.status && response.data) {
          // Check for existing file URL
          const fileUrl = response.data.fileUrl || response.data.wordlink || response.data.pdfUrl;
          if (fileUrl) {
            window.open(fileUrl, '_blank');
            toast.success('Notes download started!');
            return;
          }
          notesData = { ...note, ...response.data };
        }
      }
      
      // Generate Word document from the notes data (same format as POC)
      const facilityName = note.facilityName || note.facility?.name || note.createdBy?.organization || 'Survey';
      const surveyDate = note.surveyCreationDate || note.createdAt;
      const surveyType = note.surveyCategory || note.type || note.noteType || 'Survey Notes';
      const generatedDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
        
      // Helper function to render any value (string, object, array) as HTML
      const renderValue = (value, depth = 0) => {
        if (value === null || value === undefined || value === '') return '';
        
        if (typeof value === 'string') {
          return `<p>${escapeHtml(value)}</p>`;
        }
        
        if (typeof value === 'boolean') {
          return `<span>${value ? 'Yes' : 'No'}</span>`;
        }
        
        if (typeof value === 'number') {
          return `<span>${value}</span>`;
        }
        
        if (Array.isArray(value)) {
          if (value.length === 0) return '';
          
          let html = '';
          value.forEach((item, idx) => {
            if (typeof item === 'object' && item !== null) {
              html += '<div style="margin: 0.15in 0; padding-bottom: 0.1in; border-bottom: 1px solid #ddd;">';
              html += renderValue(item, depth + 1);
              html += '</div>';
            } else {
              html += '<p>• ' + escapeHtml(String(item)) + '</p>';
            }
          });
          return html;
        }
        
        if (typeof value === 'object') {
          let html = '';
          Object.keys(value).forEach(key => {
            const val = value[key];
            // Exclude ID fields and metadata
            if (key.startsWith('_') || key.endsWith('Id') || key.endsWith('ID') || key === 'id' || key === 'createdAt' || key === 'updatedAt' || key === 'userId' || key === 'surveyId' || key === 'facilityId') return;
            if (val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) return;
            
            const displayKey = formatKeyName(key);
            
            if (typeof val === 'object') {
              html += '<div style="margin: 0.1in 0;">';
              html += '<p><strong><u>' + escapeHtml(displayKey) + '</u></strong></p>';
              html += renderValue(val, depth + 1);
              html += '</div>';
            } else {
              html += '<p><strong>' + escapeHtml(displayKey) + ':</strong> ' + escapeHtml(String(val)) + '</p>';
            }
          });
          return html;
        }
        
        return escapeHtml(String(value));
      };
      
      // Helper function to check if a notes field has actual content
      const hasNoteContent = (value) => {
        if (value === null || value === undefined || value === '') return false;
        if (typeof value === 'string' && value.trim() === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        if (typeof value === 'object' && Object.keys(value).length === 0) return false;
        return true;
      };
      
      // Note fields we care about - only include items with actual content in these fields
      const noteFields = ['overallNotes', 'notes', 'additionalComments', 'note', 'comments'];
      
      // Helper function to check if an item has any meaningful note content
      const itemHasNoteContent = (item) => {
        if (!item || typeof item !== 'object') return false;
        
        // Check if any note field has content
        for (const field of noteFields) {
          if (item[field] && hasNoteContent(item[field])) {
            return true;
          }
        }
        
        // Also check nested investigations for notes
        if (item.investigations && Array.isArray(item.investigations)) {
          return item.investigations.some(inv => 
            noteFields.some(field => inv[field] && hasNoteContent(inv[field]))
          );
        }
        
        return false;
      };
      
      // Helper function to recursively filter out items without note content
      const filterEmptyNoteFields = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        if (Array.isArray(obj)) {
          // Filter array items - only keep items that have actual note content
          return obj
            .filter(item => itemHasNoteContent(item))
            .map(item => filterEmptyNoteFields(item));
        }
        
        const filtered = {};
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          
          // Skip empty note fields
          if (noteFields.includes(key) && !hasNoteContent(value)) {
            return;
          }
          
          // Recursively filter nested objects/arrays
          if (typeof value === 'object' && value !== null) {
            const filteredValue = filterEmptyNoteFields(value);
            // Only include if the filtered value has content
            if (Array.isArray(filteredValue) && filteredValue.length > 0) {
              filtered[key] = filteredValue;
            } else if (!Array.isArray(filteredValue) && filteredValue && Object.keys(filteredValue).length > 0) {
              filtered[key] = filteredValue;
            }
          } else if (value !== null && value !== undefined && value !== '') {
            filtered[key] = value;
          }
        });
        
        return filtered;
      };
      
      // Filter out empty note fields from the data
      const filteredNotesData = filterEmptyNoteFields(notesData);
      
      // Get all data keys from the response (excluding metadata and ID fields)
      const excludeKeys = ['_id', '__v', 'id', 'createdAt', 'updatedAt', 'userId', 'surveyId', 'facilityId', 'fileUrl', 'wordlink', 'pdfUrl', 'facilityName', 'surveyCategory', 'createdBy', 'facility', 'type', 'noteType', 'surveyCreationDate'];
      const dataKeys = Object.keys(filteredNotesData).filter(key => {
        if (excludeKeys.includes(key)) return false;
        if (key.endsWith('Id') || key.endsWith('ID')) return false;
        if (filteredNotesData[key] === null || filteredNotesData[key] === undefined || filteredNotesData[key] === '') return false;
        return true;
      });
      
      // Count non-empty data sections (exclude empty arrays and empty objects)
      let sectionCount = 0;
      dataKeys.forEach(key => {
        const value = filteredNotesData[key];
        if (Array.isArray(value) && value.length === 0) return;
        if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) return;
        sectionCount++;
      });
      
      // If there's no actual content, don't download - show message instead
      if (sectionCount === 0) {
        toast.info('No notes content available for this survey');
        return;
      }
      
      // Build content sections dynamically
      let contentSections = '';
      dataKeys.forEach(key => {
        const value = filteredNotesData[key];
        if (Array.isArray(value) && value.length === 0) return;
        if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) return;
        
        const displayKey = formatKeyName(key);
        
        contentSections += `
        <div class="section-header">${escapeHtml(displayKey)}</div>
        ${renderValue(value)}
        `;
      });
      
      // Generate table of contents from data keys
      const tableOfContents = dataKeys.map((key, index) => {
        const value = filteredNotesData[key];
        if (Array.isArray(value) && value.length === 0) return '';
        if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) return '';
        return `<p style="margin: 0.08in 0;">${index + 1}. ${escapeHtml(formatKeyName(key))}</p>`;
      }).filter(Boolean).join('');
      
      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Survey Notes - ${facilityName}</title>
        <style>
          @page { size: letter; margin: 1in 1in 1in 1in; }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #000;
          }
          
          /* Header */
          .doc-header {
            margin-bottom: 0.2in;
          }
          .divider {
            border-top: 1px solid #000;
            margin: 0.1in 0 0.2in 0;
          }
          
          /* Table of Contents */
          .toc-title {
            font-size: 11pt;
            font-weight: bold;
            margin: 0.2in 0 0.15in 0;
          }
          
          /* Section Headers */
          .section-header {
            color: #075b7d;
            font-size: 12pt;
            font-weight: bold;
            margin: 0.4in 0 0.15in 0;
            page-break-inside: avoid;
          }
          
          /* Section Labels */
          .section-label {
            font-size: 11pt;
            font-weight: bold;
            margin: 0.15in 0 0.05in 0;
          }
          
          /* Content */
          p {
            margin: 0.05in 0;
            text-align: left;
          }
          
          /* Lists */
          ul {
            margin: 0.08in 0 0.08in 0.25in;
            padding-left: 0.2in;
          }
          li {
            margin: 0.05in 0;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="doc-header">
          <img src="https://www.mocksurvey365.com/logo.png" alt="Logo" style="width: 20px; height: 20px;">
          <div class="divider"></div>
        </div>

        <!-- Table of Contents -->
        <p class="toc-title">Table of Contents</p>
        ${tableOfContents}
        
        <div class="divider" style="margin-top: 0.3in;"></div>

        <!-- Survey Information -->
        <div class="section-header">Survey Information</div>
        <p><strong>Facility:</strong> ${escapeHtml(facilityName)}</p>
        <p><strong>Survey Type:</strong> ${escapeHtml(surveyType)}</p>
        <p><strong>Survey Date:</strong> ${surveyDate ? new Date(surveyDate).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Conducted By:</strong> ${escapeHtml((note.createdBy?.firstName || '') + ' ' + (note.createdBy?.lastName || ''))}</p>
        <p><strong>Organization:</strong> ${escapeHtml(note.createdBy?.organization || 'N/A')}</p>

        <!-- Dynamic Content Sections -->
        ${contentSections}
      </body>
      </html>
      `;

      // Create blob and download as Word document
      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Survey_Notes_${facilityName.replace(/\s+/g, '_')}_${surveyDate ? new Date(surveyDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Notes downloaded successfully!');
    } catch (err) {
  
      toast.error('Failed to download notes');
    }
  }, [escapeHtml, formatKeyName]);

  // Download load
  const handleDownloadLoad = useCallback(async (load) => {
    try {
      const fileUrl = load.fileUrl || load.pdfUrl || load.downloadUrl;
      if (fileUrl) {
        window.open(fileUrl, '_blank');
        toast.success('Load download started!');
      } else {
        toast.error('No download URL available');
      }
    } catch (err) {
      toast.error('Failed to download load');
    }
  }, []);

  const triggerBrowserDownload = useCallback((blob, filename) => {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
  }, []);

  const handleReportFileDownload = useCallback(
    async (fileUrl, fallbackName) => {
      const resolvedUrl = (() => {
        try {
          return new URL(fileUrl, window.location.href);
        } catch {
          return null;
        }
      })();

      const isSameOrigin =
        resolvedUrl && resolvedUrl.origin === window.location.origin;

      // For cross-origin files, fall back to opening in a new tab because browsers
      // prevent programmatic downloads without CORS headers.
      if (!isSameOrigin) {
        const anchor = document.createElement("a");
        anchor.href = fileUrl;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        return;
      }

      try {
        const response = await fetch(fileUrl);

        if (!response.ok) {
          throw new Error(`Download failed with status ${response.status}`);
        }

        const blob = await response.blob();
        let filename = fallbackName;

        try {
          const url = new URL(fileUrl);
          const pathname = url.pathname.split("/").pop();
          if (pathname) {
            filename = pathname;
          }
        } catch {
          // Ignore URL parsing errors and fall back to provided name
        }

        triggerBrowserDownload(blob, filename || "report-download");
      } catch (downloadError) {
       
        window.open(fileUrl, "_blank", "noopener,noreferrer");
      }
    },
    [triggerBrowserDownload]
  );

  // Download Citation Report as Word document (matches Citation.jsx format)
  const handleDownloadCitationReportWord = useCallback((rowData) => {
    try {
      const professionalFindings = rowData?.professionalFindings || [];
      const surveyData = rowData?.surveyData || {};
      const disclaimer = rowData?.disclaimer || null;
      
      if (!professionalFindings || professionalFindings.length === 0) {
        toast.error("No citation report data to download");
        return;
      }

      const facilityName = surveyData?.facilityId?.name || rowData?.createdBy?.organization || 'Facility';

      // Generate table of contents
      const tableOfContents = professionalFindings.map((finding, index) => 
        `<p style="margin: 0.08in 0;">${index + 1}. ${finding.ftag} – ${finding.title || 'Finding'}</p>`
      ).join('');

      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Citation Report - ${facilityName}</title>
        <style>
          @page { size: letter; margin: 1in 1in 1in 1in; }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #000;
          }
          
          /* Header */
          .doc-header {
            margin-bottom: 0.2in;
          }
          .header-row {
            display: flex;
            align-items: center;
            margin-bottom: 0.1in;
          }
          .logo-img {
            width: 50px;
            height: 50px;
            margin-right: 10px;
          }
          .logo-text {
            color: #075b7d;
            font-size: 20pt;
            font-weight: bold;
            margin: 0;
          }
          .facility-title {
            font-size: 11pt;
            font-weight: bold;
            margin: 0.15in 0 0.1in 0;
          }
          .divider {
            border-top: 1px solid #000;
            margin: 0.1in 0 0.2in 0;
          }
          
          /* Table of Contents */
          .toc-title {
            font-size: 11pt;
            font-weight: bold;
            margin: 0.2in 0 0.15in 0;
          }
          .toc-item {
            margin: 0.06in 0 0.06in 0.3in;
            font-size: 11pt;
          }
          
          /* F-Tag Headers */
          .ftag-header {
            color: #075b7d;
            font-size: 12pt;
            font-weight: bold;
            margin: 0.4in 0 0.15in 0;
            page-break-inside: avoid;
          }
          
          /* Section Labels */
          .section-label {
            font-size: 11pt;
            font-weight: bold;
            margin: 0.15in 0 0.05in 0;
          }
          
          /* Content */
          p {
            margin: 0.05in 0;
            text-align: left;
          }
          
          /* Lists */
          ul {
            margin: 0.08in 0 0.08in 0.25in;
            padding-left: 0.2in;
          }
          li {
            margin: 0.05in 0;
          }
          
          /* Page break */
          .page-break {
            page-break-before: always;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
      
      <div class="doc-header">
        <div class="header-row">
          <img src="https://www.mocksurvey365.com/logo.png" alt="Logo" class="logo-img">
        
        </div>
        <p class="facility-name">${facilityName}</p>
        <div class="divider"></div>
      </div>

        <!-- Table of Contents -->
        <p class="toc-title">Table of Contents</p>
        ${tableOfContents}
        
        <div class="divider" style="margin-top: 0.3in;"></div>

        <!-- Citation Findings -->
        ${professionalFindings.map((finding, index) => `
          <div class="ftag-header">${finding.ftag} – ${finding.title || ''}</div>
          
          <p class="section-label">Regulatory Requirement:</p>
          <p>${finding.regulatoryRequirement || 'N/A'}</p>
          
          <p class="section-label">Intent of the Regulation:</p>
          <p>${finding.intent || 'N/A'}</p>
          
          <p class="section-label">Deficiency Statement:</p>
          <p>${finding.deficiencyStatement || 'N/A'}</p>
          
          ${finding.detailedFindings && finding.detailedFindings.length > 0 ? `
            <p class="section-label">Findings:</p>
            <ul>
              ${finding.detailedFindings.map(detail => `<li>${detail}</li>`).join('')}
            </ul>
          ` : ''}
        `).join('')}

        ${disclaimer ? `
        <div class="divider" style="margin-top: 0.4in;"></div>
        <p class="section-label">Disclaimer:</p>
        <p style="font-size: 9pt; color: #666; font-style: italic;">${disclaimer}</p>
        ` : ''}
      </body>
      </html>
      `;

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Citation_Report_${facilityName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Citation report downloaded successfully!');
    } catch (err) {
   
      toast.error('Failed to download citation report');
    }
  }, []);

  // Download POC as Word document from API response data
  const handleDownloadPocWord = useCallback((rowData) => {
    try {
      // Extract plan of correction data from the new API structure
      const summary = rowData?.summary || {};
      const pocs = rowData?.plansOfCorrection || [];
      const disclaimer = rowData?.disclaimer || null;

      if (!summary.executiveSummary && pocs.length === 0) {
        toast.error("No Plan of Correction data to download");
        return;
      }

      // Get facility name from createdBy data if available
      const facilityName = rowData?.createdBy?.organization || 'Facility';

      // Generate table of contents
      const tableOfContents = pocs.map((poc, index) => 
        `<p style="margin: 0.08in 0;">${index + 1}. ${poc.ftag} – ${poc.regulation || 'Plan of Correction'}</p>`
      ).join('');

      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Plan of Correction - ${facilityName}</title>
        <style>
          @page { size: letter; margin: 1in 1in 1in 1in; }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #000;
          }
          
          /* Header */
          .doc-header {
            margin-bottom: 0.2in;
          }
          .divider {
            border-top: 1px solid #000;
            margin: 0.1in 0 0.2in 0;
          }
          
          /* Table of Contents */
          .toc-title {
            font-size: 11pt;
            font-weight: bold;
            margin: 0.2in 0 0.15in 0;
          }
          
          /* F-Tag Headers */
          .ftag-header {
            color: #075b7d;
            font-size: 12pt;
            font-weight: bold;
            margin: 0.4in 0 0.15in 0;
            page-break-inside: avoid;
          }
          
          /* Section Labels */
          .section-label {
            font-size: 11pt;
            font-weight: bold;
            margin: 0.15in 0 0.05in 0;
          }
          
          /* Content */
          p {
            margin: 0.05in 0;
            text-align: left;
          }
          
          /* Lists */
          ul {
            margin: 0.08in 0 0.08in 0.25in;
            padding-left: 0.2in;
          }
          li {
            margin: 0.05in 0;
          }
          
          /* Disclaimer */
          .disclaimer {
            padding: 0.15in;
            font-style: italic;
            font-size: 9pt;
            color: #666;
          }
             .report-title { 
          font-size: 24pt;
          font-weight: bold;
          color: #000;
          margin: 0.1in 0 0.05in 0;
        }
        .facility-name {
          font-size: 16pt;
          color: #147eb7ff;
          margin: 0;
        }
        </style>
      </head>
      <body> 
        <!-- Header -->
      <div class="doc-header">
        <div class="header-row">
          <img src="https://www.mocksurvey365.com/logo.png" alt="Logo" class="logo-img">
        
        </div>
        <p class="report-title">Plan of Correction</p>
        <p class="facility-name">${facilityName}</p>
        <div class="divider"></div>
      </div>

        <!-- Table of Contents -->
        <p class="toc-title">Table of Contents</p>
        ${tableOfContents}
        
        <div class="divider" style="margin-top: 0.3in;"></div>

        <!-- Executive Summary -->
        ${summary.executiveSummary ? `
          <div class="ftag-header">Executive Summary</div>
          <p>${summary.executiveSummary}</p>
        ` : ''}

        ${summary.timelineOverview ? `
          <p class="section-label">Timeline Overview:</p>
          <p>${summary.timelineOverview}</p>
        ` : ''}

        <!-- Detailed POCs -->
        ${pocs.map((poc, index) => `
          <div class="ftag-header">F${poc.ftag} – ${poc.regulation || ''}</div>
          
          <p class="section-label">Responsible Person:</p>
          <p>${poc.responsiblePerson || 'Not assigned'}</p>
          
          <p class="section-label">Compliance Date:</p>
          <p>${poc.complianceDate || 'TBD'}</p>

          ${poc.regulatoryReference ? `
            <p class="section-label">Regulatory Reference:</p>
            <p>${poc.regulatoryReference}</p>
          ` : ''}
          
          <p class="section-label">Identification of Deficiency:</p>
          <p>${poc.identification || 'No identification provided.'}</p>

          <p class="section-label">Corrective Action - Affected Residents:</p>
          <p>${poc.correctiveActionAffected || 'No corrective action specified.'}</p>

          <p class="section-label">Corrective Action - Potential Residents:</p>
          <p>${poc.correctiveActionPotential || 'No corrective action specified.'}</p>

          <p class="section-label">Systems Change:</p>
          <p>${poc.systemsChange || 'No systems change specified.'}</p>

          <p class="section-label">Monitoring Plan:</p>
          <p>${poc.monitoringPlan || 'No monitoring plan specified.'}</p>
        `).join('')}

        ${disclaimer ? `
        <!-- Disclaimer -->
        <div >
          <p class="section-label">Disclaimer</p>
          <p class="disclaimer">${disclaimer}</p>
        </div>
        ` : ''}
      </body>
      </html>
    `;

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Plan_of_Correction_${facilityName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Plan of Correction downloaded successfully!");
    } catch (error) {
     
      toast.error("Failed to generate Plan of Correction document");
    }
  }, []);

  // Citation Reports columns
  const citationReportsColumns = useMemo(
    () => [
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Created Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">
              {new Date(row.getValue("createdAt")).toLocaleDateString()}
            </div>
            <div className="text-gray-500 text-xs">
              {new Date(row.getValue("createdAt")).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "citationReportGenerated",
        header: "Status",
        cell: ({ row }) => {
          const isGenerated = row.getValue("citationReportGenerated");
          return (
            <Badge variant={isGenerated ? "default" : "secondary"} className="font-medium">
              {isGenerated ? "Generated" : "Pending"}
            </Badge>
          );
        },
      }, 
      {
        accessorKey: "professionalFindings",
        header: "Findings",
        cell: ({ row }) => {
          const findings = row.getValue("professionalFindings") || [];
          return (
            <div className="text-sm">
              <div className="font-medium">{findings.length}</div>
              <div className="text-gray-500 text-xs">findings</div>
            </div>
          );
        },
      },
      {
        accessorKey: "createdBy",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Created By
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const user = row.getValue("createdBy");
          return (
            <div className="text-sm">
              <div className="font-medium">{user?.firstName} {user?.lastName}</div>
              <div className="text-gray-500 text-xs">{user?.organization}</div>
            </div>
          );
        },
        filterFn: (row, id, value) => {
          const user = row.getValue(id);
          const searchValue = value.toLowerCase();
          return (
            user?.firstName?.toLowerCase().includes(searchValue) ||
            user?.lastName?.toLowerCase().includes(searchValue) ||
            user?.organization?.toLowerCase().includes(searchValue)
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const isGenerated = row.original.citationReportGenerated;
          const hasFindings = row.original.professionalFindings?.length > 0;
          
          return (
            <div className="flex space-x-1">
              {isGenerated && hasFindings && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadCitationReportWord(row.original)}
                  className="h-8 w-8 p-0"
                  title="Download Citation Report"
                >
                  <FileText className="w-4 h-4" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [handleDownloadCitationReportWord]
  );

  // Plan of Correction Reports columns
  const planOfCorrectionColumns = useMemo(
    () => [
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Created Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">
              {new Date(row.getValue("createdAt")).toLocaleDateString()}
            </div>
            <div className="text-gray-500 text-xs">
              {new Date(row.getValue("createdAt")).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "plansOfCorrection",
        header: "Citations",
        cell: ({ row }) => {
          const pocs = row.getValue("plansOfCorrection") || [];
          return (
            <div className="text-center">
              <span className="font-semibold text-lg">{pocs.length}</span>
              <div className="text-xs text-gray-500">citations</div>
            </div>
          );
        },
      },
      {
        accessorFn: (row) => row.summary?.estimatedCompletionDate,
        id: "estimatedCompletionDate",
        header: "Est. Completion",
        cell: ({ row }) => {
          const date = row.original.summary?.estimatedCompletionDate;
          return (
            <div className="text-sm">
              <div className="font-medium">{date || 'TBD'}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "accessType",
        header: "Access",
        cell: ({ row }) => {
          const accessType = row.getValue("accessType");
          return (
            <Badge variant="outline" className="font-medium">
              {accessType || 'N/A'}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdBy",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Created By
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const user = row.getValue("createdBy");
          return (
            <div className="text-sm">
              <div className="font-medium">{user?.firstName} {user?.lastName}</div>
              <div className="text-gray-500 text-xs">{user?.organization}</div>
            </div>
          );
        },
        filterFn: (row, id, value) => {
          const user = row.getValue(id);
          const searchValue = value.toLowerCase();
          return (
            user?.firstName?.toLowerCase().includes(searchValue) ||
            user?.lastName?.toLowerCase().includes(searchValue) ||
            user?.organization?.toLowerCase().includes(searchValue)
          );
        },
      }, 
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const pocs = row.original.plansOfCorrection || [];
          const hasPocData = pocs.length > 0 || row.original.summary?.executiveSummary;
          
          return (
            <div className="flex space-x-1">
              {hasPocData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadPocWord(row.original)}
                  className="h-8 w-8 p-0"
                  title="Download Plan of Correction"
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [handleDownloadPocWord]
  );

  // Survey Notes columns - simple: Facility Name, Date, Download
  const surveyNotesColumns = useMemo(
    () => [
      {
        accessorKey: "facilityName",
        header: "Facility Name",
        cell: ({ row }) => {
          const facilityName = row.getValue("facilityName");
          return (
            <div className="text-sm">
              <div className="font-medium">{facilityName || 'N/A'}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Date Created
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const date = row.getValue("createdAt");
          return (
            <div className="text-sm">
              <div className="font-medium">
                {date ? new Date(date).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePreviewNote(row.original)}
              className="h-8 w-8 p-0"
              title="Preview Notes"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    [handlePreviewNote]
  );

  // Loads columns
  const loadsColumns = useMemo(
    () => [
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">
              {new Date(row.getValue("createdAt")).toLocaleDateString()}
            </div>
            <div className="text-gray-500 text-xs">
              {new Date(row.getValue("createdAt")).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "loadType",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-medium">
            {row.getValue("loadType") || 'General'}
          </Badge>
        ),
      },
      {
        accessorKey: "fileName",
        header: "File Name",
        cell: ({ row }) => {
          const fileName = row.getValue("fileName") || row.original.name;
          return (
            <div className="text-sm font-medium max-w-[200px] truncate">
              {fileName || 'Untitled'}
            </div>
          );
        },
      },
      {
        accessorKey: "fileSize",
        header: "Size",
        cell: ({ row }) => {
          const size = row.getValue("fileSize") || row.original.size;
          const formatSize = (bytes) => {
            if (!bytes) return 'N/A';
            const kb = bytes / 1024;
            if (kb < 1024) return `${kb.toFixed(1)} KB`;
            return `${(kb / 1024).toFixed(1)} MB`;
          };
          return (
            <div className="text-sm text-gray-600">
              {formatSize(size)}
            </div>
          );
        },
      },
      {
        accessorKey: "createdBy",
        header: "Uploaded By",
        cell: ({ row }) => {
          const user = row.getValue("createdBy");
          return (
            <div className="text-sm">
              <div className="font-medium">{user?.firstName} {user?.lastName}</div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            variant="default"
            size="sm"
            onClick={() => handleDownloadLoad(row.original)}
            className="h-8 px-3 bg-[#075b7d] hover:bg-[#075b7d]/90"
            title="Download Load"
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
        ),
      },
    ],
    [handleDownloadLoad]
  );

  // Handle date range changes (pending)
  const handleDateRangeChange = (newDateRange) => {
    setPendingDateRange(newDateRange);
  };

  // Apply filters (including date range)
  const applyFilters = () => {
    setDateRange(pendingDateRange);
    setFiltersCleared(false);
    setApiFilters(prev => ({
      ...prev,
      page: 1 // Reset to first page when applying filters
    }));
  };

  // Handle API filter changes
  const handleApiFilterChange = (key, value) => {
    setApiFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setApiFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };


  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Reports
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              Track all your reports in one place
            </p>
          </div>
        </div>

        {/* Time Period Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="w-full sm:w-auto overflow-x-auto">
            <div className="flex items-center space-x-0 border border-gray-200 rounded-lg p-1 bg-gray-50 min-w-fit">
              {timePeriods.map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 sm:px-4 lg:px-6 py-2 rounded-md transition-colors text-xs sm:text-sm font-medium cursor-pointer whitespace-nowrap ${
                    selectedPeriod === period
                      ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Report Tabs */}
        <div className="bg-white">
          <div className="border border-gray-200 rounded-lg">
            <div className="p-4 sm:p-6">
            </div>
            
            {/* Tab Navigation */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-b border-gray-200 p-4">
              <div className="w-full sm:w-auto overflow-x-auto">
                <div className="flex items-center bg-gray-100 border border-gray-200 rounded-[8px] min-w-fit">
                  {['Citation Reports', 'Plan of Correction', 'Survey Notes'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSelectedTab(tab)}
                      className={`px-4 sm:px-6 lg:px-8 py-2.5 rounded-[8px] transition-all duration-200 text-sm font-medium cursor-pointer whitespace-nowrap ${
                        selectedTab === tab
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-2 sm:p-4">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span>Loading reports...</span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-red-800">Error loading reports: {error}</span>
                  </div>
                </div>
              )}
              
              {!loading && !error && (
                <>
                  {selectedTab === 'Citation Reports' && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Citation Reports
                    </h3>
                    <p className="text-sm text-gray-600">
                          Track citation report generation and completion status
                    </p>
                  </div>
                  
                  {/* API Filter Controls */}
                  <div className="mb-4 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                     
                      <DateRangePicker
                        dateRange={pendingDateRange}
                        onSelect={handleDateRangeChange}
                        placeholder="Select date range"
                        className="w-[280px]"
                      />
                </div>
                    
                    {pendingDateRange.from && pendingDateRange.to && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={applyFilters}
                        className="text-sm bg-[#075b7d] hover:bg-[#075b7d]/90"
                      >
                        Apply Filters
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setApiFilters({page: 1, limit: 25});
                        setDateRange({from: undefined, to: undefined});
                        setPendingDateRange({from: undefined, to: undefined});
                        setFiltersCleared(true);
                      }}
                      className="text-sm" 
                    >
                      Clear Filters
                    </Button>
                        </div>
                      {reportsData?.citationreport?.length > 0 ? (
                        <DataTable 
                          columns={citationReportsColumns} 
                          data={reportsData.citationreport}
                          searchColumn="createdBy"
                        />
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No citation reports found for the selected period.
                        </div>
                      )}
                </div>
              )}

                  {selectedTab === 'Plan of Correction' && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Plan of Correction Reports
                    </h3>
                    <p className="text-sm text-gray-600">
                          Monitor plan of correction completion and case closure activities
                    </p>
                  </div>
                  
                  {/* API Filter Controls */}
                  <div className="mb-4 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Date Range:</label>
                      <DateRangePicker
                        dateRange={pendingDateRange}
                        onSelect={handleDateRangeChange}
                        placeholder="Select date range"
                        className="w-[280px]"
                      />
                    </div>
                    
                    {pendingDateRange.from && pendingDateRange.to && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={applyFilters}
                        className="text-sm bg-[#075b7d] hover:bg-[#075b7d]/90"
                      >
                        Apply Filters
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setApiFilters({page: 1, limit: 25});
                        setDateRange({from: undefined, to: undefined});
                        setPendingDateRange({from: undefined, to: undefined});
                        setFiltersCleared(true);
                      }}
                      className="text-sm"
                    >
                      Clear Filters
                    </Button>
                  </div>
                      {reportsData?.planofcorrection?.length > 0 ? (
                        <DataTable 
                          columns={planOfCorrectionColumns} 
                          data={reportsData.planofcorrection}
                          searchColumn="createdBy"
                        />
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No plan of correction reports found for the selected period.
                            </div>
                      )}
                              </div>
              )}

                  {/* Survey Notes Tab */}
                  {selectedTab === 'Survey Notes' && (
                    <div>
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        
                          Survey Notes
                        </h3>
                        <p className="text-sm text-gray-600">
                          View and download your survey notes
                        </p>
                      </div>
                      
                      {/* API Filter Controls */}
                      <div className="mb-4 flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Date Range:</label>
                          <DateRangePicker
                            dateRange={pendingDateRange}
                            onSelect={handleDateRangeChange}
                            placeholder="Select date range"
                            className="w-[280px]"
                          />
                        </div>
                        
                        {pendingDateRange.from && pendingDateRange.to && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={applyFilters}
                            className="text-sm bg-[#075b7d] hover:bg-[#075b7d]/90"
                          >
                            Apply Filters
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setApiFilters({page: 1, limit: 25});
                            setDateRange({from: undefined, to: undefined});
                            setPendingDateRange({from: undefined, to: undefined});
                            setFiltersCleared(true);
                          }}
                          className="text-sm"
                        >
                          Clear Filters
                        </Button>
                      </div>

                      {surveyNotesLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin mr-2" />
                          <span>Loading survey notes...</span>
                        </div>
                      ) : surveyNotesData?.length > 0 ? (
                        <DataTable 
                          columns={surveyNotesColumns} 
                          data={surveyNotesData}
                          searchColumn="facilityName"
                        />
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <StickyNote className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No survey notes found for the selected period.</p>
                        </div>
                      )}
                    </div>
                  )}

              

                  {/* Pagination */}
                  {reportsData?.pagination && reportsData.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-600">
                        Showing page {reportsData.pagination.currentPage} of {reportsData.pagination.totalPages}
                        ({reportsData.pagination.total} total reports)
                              </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reportsData.pagination.currentPage === 1}
                          onClick={() => handlePageChange(reportsData.pagination.currentPage - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reportsData.pagination.currentPage === reportsData.pagination.totalPages}
                          onClick={() => handlePageChange(reportsData.pagination.currentPage + 1)}
                        >
                          Next
                        </Button>
                  </div>
                </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Survey Notes Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={(open) => {
        setPreviewModalOpen(open);
        if (!open) {
          setPreviewData(null);
          setCollapsedSections({});
        }
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Survey Notes Preview</DialogTitle>
            {previewData && (
              <DialogDescription>
                {previewData.facilityName} - {previewData.surveyDate ? new Date(previewData.surveyDate).toLocaleDateString() : 'N/A'}
              </DialogDescription>
            )}
          </DialogHeader>
          
          <DialogBody className="overflow-y-auto scrollbar-hide">
            {previewLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mr-3 text-[#075b7d]" />
                <span className="text-gray-600">Loading notes...</span>
              </div>
            ) : previewData && previewData.sectionCount > 0 ? (
              <div className="space-y-6">
                {/* Survey Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-sky-900 mb-2">Survey Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><span className="font-medium">Facility:</span> {previewData.facilityName}</p>
                    <p><span className="font-medium">Survey Type:</span> {previewData.surveyType}</p>
                    <p><span className="font-medium">Survey Date:</span> {previewData.surveyDate ? new Date(previewData.surveyDate).toLocaleDateString() : 'N/A'}</p>
                    <p><span className="font-medium">Conducted By:</span> {(previewData.note.createdBy?.firstName || '') + ' ' + (previewData.note.createdBy?.lastName || '')}</p>
                  </div>
                </div>
                
                {/* Notes Sections */}
                {previewData.dataKeys.map((key, index) => {
                  const value = previewData.filteredData[key];
                  if (Array.isArray(value) && value.length === 0) return null;
                  if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) return null;
                  const isCollapsed = collapsedSections[key];
                  
                  return (
                    <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection(key)}
                        className="w-full bg-gray-50 text-gray-900 px-4 py-2 flex items-center justify-between hover:bg-sky-50 hover:text-sky-900 transition-colors cursor-pointer"
                      >
                        <h3 className="font-semibold">{formatKeyName(key)}</h3>
                        <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} />
                      </button>
                      <div className={`transition-all duration-200 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0' : 'max-h-[2000px]'}`}>
                      <div className="p-4">
                        {Array.isArray(value) ? (
                          <div className="space-y-3">
                            {value.map((item, idx) => (
                              <div key={idx} className="bg-gray-50 rounded p-3 text-sm">
                                {typeof item === 'object' && item !== null ? (
                                  <div className="space-y-1">
                                    {Object.keys(item).map(itemKey => {
                                      if (itemKey.startsWith('_') || itemKey.endsWith('Id') || itemKey === 'teamMemberUserId') return null;
                                      const itemValue = item[itemKey];
                                      if (itemValue === null || itemValue === undefined || itemValue === '' || (Array.isArray(itemValue) && itemValue.length === 0)) return null;
                                      
                                      // Special handling for nested arrays like observations
                                      if (Array.isArray(itemValue)) {
                                        return (
                                          <div key={itemKey} className="mt-2">
                                            <span className="font-medium text-gray-700">{formatKeyName(itemKey)}:</span>
                                            <div className="ml-4 mt-1 space-y-1">
                                              {itemValue.map((subItem, subIdx) => (
                                                <div key={subIdx} className="text-xs text-gray-600 bg-white p-2 rounded border">
                                                  {typeof subItem === 'object' ? (
                                                    Object.keys(subItem).filter(k => !k.startsWith('_') && subItem[k]).map(k => (
                                                      <p key={k}><span className="font-medium">{formatKeyName(k)}:</span> {String(subItem[k])}</p>
                                                    ))
                                                  ) : String(subItem)}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      }
                                      
                                      return (
                                        <p key={itemKey}>
                                          <span className="font-medium text-gray-700">{formatKeyName(itemKey)}:</span>{' '}
                                          <span className="text-gray-600">{typeof itemValue === 'object' ? JSON.stringify(itemValue) : String(itemValue)}</span>
                                        </p>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-gray-600">{String(item)}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : typeof value === 'object' && value !== null ? (
                          <div className="space-y-1 text-sm">
                            {Object.keys(value).map(objKey => {
                              if (objKey.startsWith('_') || objKey.endsWith('Id')) return null;
                              const objValue = value[objKey];
                              if (objValue === null || objValue === undefined || objValue === '') return null;
                              return (
                                <p key={objKey}>
                                  <span className="font-medium text-gray-700">{formatKeyName(objKey)}:</span>{' '}
                                  <span className="text-gray-600">{typeof objValue === 'object' ? JSON.stringify(objValue) : String(objValue)}</span>
                                </p>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600">{String(value)}</p>
                        )}
                      </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <StickyNote className="w-12 h-12 mb-3 text-gray-300" />
                <p>No notes content available for this survey.</p>
              </div>
            )}
          </DialogBody>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPreviewModalOpen(false);
                setPreviewData(null);
                setCollapsedSections({});
              }}
            >
              Close
            </Button>
            {previewData && previewData.sectionCount > 0 && (
              <Button
                className="bg-[#075b7d] hover:bg-[#075b7d]/90"
                onClick={() => {
                  handleDownloadNote(previewData.note);
                  setPreviewModalOpen(false);
                  setPreviewData(null);
                  setCollapsedSections({});
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports; 