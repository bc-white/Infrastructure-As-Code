import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ChevronLeft, Download, FileText, Printer, Edit3, Save, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const SurveyReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const printRef = useRef();
  const [isEditing, setIsEditing] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [font, setFont] = useState('courier');
  
  // Get survey data from navigation state or use default
  const surveyData = location.state?.surveyData || null;
  
  const [reportData, setReportData] = useState({
    facilityName: surveyData?.facilityName || 'Sunset Manor Nursing Home',
    providerNumber: '12345',
    address: '123 Healthcare Drive',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701',
    surveyDate: new Date().toISOString().split('T')[0],
    surveyorName: surveyData?.teamCoordinator || 'John Smith, RN',
    surveyType: surveyData?.surveyType || 'Standard Recertification',
    findings: surveyData?.citations?.map((citation, index) => ({
      id: citation.id || index + 1,
      fTag: citation.fFlag?.split(' - ')[0] || 'F000',
      fTagTitle: citation.fFlag?.split(' - ')[1] || 'Regulatory Requirement',
      severity: citation.severity === 'Immediate Jeopardy' ? 'L - Immediate Jeopardy' :
               citation.severity === 'Widespread' ? 'K - Widespread' :
               citation.severity === 'Pattern' ? 'J - Pattern' : 'I - Isolated',
      scope: citation.severity || 'Isolated',
      deficiency: citation.deficiency || 'No deficiency statement provided.',
      planOfCorrection: 'The facility will implement corrective measures to address the identified deficiency and prevent recurrence.',
      completionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
    })) || [
      {
        id: 1,
        fTag: 'F880',
        fTagTitle: 'Freedom from abuse, neglect and Exploitation',
        severity: 'J - Isolated',
        scope: 'Pattern',
        deficiency: 'The facility failed to ensure that residents were free from abuse, neglect and exploitation as evidenced by inadequate staff supervision during evening shifts and failure to implement proper incident reporting procedures.',
        planOfCorrection: 'The facility will implement enhanced supervision protocols and mandatory incident reporting training for all staff members.',
        completionDate: '2024-02-15'
      }
    ]
  });

  // Survey statistics from the completed survey
  const surveyStats = {
    totalInvestigations: surveyData?.investigations?.length || 0,
    totalCitations: surveyData?.citations?.length || 0,
    completedTasks: surveyData?.facilityTasksCompleted ? 
      Object.values(surveyData.facilityTasksCompleted).filter(Boolean).length : 0,
    totalTasks: surveyData?.facilityTasksCompleted ? 
      Object.keys(surveyData.facilityTasksCompleted).length : 11,
    conferenceAttendees: surveyData?.conferenceAttendees ? 
      Object.values(surveyData.conferenceAttendees).filter(Boolean).length : 0,
    selectedResidents: surveyData?.selectedResidents?.length || 0,
    totalResidents: surveyData?.residents?.length || 0
  };

  const handleInputChange = (field, value) => {
    setReportData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFindingChange = (findingId, field, value) => {
    setReportData(prev => ({
      ...prev,
      findings: prev.findings.map(finding =>
        finding.id === findingId ? { ...finding, [field]: value } : finding
      )
    }));
  };

  const generatePDF = () => {
    window.print();
  };

  const generateWord = () => {
    // Create Word document content
    const htmlContent = printRef.current.innerHTML;
    const blob = new Blob([
      `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
       <head><meta charset='utf-8'><title>Survey Report</title></head>
       <body>${htmlContent}</body></html>`
    ], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Survey_Report_${reportData.facilityName.replace(/\s+/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    if (exportFormat === 'pdf') {
      generatePDF();
    } else if (exportFormat === 'word') {
      generateWord();
    }
  };

  const EditableField = ({ value, onChange, className = "", multiline = false, placeholder = "" }) => {
    if (!isEditing) {
      return (
        <span className={`${className} ${value ? '' : 'text-gray-400 italic'}`}>
          {value || placeholder}
        </span>
      );
    }

    if (multiline) {
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${className} w-full border-2 border-blue-200 rounded-lg px-2 sm:px-3 py-2 focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition-all resize-none min-h-[60px] sm:min-h-[80px] bg-blue-25 text-sm sm:text-base`}
          placeholder={placeholder}
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${className} border-2 border-blue-200 rounded-md px-2 py-1 focus:outline-none focus:border-blue-500 focus:bg-blue-50 transition-all bg-blue-25 text-sm sm:text-base`}
        placeholder={placeholder}
      />
    );
  };

  const fontClasses = {
    courier: 'font-mono',
    arial: 'font-sans',
    times: 'font-serif'
  };

  return (
    <div className="min-h-screen bg-[#fff]">
      {/* Header */}
      <div className="bg-[#F5F7FA] print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-4 lg:h-20">
            {/* Left Section */}
            <div className="flex items-center space-x-4 sm:space-x-6 mb-4 lg:mb-0">
              <button 
                onClick={() => navigate('/dashboard')}
                className="flex items-center px-3 sm:px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-[10px] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="font-medium text-sm">Back</span>
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Survey Report</h1>
                <p className="text-xs sm:text-sm text-gray-500">Form CMS-2567 - Statement of Deficiencies</p>
              </div>
            </div>

            {/* Right Section - Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              {/* Font and Format Selection Row */}
              <div className="flex space-x-3 sm:space-x-4">
                {/* Font Selection */}
                <div className="flex items-center space-x-2 flex-1 sm:flex-initial">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Font:</label>
                  <select
                    value={font}
                    onChange={(e) => setFont(e.target.value)}
                    className="h-10 px-2 sm:px-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors flex-1 sm:w-auto"
                  >
                    <option value="courier">Courier</option>
                    <option value="arial">Arial</option>
                    <option value="times">Times New Roman</option>
                  </select>
                </div>

                {/* Export Format */}
                <div className="flex items-center space-x-2 flex-1 sm:flex-initial">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Format:</label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="h-10 px-2 sm:px-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors flex-1 sm:w-auto"
                  >
                    <option value="pdf">PDF</option>
                    <option value="word">Word</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex space-x-3">
                {/* Edit Toggle */}
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  className={`h-10 px-3 sm:px-4 border-2 font-medium transition-all flex-1 sm:flex-initial ${
                    isEditing 
                      ? 'bg-green-50 border-green-500 text-green-700 hover:bg-green-100' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {isEditing ? (
                    <>
                      <Save className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Save Changes</span>
                      <span className="sm:hidden">Save</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Edit Report</span>
                      <span className="sm:hidden">Edit</span>
                    </>
                  )}
                </Button>

                {/* Export Button */}
                <Button
                  onClick={handleExport}
                  className="h-10 px-3 sm:px-6 bg-[#075b7d] hover:bg-[#075b7d] text-white font-medium shadow-sm flex-1 sm:flex-initial"
                >
                  <Download className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Export {exportFormat.toUpperCase()}</span>
                  <span className="sm:hidden">{exportFormat.toUpperCase()}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 print:p-0 print:max-w-none">
        {/* Editing Mode Indicator */}
        {isEditing && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-100 border-2 border-blue-300 rounded-xl print:hidden">
            <div className="flex items-center justify-center space-x-2">
              <Edit3 className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
              <span className="text-blue-800 font-semibold text-sm sm:text-base">Editing Mode Active</span>
              <span className="text-blue-600 text-xs sm:text-sm hidden sm:inline">- Click on any field to edit</span>
            </div>
          </div>
        )}

        <div 
          ref={printRef}
          className={`bg-white print:shadow-none ${fontClasses[font]} text-sm leading-relaxed border border-gray-200 rounded-[8px] print:rounded-none`}
          style={{ minHeight: '11in' }}
        >
          {/* Watermark */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-5 text-4xl sm:text-6xl font-bold text-gray-400 print:opacity-10 pointer-events-none transform rotate-45">
              DRAFT
            </div>

            {/* Header */}
            <div className="p-6 sm:p-8 lg:p-10 print:p-6">
              <div className="text-center mb-8 sm:mb-10">
                <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-gray-900">
                  STATEMENT OF DEFICIENCIES AND PLAN OF CORRECTION
                </h1>
                <h2 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 text-gray-800">
                  U.S. Department of Health and Human Services
                </h2>
                <h3 className="text-sm sm:text-base text-gray-700">
                  Centers for Medicare & Medicaid Services
                </h3>
                <div className="text-xs sm:text-sm mt-2 sm:mt-3 text-gray-600">
                  Form CMS-2567 (Rev. 01/2024)
                </div>
              </div>

              {/* Facility Information */}
              <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 mb-8 sm:mb-10 p-4 sm:p-6 border-2 ${isEditing ? 'border-blue-300 bg-blue-25' : 'border-gray-400'} rounded-lg`}>
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">
                      Provider/Supplier/CLIA Identification Number:
                    </label>
                    <div className="mt-1">
                      <EditableField
                        value={reportData.providerNumber}
                        onChange={(value) => handleInputChange('providerNumber', value)}
                        className="font-mono text-base sm:text-lg font-semibold"
                        placeholder="Enter Provider Number"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">
                      Name of Provider or Supplier:
                    </label>
                    <div className="mt-1">
                      <EditableField
                        value={reportData.facilityName}
                        onChange={(value) => handleInputChange('facilityName', value)}
                        className="font-semibold text-base sm:text-lg"
                        placeholder="Enter Facility Name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">
                      Address:
                    </label>
                    <div className="mt-1 space-y-2">
                      <EditableField
                        value={reportData.address}
                        onChange={(value) => handleInputChange('address', value)}
                        placeholder="Street Address"
                        className="block w-full"
                      />
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <EditableField
                          value={reportData.city}
                          onChange={(value) => handleInputChange('city', value)}
                          placeholder="City"
                          className="flex-1"
                        />
                        <div className="flex space-x-2">
                          <EditableField
                            value={reportData.state}
                            onChange={(value) => handleInputChange('state', value)}
                            placeholder="ST"
                            className="w-16 sm:w-20"
                          />
                          <EditableField
                            value={reportData.zipCode}
                            onChange={(value) => handleInputChange('zipCode', value)}
                            placeholder="ZIP"
                            className="w-24 sm:w-28"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">
                      Survey Date:
                    </label>
                    <div className="mt-1">
                      <EditableField
                        value={reportData.surveyDate}
                        onChange={(value) => handleInputChange('surveyDate', value)}
                        placeholder="YYYY-MM-DD"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">
                      Survey Type:
                    </label>
                    <div className="mt-1">
                      <EditableField
                        value={reportData.surveyType}
                        onChange={(value) => handleInputChange('surveyType', value)}
                        placeholder="Enter Survey Type"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">
                      Surveyor:
                    </label>
                    <div className="mt-1">
                      <EditableField
                        value={reportData.surveyorName}
                        onChange={(value) => handleInputChange('surveyorName', value)}
                        placeholder="Surveyor Name & Credentials"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Survey Summary Section */}
              {surveyData && (
                <div className="mb-8 sm:mb-10 p-4 sm:p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">Survey Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-600">{surveyStats.totalInvestigations}</div>
                      <div className="text-xs text-gray-600">Investigations</div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-2xl font-bold text-red-600">{surveyStats.totalCitations}</div>
                      <div className="text-xs text-gray-600">Citations</div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600">{surveyStats.completedTasks}/{surveyStats.totalTasks}</div>
                      <div className="text-xs text-gray-600">Tasks Completed</div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-2xl font-bold text-purple-600">{surveyStats.selectedResidents}/{surveyStats.totalResidents}</div>
                      <div className="text-xs text-gray-600">Residents Sampled</div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-blue-800">
                    <p><strong>Exit Conference:</strong> {surveyStats.conferenceAttendees} attendees participated</p>
                    {surveyData.exitSummary && (
                      <p className="mt-2"><strong>Summary:</strong> {surveyData.exitSummary.substring(0, 200)}...</p>
                    )}
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="mb-8 sm:mb-10 p-4 sm:p-6 bg-gray-50 border border-gray-300 rounded-lg">
                <p className="text-xs leading-relaxed text-gray-800">
                  <strong>INSTRUCTIONS FOR COMPLETION:</strong> Complete this form for each deficiency cited. 
                  The deficiency must be corrected and the plan of correction must be acceptable before your facility 
                  will be determined to be in compliance. Submit your response and plan of correction in duplicate 
                  to the Health Standards Survey Group.
                </p>
              </div>

              {/* Findings */}
              <div className="space-y-8 sm:space-y-10">
                {reportData.findings.length === 0 ? (
                  <div className="border-2 border-green-300 bg-green-50 rounded-lg p-6 sm:p-8 text-center">
                    <div className="flex items-center justify-center mb-4">
                      <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-green-800 mb-2">No Deficiencies Found</h3>
                    <p className="text-green-700 text-sm">
                      This facility was found to be in compliance with all applicable regulations during the survey period.
                      No citations or deficiencies were identified.
                    </p>
                    <div className="mt-4 p-4 bg-white border border-green-200 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Survey Status:</strong> COMPLIANT<br/>
                        <strong>Certification Recommendation:</strong> {surveyData?.certificationRecommendation || 'Full Certification'}
                      </p>
                    </div>
                  </div>
                ) : (
                  reportData.findings.map((finding, index) => (
                  <div key={finding.id} className={`border-2 ${isEditing ? 'border-blue-300 bg-blue-25' : 'border-gray-400'} rounded-lg p-4 sm:p-6 transition-all`}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-gray-300">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">F-Tag:</label>
                        <div className="text-lg sm:text-xl font-mono font-bold text-red-600">
                          <EditableField
                            value={finding.fTag}
                            onChange={(value) => handleFindingChange(finding.id, 'fTag', value)}
                            placeholder="F000"
                            className="text-lg sm:text-xl font-mono font-bold text-red-600"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">Severity:</label>
                        <div className="font-semibold text-gray-800 text-sm sm:text-base">
                          <EditableField
                            value={finding.severity}
                            onChange={(value) => handleFindingChange(finding.id, 'severity', value)}
                            placeholder="J - Isolated"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">Scope:</label>
                        <div className="font-semibold text-gray-800 text-sm sm:text-base">
                          <EditableField
                            value={finding.scope}
                            onChange={(value) => handleFindingChange(finding.id, 'scope', value)}
                            placeholder="Pattern"
                          />
                        </div>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2">ID:</label>
                        <div className="font-mono text-base sm:text-lg font-bold text-blue-600">
                          {String(index + 1).padStart(3, '0')}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 sm:mb-6">
                      <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3">Regulatory Reference:</label>
                      <div className="font-semibold text-gray-800 text-sm sm:text-base">
                        <EditableField
                          value={finding.fTagTitle}
                          onChange={(value) => handleFindingChange(finding.id, 'fTagTitle', value)}
                          placeholder="Enter regulatory reference title"
                          className="text-sm sm:text-base font-semibold"
                        />
                      </div>
                    </div>

                    <div className="mb-6 sm:mb-8">
                      <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3">Statement of Deficiency:</label>
                      <div className={`border-2 ${isEditing ? 'border-blue-200' : 'border-gray-300'} rounded-lg p-3 sm:p-4 min-h-[100px] sm:min-h-[120px] bg-white`}>
                        <EditableField
                          value={finding.deficiency}
                          onChange={(value) => handleFindingChange(finding.id, 'deficiency', value)}
                          multiline={true}
                          placeholder="Describe the deficiency in detail..."
                          className="w-full text-gray-800 leading-relaxed text-sm sm:text-base"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                      {/* <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3">Plan of Correction:</label>
                        <div className={`border-2 ${isEditing ? 'border-blue-200' : 'border-gray-300'} rounded-lg p-3 sm:p-4 min-h-[80px] sm:min-h-[100px] bg-white`}>
                          <EditableField
                            value={finding.planOfCorrection}
                            onChange={(value) => handleFindingChange(finding.id, 'planOfCorrection', value)}
                            multiline={true}
                            placeholder="Describe the plan of correction..."
                            className="w-full text-gray-800 leading-relaxed text-sm sm:text-base"
                          />
                        </div>
                      </div> */}
                      <div>
                        <label className="block text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3">Completion Date:</label>
                        <div className="mt-1">
                          <EditableField
                            value={finding.completionDate}
                            onChange={(value) => handleFindingChange(finding.id, 'completionDate', value)}
                            placeholder="YYYY-MM-DD"
                            className="font-semibold text-base sm:text-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
                )}
              </div>

              {/* Signature Section */}
              <div className="mt-12 sm:mt-16 pt-8 sm:pt-10 border-t-2 border-gray-400">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                  <div>
                    <div className="mb-8 sm:mb-10">
                      <div className="border-b-2 border-gray-400 pb-2 mb-3 h-10 sm:h-12 flex items-end">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Administrator/Authorized Representative Signature</span>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 font-medium">Date: _______________</div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-8 sm:mb-10">
                      <div className="border-b-2 border-gray-400 pb-2 mb-3 h-10 sm:h-12 flex items-end">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">State Survey Agency Representative Signature</span>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 font-medium">Date: _______________</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Disclaimer */}
              <div className="mt-12 sm:mt-16 pt-4 sm:pt-6 border-t-2 border-gray-300 text-xs text-gray-600 bg-gray-50 p-4 sm:p-6 rounded-lg">
                <div className="mb-3 sm:mb-4">
                  <p className="font-semibold text-red-600 mb-2">
                    ⚠️ DISCLAIMER:
                  </p>
                  <p className="leading-relaxed text-xs sm:text-sm">
                    This is a demonstration report generated by Survey365 Mock Survey System. 
                    This document is for training and educational purposes only and should not be used for actual regulatory compliance.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0 pt-3 sm:pt-4 border-t border-gray-300">
                  <span className="font-medium text-xs sm:text-sm">Generated on: {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                  <span className="font-medium text-xs sm:text-sm">Survey365 - Mock Survey System v1.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:p-0 {
            padding: 0 !important;
          }
          
          .print\\:p-6 {
            padding: 1.5rem !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:max-w-none {
            max-width: none !important;
          }
          
          .print\\:opacity-10 {
            opacity: 0.1 !important;
          }
          
          @page {
            margin: 0.75in;
            size: letter;
          }
        }
      `}</style>
    </div>
  );
};

export default SurveyReport; 