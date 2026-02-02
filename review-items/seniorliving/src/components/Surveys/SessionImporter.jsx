import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Plus, Upload, FileText, Code, Brain, Database, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function SessionImporter({
  onSessionsImported,
  currentSessions = []
}) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("manual")
  const [systemSubTab, setSystemSubTab] = useState("ehr") // Separate state for system sub-tabs
  const [manualSessionName, setManualSessionName] = useState("")
  const [manualSessionDescription, setManualSessionDescription] = useState("")
  const [jsonInput, setJsonInput] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [importError, setImportError] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleManualAdd = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    if (manualSessionName.trim() === "") {
      setImportError("Session name cannot be empty.")
      return
    }

    const newSession = {
      id: `phase-${Date.now()}`,
      name: manualSessionName.trim(),
      description: manualSessionDescription.trim() || "",
      order: (currentSessions.length || 0) + 1,
      groups: [],
      documents: []
    }
    
    onSessionsImported([newSession])
    setManualSessionName("")
    setManualSessionDescription("")
    setImportError("")
    setOpen(false)
  }

  const handleFileUpload = (event, fileType = "csv") => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      setImportError("")
      setIsProcessing(true)
      
      // Simulate file parsing
      setTimeout(() => {
        try {
          let sessions = []
          
          if (fileType === "csv" || fileType === "excel") {
            // Simulate CSV/Excel parsing
            const mockSessions = [
              { 
                id: `phase-${Date.now()}-1`, 
                name: "Document Review Session", 
                description: "Review all facility documents and records", 
                order: currentSessions.length + 1,
                groups: [],
                documents: []
              },
              { 
                id: `phase-${Date.now()}-2`, 
                name: "Resident Interview Session", 
                description: "Conduct interviews with residents", 
                order: currentSessions.length + 2,
                groups: [],
                documents: []
              }
            ]
            sessions = mockSessions
          } else if (fileType === "json") {
            // This would parse JSON from file
            const reader = new FileReader()
            reader.onload = (e) => {
              try {
                const parsed = JSON.parse(e.target.result)
                if (Array.isArray(parsed)) {
                  sessions = parsed.map((item, index) => ({
                    id: item.id || `phase-${Date.now()}-${index}`,
                    name: item.name || item.title || `Session ${index + 1}`,
                    description: item.description || "",
                    order: item.order || (currentSessions.length + index + 1),
                    groups: item.groups || [],
                    documents: item.documents || []
                  }))
                } else if (parsed.sessions && Array.isArray(parsed.sessions)) {
                  sessions = parsed.sessions.map((item, index) => ({
                    id: item.id || `phase-${Date.now()}-${index}`,
                    name: item.name || item.title || `Session ${index + 1}`,
                    description: item.description || "",
                    order: item.order || (currentSessions.length + index + 1),
                    groups: item.groups || [],
                    documents: item.documents || []
                  }))
                } else {
                  throw new Error("JSON must be an array of session objects or contain a 'sessions' array")
                }
                
                onSessionsImported(sessions)
                setSelectedFile(null)
                setOpen(false)
                toast.success(`Imported ${sessions.length} session(s) from ${file.name}`)
                setIsProcessing(false)
              } catch (error) {
                setImportError("Invalid file format: " + error.message)
                setIsProcessing(false)
              }
            }
            reader.readAsText(file)
            return
          }
          
          onSessionsImported(sessions)
          setSelectedFile(null)
          setOpen(false)
          toast.success(`Imported ${sessions.length} session(s) from ${file.name}`)
        } catch (e) {
          setImportError("Invalid file format: " + e.message)
        } finally {
          setIsProcessing(false)
        }
      }, 100)
    }
  }

  const handleJSONImport = () => {
    if (jsonInput.trim() === "") {
      setImportError("JSON input cannot be empty.")
      return
    }
    
    try {
      const parsed = JSON.parse(jsonInput)
      let sessions = []
      
      if (Array.isArray(parsed)) {
        sessions = parsed.map((item, index) => ({
          id: item.id || `phase-${Date.now()}-${index}`,
          name: item.name || item.title || `Session ${index + 1}`,
          description: item.description || "",
          order: item.order || (currentSessions.length + index + 1),
          groups: item.groups || [],
          documents: item.documents || []
        }))
      } else if (parsed.sessions && Array.isArray(parsed.sessions)) {
        sessions = parsed.sessions.map((item, index) => ({
          id: item.id || `phase-${Date.now()}-${index}`,
          name: item.name || item.title || `Session ${index + 1}`,
          description: item.description || "",
          order: item.order || (currentSessions.length + index + 1),
          groups: item.groups || [],
          documents: item.documents || []
        }))
      } else {
        throw new Error("JSON must be an array of session objects or contain a 'sessions' array")
      }
      
      onSessionsImported(sessions)
      setJsonInput("")
      setImportError("")
      setOpen(false)
      toast.success(`Imported ${sessions.length} session(s) from JSON`)
    } catch (e) {
      setImportError("Invalid JSON format: " + e.message)
    }
  }

  const handleSystemImport = () => {
    setImportError("")
    setIsProcessing(true)
    
    // Simulate system connection
    toast.info("Connecting to system...")
    setTimeout(() => {
      const mockSystemSessions = [
        { 
          id: `phase-${Date.now()}-1`, 
          name: "EHR: Resident Records Review", 
          description: "Review resident records from EHR system", 
          order: currentSessions.length + 1,
          groups: [],
          documents: []
        },
        { 
          id: `phase-${Date.now()}-2`, 
          name: "EHR: Medication Administration", 
          description: "Review medication administration records", 
          order: currentSessions.length + 2,
          groups: [],
          documents: []
        },
        { 
          id: `phase-${Date.now()}-3`, 
          name: "EHR: Care Plan Review", 
          description: "Review care plans from EHR system", 
          order: currentSessions.length + 3,
          groups: [],
          documents: []
        }
      ]
      
      onSessionsImported(mockSystemSessions)
      setOpen(false)
      toast.success(`Imported ${mockSystemSessions.length} session(s) from system`)
      setIsProcessing(false)
    }, 1500)
  }

  const handleAIGenerate = () => {
    if (systemPrompt.trim() === "") {
      setImportError("AI prompt cannot be empty.")
      return
    }
    
    setImportError("")
    setIsProcessing(true)
    
    // Simulate AI generation
    toast.info(`Generating sessions with AI for: "${systemPrompt}"...`)
    setTimeout(() => {
      const mockAISessions = [
        { 
          id: `phase-${Date.now()}-1`, 
          name: `AI: ${systemPrompt.substring(0, 30)}... - Document Review`, 
          description: "Comprehensive document review session", 
          order: currentSessions.length + 1,
          groups: [],
          documents: []
        },
        { 
          id: `phase-${Date.now()}-2`, 
          name: `AI: ${systemPrompt.substring(0, 30)}... - Resident Assessment`, 
          description: "Resident assessment and interview session", 
          order: currentSessions.length + 2,
          groups: [],
          documents: []
        },
        { 
          id: `phase-${Date.now()}-3`, 
          name: `AI: ${systemPrompt.substring(0, 30)}... - Compliance Check`, 
          description: "Compliance and safety inspection session", 
          order: currentSessions.length + 3,
          groups: [],
          documents: []
        }
      ]
      
      onSessionsImported(mockAISessions)
      setSystemPrompt("")
      setOpen(false)
      toast.success(`Generated ${mockAISessions.length} session(s) using AI`)
      setIsProcessing(false)
    }, 2000)
  }

  const resetForm = () => {
    setManualSessionName("")
    setManualSessionDescription("")
    setJsonInput("")
    setSystemPrompt("")
    setSelectedFile(null)
    setImportError("")
    setActiveTab("manual")
    setSystemSubTab("ehr")
  }

  return (
    <>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground transition-colors"
          title="Add new session"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <Dialog open={open} onOpenChange={(newOpen) => {
        setOpen(newOpen)
        if (!newOpen) {
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Session</DialogTitle>
            <DialogDescription>
              Create a new session manually or import from various sources
            </DialogDescription>
          </DialogHeader>

        <div className="space-y-6 mt-4">
          {importError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-destructive">{importError}</p>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="manual">
                <Plus className="h-4 w-4 mr-2" />
                Manual
              </TabsTrigger>
              <TabsTrigger value="file">
                <Upload className="h-4 w-4 mr-2" />
                File
              </TabsTrigger>
              <TabsTrigger value="json">
                <Code className="h-4 w-4 mr-2" />
                JSON
              </TabsTrigger>
              <TabsTrigger value="system">
                <Database className="h-4 w-4 mr-2" />
                System
              </TabsTrigger>
            </TabsList>

            {/* Manual Tab */}
            <TabsContent value="manual" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-session-name">
                    Session Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="manual-session-name"
                    value={manualSessionName}
                    onChange={(e) => setManualSessionName(e.target.value)}
                    placeholder="e.g., Document Review, Resident Interviews, etc."
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-session-description">
                    Description <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                  </Label>
                  <Textarea
                    id="manual-session-description"
                    value={manualSessionDescription}
                    onChange={(e) => setManualSessionDescription(e.target.value)}
                    placeholder="Describe what this session involves..."
                    rows={3}
                    className="text-sm"
                  />
                </div>
              </div>
              
              <Button 
                type="button"
                onClick={handleManualAdd} 
                className="w-full"
                disabled={!manualSessionName.trim() || isProcessing}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Session
              </Button>
            </TabsContent>

            {/* File Upload Tab */}
            <TabsContent value="file" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Upload CSV, Excel, or JSON File</Label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center bg-gray-50/50">
                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload a file with session definitions
                    </p>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls,.json"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          if (file.name.endsWith('.json')) {
                            handleFileUpload(e, "json")
                          } else {
                            handleFileUpload(e, "csv")
                          }
                        }
                      }}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={isProcessing}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* JSON Import Tab */}
            <TabsContent value="json" className="space-y-4 mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="json-input">Paste JSON Data</Label>
                  <Textarea
                    id="json-input"
                    placeholder={`[\n  {"name": "Document Review", "description": "Review all documents"},\n  {"name": "Resident Interviews", "description": "Conduct interviews"}\n]`}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    rows={10}
                    className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isProcessing}
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleJSONImport}
                  disabled={!jsonInput.trim() || isProcessing}
                >
                  <Code className="h-4 w-4 mr-2" />
                  Import from JSON
                </Button>
              </div>
            </TabsContent>

            {/* System Import Tab */}
            <TabsContent value="system" className="space-y-4 mt-6">
              <Tabs value={systemSubTab} onValueChange={setSystemSubTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ehr">
                    <Database className="h-4 w-4 mr-2" />
                    EHR System
                  </TabsTrigger>
                  <TabsTrigger value="ai">
                    <Brain className="h-4 w-4 mr-2" />
                    AI Generate
                  </TabsTrigger>
                </TabsList>

                {/* EHR Import */}
                <TabsContent value="ehr" className="space-y-4 mt-6">
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                    <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
                    <h4 className="font-semibold mb-2">Connect to EHR System</h4>
                    <p className="text-sm text-muted-foreground mb-6">
                      Link to your Electronic Health Records (EHR) system to import session templates
                    </p>
                    <Button
                      type="button"
                      onClick={handleSystemImport}
                      disabled={isProcessing}
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Import from EHR System
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">
                      Note: System integration requires configuration. Contact support for setup.
                    </p>
                  </div>
                </TabsContent>

                {/* AI Generation */}
                <TabsContent value="ai" className="space-y-4 mt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai-prompt">
                        AI Prompt <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="ai-prompt"
                        rows={6}
                        placeholder="e.g., 'Create survey sessions for assisted living facility compliance check. Include document review, resident interviews, and safety inspections.'"
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isProcessing}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleAIGenerate}
                      disabled={!systemPrompt.trim() || isProcessing}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {isProcessing ? (
                        <>
                          <Brain className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          Generate Sessions with AI
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      AI will generate sessions based on your description.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

