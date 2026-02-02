import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Plus, Upload, FileText, Code, Brain, Database, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"

export default function ContentImporter({
  onContentImported,
  currentFields = [],
  groups = [],
  selectedGroupId = null,
  onGroupSelect = null
}) {
  const [activeTab, setActiveTab] = useState("manual")
  const [manualContent, setManualContent] = useState("")
  const [manualDescription, setManualDescription] = useState("")
  const [manualRequired, setManualRequired] = useState(false)
  const [jsonInput, setJsonInput] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [importError, setImportError] = useState("")
  const [targetGroupId, setTargetGroupId] = useState(selectedGroupId || (groups.length > 0 ? groups[0].id : null))

  const handleManualAdd = (e) => {
    // Prevent form submission/navigation
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    if (manualContent.trim() === "") {
      setImportError("Field label cannot be empty.")
      return
    }

    if (groups.length === 0) {
      setImportError("Please create at least one group before adding fields. All fields must belong to a group.")
      return
    }

    if (!targetGroupId) {
      setImportError("Please select a group to add this field to.")
      return
    }

    const newField = {
      id: `field-${Date.now()}`,
      type: "text",
      label: manualContent.trim(),
      description: manualDescription.trim() || "",
      required: manualRequired,
      config: {}
    }
    onContentImported([newField], targetGroupId)
    setManualContent("")
    setManualDescription("")
    setManualRequired(false)
    setImportError("")
  }

  const handleFileUpload = (event, fileType = "csv") => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      setImportError("")
      
      // Simulate file parsing
      setTimeout(() => {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            let fields = []
            
            if (fileType === "csv" || fileType === "excel") {
              // Simulate CSV/Excel parsing
              const mockFields = [
                { id: `field-${Date.now()}-1`, type: "text", label: "Field from CSV 1", description: "", required: false, config: {} },
                { id: `field-${Date.now()}-2`, type: "checkbox", label: "Field from CSV 2", description: "", required: true, config: {} }
              ]
              fields = mockFields
            } else if (fileType === "json") {
              // Parse JSON
              const parsed = JSON.parse(e.target.result)
              if (Array.isArray(parsed)) {
                fields = parsed.map((item, index) => ({
                  id: item.id || `field-${Date.now()}-${index}`,
                  type: item.type || "text",
                  label: item.label || item.text || `Field ${index + 1}`,
                  required: item.required || false,
                  config: item.config || {}
                }))
              } else {
                throw new Error("JSON must be an array of field objects")
              }
            }
            
            if (groups.length === 0) {
              setImportError("Please create at least one group before importing fields. All fields must belong to a group.")
              return
            }
            if (!targetGroupId) {
              setImportError("Please select a group to add these fields to.")
              return
            }
            onContentImported(fields, targetGroupId)
            setSelectedFile(null)
            toast.success(`Imported ${fields.length} field(s) from ${file.name}`)
          } catch (error) {
            setImportError(`Error parsing file: ${error.message}`)
          }
        }
        
        if (fileType === "json") {
          reader.readAsText(file)
        } else {
          // For CSV/Excel, simulate
          setTimeout(() => {
            const mockFields = [
              { id: `field-${Date.now()}-1`, type: "text", label: `Field from ${file.name} 1`, description: "", required: false, config: {} },
              { id: `field-${Date.now()}-2`, type: "text", label: `Field from ${file.name} 2`, description: "", required: false, config: {} }
            ]
            onContentImported(mockFields)
            setSelectedFile(null)
            toast.success(`Imported ${mockFields.length} field(s) from ${file.name}`)
          }, 500)
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
      if (!Array.isArray(parsed)) {
        throw new Error("JSON must be an array of field objects")
      }
      
      const fields = parsed.map((item, index) => ({
        id: item.id || `field-${Date.now()}-${index}`,
        type: item.type || "text",
        label: item.label || item.text || `Field ${index + 1}`,
        description: item.description || item.helpText || "",
        required: item.required || false,
        config: item.config || {}
      }))
      
      if (groups.length === 0) {
        setImportError("Please create at least one group before importing fields. All fields must belong to a group.")
        return
      }
      if (!targetGroupId) {
        setImportError("Please select a group to add these fields to.")
        return
      }
      onContentImported(fields, targetGroupId)
      setJsonInput("")
      setImportError("")
      toast.success(`Imported ${fields.length} field(s) from JSON`)
    } catch (e) {
      setImportError("Invalid JSON format: " + e.message)
    }
  }

  const handleEHRImport = () => {
    setImportError("")
    // Simulate EHR system connection
    toast.info("Connecting to EHR system...")
    setTimeout(() => {
      const mockEHRFields = [
        { id: `field-${Date.now()}-1`, type: "text", label: "Resident Name", description: "", required: true, config: {} },
        { id: `field-${Date.now()}-2`, type: "date", label: "Date of Birth", description: "", required: true, config: {} },
        { id: `field-${Date.now()}-3`, type: "text", label: "Medication List", description: "", required: false, config: {} },
        { id: `field-${Date.now()}-4`, type: "checkbox", label: "Medication Compliance", description: "", required: true, config: {} }
      ]
      if (groups.length === 0) {
        setImportError("Please create at least one group before importing fields. All fields must belong to a group.")
        return
      }
      if (!targetGroupId) {
        setImportError("Please select a group to add these fields to.")
        return
      }
      onContentImported(mockEHRFields, targetGroupId)
      toast.success(`Imported ${mockEHRFields.length} field(s) from EHR system`)
    }, 1500)
  }

  const handleAIGenerate = () => {
    if (aiPrompt.trim() === "") {
      setImportError("AI prompt cannot be empty.")
      return
    }
    setImportError("")
    // Simulate AI generation
    toast.info(`Generating content with AI for: "${aiPrompt}"...`)
    setTimeout(() => {
      const mockAIFields = [
        { id: `field-${Date.now()}-1`, type: "text", label: `AI Generated: Resident Assessment`, description: "", required: false, config: {} },
        { id: `field-${Date.now()}-2`, type: "checkbox", label: `AI Generated: Compliance Check (from: ${aiPrompt.substring(0, 30)}...)`, description: "", required: true, config: {} },
        { id: `field-${Date.now()}-3`, type: "textarea", label: `AI Generated: Notes`, description: "", required: false, config: {} }
      ]
      if (groups.length === 0) {
        setImportError("Please create at least one group before generating fields. All fields must belong to a group.")
        return
      }
      if (!targetGroupId) {
        setImportError("Please select a group to add these fields to.")
        return
      }
      onContentImported(mockAIFields, targetGroupId)
      setAiPrompt("")
      toast.success(`Generated ${mockAIFields.length} field(s) using AI`)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold text-base mb-2">Import Content</h4>
        <p className="text-sm text-muted-foreground">
          Add fields to your session using multiple methods. All fields must belong to a group.
        </p>
      </div>

      {/* Group Selector */}
      {groups.length > 0 && (
        <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <Label htmlFor="target-group" className="text-sm font-semibold">
            Add to Group <span className="text-destructive">*</span>
          </Label>
          <select
            id="target-group"
            value={targetGroupId || ""}
            onChange={(e) => {
              const groupId = e.target.value
              setTargetGroupId(groupId)
              if (onGroupSelect) {
                onGroupSelect(groupId)
              }
            }}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium"
            required
          >
            <option value="">Select a group...</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name || "Unnamed Group"}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Select which group to add the imported fields to
          </p>
        </div>
      )}

      {groups.length === 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Please create a group first before adding fields. All fields must belong to a group.
          </p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="manual">
            <Plus className="h-4 w-4 mr-2" />
            Manual
          </TabsTrigger>
          <TabsTrigger value="file">
            <Upload className="h-4 w-4 mr-2" />
            CSV/Excel
          </TabsTrigger>
          <TabsTrigger value="json">
            <Code className="h-4 w-4 mr-2" />
            JSON
          </TabsTrigger>
          <TabsTrigger value="ehr">
            <Database className="h-4 w-4 mr-2" />
            EHR
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Brain className="h-4 w-4 mr-2" />
            AI
          </TabsTrigger>
        </TabsList>

        {importError && (
          <div className="p-3 bg-red-50 rounded-lg mt-4">
            <p className="text-sm text-destructive">{importError}</p>
          </div>
        )}

        {/* Manual Tab */}
        <TabsContent value="manual" className="space-y-4 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-field-label">
                Field Label <span className="text-destructive">*</span>
              </Label>
              <Input
                id="manual-field-label"
                type="text"
                placeholder="e.g., Resident Name, Compliance Check, etc."
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-field-description">
                Description <span className="text-xs font-normal text-muted-foreground">(Optional - Help text for surveyors)</span>
              </Label>
              <Textarea
                id="manual-field-description"
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                placeholder="Provide instructions or explanation for surveyors..."
                rows={3}
                className="text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="manual-field-required"
                checked={manualRequired}
                onChange={(e) => setManualRequired(e.target.checked)}
                className="h-4 w-4 cursor-pointer"
              />
              <Label htmlFor="manual-field-required" className="text-sm font-medium cursor-pointer">
                Required field
              </Label>
            </div>
          </div>

          {/* Preview Section */}
          {manualContent.trim() && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Preview</p>
              {manualDescription && (
                <p className="text-xs text-muted-foreground mb-3 italic">
                  {manualDescription}
                </p>
              )}
              <div className="flex items-center gap-2 mb-2">
                <Input
                  placeholder={manualContent || "Enter text..."}
                  disabled
                  className="flex-1"
                />
                {manualRequired && (
                  <span className="text-xs text-destructive font-medium">*</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {manualRequired ? "Required field" : "Optional field"}
              </p>
            </div>
          )}
          
          <Button 
            type="button"
            onClick={handleManualAdd} 
            className="w-full"
            disabled={!manualContent.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </TabsContent>

        {/* CSV/Excel Tab */}
        <TabsContent value="file" className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="csv-upload">Upload CSV or Excel File</Label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center bg-gray-50/50">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload a CSV or Excel file with field definitions
              </p>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => handleFileUpload(e, "csv")}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('csv-upload')?.click()}
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
        </TabsContent>

        {/* JSON Tab */}
        <TabsContent value="json" className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="json-input">Paste JSON Data</Label>
            <Textarea
              id="json-input"
              placeholder={`[\n  {"type": "text", "label": "Field 1", "required": false},\n  {"type": "checkbox", "label": "Field 2", "required": true}\n]`}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              JSON should be an array of field objects with "type", "label", and optionally "required" properties
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleJSONImport} className="flex-1">
              <Code className="h-4 w-4 mr-2" />
              Import JSON
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.json'
                input.onchange = (e) => handleFileUpload(e, "json")
                input.click()
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload JSON
            </Button>
          </div>
        </TabsContent>

        {/* EHR Tab */}
        <TabsContent value="ehr" className="space-y-4 mt-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="font-semibold mb-2">Connect to EHR System</h4>
            <p className="text-sm text-muted-foreground mb-6">
              Link to your Electronic Health Records (EHR) system to import relevant fields and data points
            </p>
            <Button onClick={handleEHRImport}>
              <Database className="h-4 w-4 mr-2" />
              Connect & Import from EHR
            </Button>
          </div>
        </TabsContent>

        {/* AI Tab */}
        <TabsContent value="ai" className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="ai-prompt">
              AI Prompt <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="ai-prompt"
              placeholder="e.g., Generate 5 fields for resident medication management compliance survey based on Florida regulations..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Describe what fields you need and AI will generate them for you
            </p>
          </div>
          <Button onClick={handleAIGenerate} className="w-full">
            <Brain className="h-4 w-4 mr-2" />
            Generate Fields with AI
          </Button>
        </TabsContent>
      </Tabs>

      {/* Current Fields Count */}
      {currentFields.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-muted-foreground">
            Current fields in session: <span className="text-foreground font-semibold">{currentFields.length}</span>
          </p>
        </div>
      )}
    </div>
  )
}

