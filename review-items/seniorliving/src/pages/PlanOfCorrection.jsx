import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Plus, Search, Edit, FileCheck, AlertCircle, CheckCircle, Clock, XCircle, ChevronRight, MoreVertical, Folder, Upload, FileText, X, Loader2, FolderPlus, Move } from "lucide-react"
import { toast } from "sonner"
import { POC_STATUS } from "../utils/constants"

export default function PlanOfCorrection() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [uploadedReports, setUploadedReports] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const [showOrganizeDialog, setShowOrganizeDialog] = useState(false)
  const [folders, setFolders] = useState([])
  const [newFolderName, setNewFolderName] = useState("")
  const [selectedPocs, setSelectedPocs] = useState([])
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [pocsToMove, setPocsToMove] = useState([])

  const [pocs, setPocs] = useState([])

  const getStatusIcon = (status) => {
    switch (status) {
      case "Draft":
        return <FileCheck className="h-4 w-4" />
      case "Under Review":
      case "Approved Internally":
        return <Clock className="h-4 w-4" />
      case "Submitted":
        return <AlertCircle className="h-4 w-4" />
      case "Approved by Surveyor":
        return <CheckCircle className="h-4 w-4" />
      case "Rejected":
        return <XCircle className="h-4 w-4" />
      default:
        return <FileCheck className="h-4 w-4" />
    }
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "Draft":
        return "secondary"
      case "Under Review":
      case "Approved Internally":
        return "default"
      case "Submitted":
        return "default"
      case "Approved by Surveyor":
        return "default"
      case "Rejected":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "—"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatDateShort = (dateString) => {
    if (!dateString) return "—"
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleCreateNew = () => {
    setShowUploadDialog(true)
  }

  const validateFile = (file) => {
    // Validate file type (PDF, DOC, DOCX)
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or Word document")
      return false
    }
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB")
      return false
    }
    return true
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file && validateFile(file)) {
      setSelectedFile(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file && validateFile(file)) {
      setSelectedFile(file)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setIsDragging(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadAndGenerate = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload")
      return
    }

    setIsUploading(true)
    
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Create uploaded report entry
      const reportId = `report-${Date.now()}`
      const uploadedReport = {
        id: reportId,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        uploadedAt: new Date().toISOString(),
        status: "processing"
      }
      
      setUploadedReports(prev => [uploadedReport, ...prev])
      toast.success("Report uploaded successfully")
      
      setIsUploading(false)
      setIsGenerating(true)
      
      // Simulate POC generation (in real app, this would call an API)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate mock POCs from the report
      const generatedPocs = generatePOCsFromReport(selectedFile.name)
      
      setPocs(prev => [...generatedPocs, ...prev])
      setUploadedReports(prev => 
        prev.map(r => r.id === reportId ? { ...r, status: "completed" } : r)
      )
      
      setIsGenerating(false)
      setShowUploadDialog(false)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      toast.success(`Generated ${generatedPocs.length} Plans of Correction from the report`)
    } catch (error) {
      setIsUploading(false)
      setIsGenerating(false)
      toast.error("Failed to upload and generate POCs. Please try again.")
    }
  }

  // Mock function to generate POCs from report
  const generatePOCsFromReport = (fileName) => {
    // In a real app, this would parse the uploaded document and extract deficiencies
    // For now, we'll generate mock POCs based on common deficiency types
    const mockDeficiencies = [
      {
        title: "Medication Administration Error",
        rootCause: "Staff training gaps in medication administration procedures",
        actions: 3
      },
      {
        title: "Resident Care Plan Not Updated",
        rootCause: "Lack of systematic review process for care plans",
        actions: 2
      },
      {
        title: "Documentation Incomplete",
        rootCause: "Insufficient documentation training and oversight",
        actions: 4
      }
    ]

    return mockDeficiencies.map((def, index) => ({
      id: `poc-${Date.now()}-${index}`,
      reportId: `report-${Date.now()}`,
      deficiencyId: `def-${Date.now()}-${index}`,
      deficiencyTitle: def.title,
      rootCauseAnalysis: def.rootCause,
      status: "Draft",
      submittedDate: null,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      correctiveActions: def.actions,
      completedActions: 0,
      createdAt: new Date().toISOString(),
      folderId: null
    }))
  }

  const handleView = (pocId) => {
    navigate(`/plan-of-correction/${pocId}`)
  }

  const handleOrganize = () => {
    setShowOrganizeDialog(true)
  }

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast.error("Please enter a folder name")
      return
    }

    const newFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      createdAt: new Date().toISOString(),
      pocCount: 0
    }

    setFolders(prev => [...prev, newFolder])
    setNewFolderName("")
    toast.success(`Folder "${newFolder.name}" created`)
  }

  const handleMoveToFolder = (folderId) => {
    if (pocsToMove.length === 0) {
      toast.error("No POCs selected to move")
      return
    }

    setPocs(prev => prev.map(poc => 
      pocsToMove.includes(poc.id) 
        ? { ...poc, folderId: folderId || null }
        : poc
    ))

    const folder = folders.find(f => f.id === folderId)
    const folderName = folder ? folder.name : "Uncategorized"
    toast.success(`Moved ${pocsToMove.length} POC(s) to "${folderName}"`)
    
    setPocsToMove([])
    setShowMoveDialog(false)
    setSelectedPocs([])
  }

  const handleTogglePocSelection = (pocId) => {
    setSelectedPocs(prev => 
      prev.includes(pocId)
        ? prev.filter(id => id !== pocId)
        : [...prev, pocId]
    )
  }

  const handleSelectAll = () => {
    if (selectedPocs.length === filteredPocs.length) {
      setSelectedPocs([])
    } else {
      setSelectedPocs(filteredPocs.map(poc => poc.id))
    }
  }

  const handleOpenMoveDialog = () => {
    if (selectedPocs.length === 0) {
      toast.error("Please select at least one POC to move")
      return
    }
    setPocsToMove([...selectedPocs])
    setShowMoveDialog(true)
  }

  const handleDeleteFolder = (folderId) => {
    const folder = folders.find(f => f.id === folderId)
    if (!folder) return

    // Move POCs in this folder to uncategorized
    setPocs(prev => prev.map(poc => 
      poc.folderId === folderId 
        ? { ...poc, folderId: null }
        : poc
    ))

    setFolders(prev => prev.filter(f => f.id !== folderId))
    toast.success(`Folder "${folder.name}" deleted`)
  }

  const filteredPocs = pocs.filter(poc => {
    const matchesSearch = poc.deficiencyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      poc.rootCauseAnalysis.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || poc.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPocs = pocs.length
  const draftCount = pocs.filter(p => p.status === "Draft").length
  const submittedCount = pocs.filter(p => p.status === "Submitted" || p.status === "Under Review").length
  const approvedCount = pocs.filter(p => p.status === "Approved by Surveyor").length

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Breadcrumbs */}
      <div className="px-6 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="hover:text-gray-900 cursor-pointer">Home</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Plan of Correction</span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={handleCreateNew}
              variant="default"
              size="sm"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
      </div>

            {/* Search */}
          <div className="flex-1 max-w-md ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search for text, tags, contacts, and more"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 bg-white border-gray-300 focus:border-gray-400 focus:ring-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {filteredPocs.length === 0 && uploadedReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 px-6">
            <div className="text-center max-w-md">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <FileCheck className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || statusFilter !== "all"
                  ? "No matching items found"
                  : "No Plans of Correction yet"}
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Upload a survey report to automatically generate Plans of Correction for identified deficiencies."}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button 
                  onClick={handleCreateNew}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Upload className="h-4 w-4" />
                  Upload Report
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="px-6 py-4">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 pb-3 border-b border-gray-200 text-sm font-medium text-gray-600">
              <div className="col-span-1 flex items-center">
                <Checkbox
                  checked={selectedPocs.length > 0 && selectedPocs.length === filteredPocs.length}
                  onCheckedChange={handleSelectAll}
                />
              </div>
              <div className="col-span-4">Name</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Modified</div>
              <div className="col-span-2">Due Date</div>
              <div className="col-span-1"></div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-gray-100">
              {/* Uploaded Reports */}
              {uploadedReports.map((report) => (
                <div
                  key={report.id}
                  className="grid grid-cols-12 gap-4 py-3 hover:bg-gray-50 transition-colors group"
                >
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0">
                      <FileText className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">
                        {report.fileName}
                      </div>
                      <div className="text-sm text-gray-500 truncate mt-0.5">
                        {formatFileSize(report.fileSize)}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <Badge 
                      variant={report.status === "completed" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {report.status === "processing" ? "Processing" : "Completed"}
                    </Badge>
                  </div>
                  <div className="col-span-2 flex items-center text-sm text-gray-600">
                    {formatDateShort(report.uploadedAt)}
                  </div>
                  <div className="col-span-2 flex items-center text-sm text-gray-600">
                    —
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* POCs */}
          {filteredPocs.map((poc) => (
                <div
                  key={poc.id}
                  className="grid grid-cols-12 gap-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                  onClick={() => handleView(poc.id)}
                >
                  <div className="col-span-1 flex items-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedPocs.includes(poc.id)}
                      onCheckedChange={() => handleTogglePocSelection(poc.id)}
                    />
                  </div>
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0">
                      {getStatusIcon(poc.status)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate group-hover:text-blue-600">
                        {poc.deficiencyTitle}
                      </div>
                      <div className="text-sm text-gray-500 truncate mt-0.5">
                        {poc.rootCauseAnalysis}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <Badge 
                      variant={getStatusBadgeVariant(poc.status)}
                      className="text-xs"
                    >
                        {poc.status}
                      </Badge>
                    </div>
                  <div className="col-span-2 flex items-center text-sm text-gray-600">
                    {formatDateShort(poc.submittedDate)}
                  </div>
                  <div className="col-span-2 flex items-center text-sm text-gray-600">
                    {formatDate(poc.dueDate)}
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleView(poc.id)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={(open) => {
        if (!isUploading && !isGenerating) {
          setShowUploadDialog(open)
          setIsDragging(false)
          if (!open) {
            setSelectedFile(null)
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
          }
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader onClose={() => {
            if (!isUploading && !isGenerating) {
              setShowUploadDialog(false)
              setIsDragging(false)
              setSelectedFile(null)
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
            }
          }}>
            <DialogTitle className="text-xl">Upload Survey Report</DialogTitle>
            <DialogDescription className="text-base pt-1">
              Upload a survey report to automatically generate Plans of Correction for identified deficiencies.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 px-6 pb-6">
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : selectedFile
                  ? 'border-gray-300 bg-gray-50'
                  : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
              }`}
              onClick={() => !selectedFile && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                    </div>
                  <div className="space-y-1">
                    <div className="font-semibold text-gray-900 text-base">{selectedFile.name}</div>
                    <div className="text-sm text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveFile()
                    }}
                    className="mt-2 text-gray-600 hover:text-gray-900"
                  >
                    <X className="h-4 w-4 mr-1.5" />
                    Remove file
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <Upload className={`h-16 w-16 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="space-y-1">
                    <div className={`font-semibold text-base ${isDragging ? 'text-blue-600' : 'text-gray-900'}`}>
                      {isDragging ? 'Drop file here' : 'Click to upload or drag and drop'}
                    </div>
                    <div className="text-sm text-gray-500">
                      PDF, DOC, or DOCX (max 10MB)
                    </div>
                  </div>
        </div>
      )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadDialog(false)
                  setIsDragging(false)
                  setSelectedFile(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                disabled={isUploading || isGenerating}
                className="min-w-[100px]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadAndGenerate}
                disabled={!selectedFile || isUploading || isGenerating}
                className="min-w-[160px]"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload & Generate
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Organize Dialog */}
      <Dialog open={showOrganizeDialog} onOpenChange={setShowOrganizeDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader onClose={() => setShowOrganizeDialog(false)}>
            <DialogTitle className="text-xl">Organize Plans of Correction</DialogTitle>
            <DialogDescription className="text-base pt-1">
              Create folders to organize your Plans of Correction and move items between them.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 px-6 pb-6">
            {/* Create New Folder */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Create New Folder</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateFolder()
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleCreateFolder}
                  className="flex items-center gap-2"
                >
                  <FolderPlus className="h-4 w-4" />
                  Create
                </Button>
              </div>
            </div>

            {/* Folders List */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Folders</h3>
              {folders.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No folders yet. Create a folder to get started.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {folders.map((folder) => {
                    const folderPocCount = pocs.filter(poc => poc.folderId === folder.id).length
                    return (
                      <div
                        key={folder.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Folder className="h-5 w-5 text-blue-600" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{folder.name}</div>
                            <div className="text-sm text-gray-500">
                              {folderPocCount} {folderPocCount === 1 ? 'POC' : 'POCs'}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFolder(folder.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Bulk Actions */}
            {filteredPocs.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Bulk Actions</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="text-xs"
                    >
                      {selectedPocs.length === filteredPocs.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenMoveDialog}
                      disabled={selectedPocs.length === 0}
                      className="flex items-center gap-2 text-xs"
                    >
                      <Move className="h-4 w-4" />
                      Move ({selectedPocs.length})
                    </Button>
                  </div>
                </div>
                {selectedPocs.length > 0 && (
                  <p className="text-sm text-gray-500">
                    {selectedPocs.length} POC{selectedPocs.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowOrganizeDialog(false)
                  setSelectedPocs([])
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move to Folder Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader onClose={() => setShowMoveDialog(false)}>
            <DialogTitle className="text-xl">Move to Folder</DialogTitle>
            <DialogDescription className="text-base pt-1">
              Select a folder to move {pocsToMove.length} selected POC{pocsToMove.length !== 1 ? 's' : ''} to.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 px-6 pb-6">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <button
                onClick={() => handleMoveToFolder(null)}
                className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <Folder className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">Uncategorized</div>
                  <div className="text-sm text-gray-500">
                    {pocs.filter(poc => !poc.folderId).length} POCs
                  </div>
                </div>
              </button>
              
              {folders.map((folder) => {
                const folderPocCount = pocs.filter(poc => poc.folderId === folder.id).length
                return (
                  <button
                    key={folder.id}
                    onClick={() => handleMoveToFolder(folder.id)}
                    className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <Folder className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">{folder.name}</div>
                      <div className="text-sm text-gray-500">
                        {folderPocCount} {folderPocCount === 1 ? 'POC' : 'POCs'}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowMoveDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

