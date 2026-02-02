import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { 
  Plus, 
  Upload, 
  Code, 
  Database, 
  FileSpreadsheet,
  Building2,
  Brain,
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"

const IMPORT_METHODS = {
  MANUAL: 'manual',
  BULK_UPLOAD: 'bulk_upload',
  SYSTEM_LINK: 'system_link'
}

export default function SessionImportMethod({
  selectedMethod,
  onMethodSelect,
  onBulkUpload,
  onSystemLink,
  jsonInput = "",
  onJsonInputChange,
  fileInput = null,
  onFileInputChange
}) {
  const [localJsonInput, setLocalJsonInput] = useState(jsonInput)
  const [localFileInput, setLocalFileInput] = useState(fileInput)
  const [bulkUploadError, setBulkUploadError] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeUploadTab, setActiveUploadTab] = useState("file")

  const handleMethodSelect = (method) => {
    onMethodSelect(method)
  }

  const handleFileUpload = (event) => {
    const file = event.target?.files?.[0] || event.target?.files?.[0]
    if (file) {
      setLocalFileInput(file)
      setBulkUploadError("")
      
      // If it's a JSON file, read and populate the JSON textarea
      if (file.name.endsWith('.json')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const jsonContent = e.target.result
            // Validate JSON
            JSON.parse(jsonContent)
            setLocalJsonInput(jsonContent)
            handleJsonInputChange(jsonContent)
            setBulkUploadError("")
            // Switch to JSON tab to show the populated data
            setActiveUploadTab("json")
          } catch (error) {
            setBulkUploadError("Invalid JSON file: " + error.message)
          }
        }
        reader.onerror = () => {
          setBulkUploadError("Error reading file")
        }
        reader.readAsText(file)
      }
      
      if (onFileInputChange) {
        onFileInputChange(file)
      }
    }
  }

  const handleJsonInputChange = (value) => {
    setLocalJsonInput(value)
    setBulkUploadError("")
    if (onJsonInputChange) {
      onJsonInputChange(value)
    }
  }

  const handleBulkUpload = () => {
    if (localFileInput) {
      setIsProcessing(true)
      setBulkUploadError("")
      
      // Read file content
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const fileContent = e.target.result
          let sessions = []
          
          if (localFileInput.name.endsWith('.json')) {
            // Parse JSON file
            const parsed = JSON.parse(fileContent)
            sessions = Array.isArray(parsed) ? parsed : (parsed.sessions || [])
          } else if (localFileInput.name.endsWith('.csv') || localFileInput.name.endsWith('.xlsx') || localFileInput.name.endsWith('.xls')) {
            // For CSV/Excel, simulate parsing (in real app, use a library like papaparse or xlsx)
            // For now, create mock sessions
            sessions = [
              { id: `phase-${Date.now()}-1`, name: "Document Review", description: "Review all documents", order: 1, groups: [], documents: [] },
              { id: `phase-${Date.now()}-2`, name: "Resident Interviews", description: "Conduct interviews", order: 2, groups: [], documents: [] }
            ]
          }
          
          if (onBulkUpload) {
            onBulkUpload({ type: 'file', file: localFileInput, sessions })
            // Clear inputs after successful upload
            setTimeout(() => {
              setLocalFileInput(null)
              setLocalJsonInput("")
              if (onFileInputChange) onFileInputChange(null)
              if (onJsonInputChange) onJsonInputChange("")
              setIsProcessing(false)
            }, 100)
          } else {
            setIsProcessing(false)
          }
        } catch (error) {
          setBulkUploadError("Error processing file: " + error.message)
          setIsProcessing(false)
        }
      }
      
      reader.onerror = () => {
        setBulkUploadError("Error reading file")
        setIsProcessing(false)
      }
      
      reader.readAsText(localFileInput)
    } else if (localJsonInput.trim()) {
      try {
        const parsed = JSON.parse(localJsonInput)
        const sessions = Array.isArray(parsed) ? parsed : (parsed.sessions || [])
        
        if (!sessions || sessions.length === 0) {
          setBulkUploadError("JSON must contain at least one session")
          return
        }
        
        setIsProcessing(true)
        setBulkUploadError("")
        
        if (onBulkUpload) {
          onBulkUpload({ type: 'json', data: localJsonInput, sessions })
          // Clear inputs after successful upload
          setTimeout(() => {
            setLocalJsonInput("")
            setLocalFileInput(null)
            if (onJsonInputChange) onJsonInputChange("")
            if (onFileInputChange) onFileInputChange(null)
            setIsProcessing(false)
          }, 100)
        } else {
          setIsProcessing(false)
        }
      } catch (e) {
        setBulkUploadError("Invalid JSON format: " + e.message)
      }
    } else {
      setBulkUploadError("Please select a file or enter JSON data")
    }
  }

  const handleSystemLink = (systemType) => {
    if (onSystemLink) {
      onSystemLink(systemType)
    }
  }

  const methods = [
    {
      id: IMPORT_METHODS.MANUAL,
      title: "Manual Setup",
      description: "Build sessions one at a time with full control",
      icon: Plus,
      color: "blue"
    },
    {
      id: IMPORT_METHODS.BULK_UPLOAD,
      title: "Bulk Upload",
      description: "Import multiple sessions from CSV, Excel, or JSON files",
      icon: Upload,
      color: "green"
    },
    {
      id: IMPORT_METHODS.SYSTEM_LINK,
      title: "Link to System",
      description: "Connect to Epic, PointClickCare, or your EHR system",
      icon: Database,
      color: "purple"
    }
  ]

  const systems = [
    {
      id: 'epic',
      name: 'Epic',
      description: 'Connect to Epic EHR system',
      icon: Building2
    },
    {
      id: 'pointclickcare',
      name: 'PointClickCare',
      description: 'Connect to PointClickCare system',
      icon: Building2
    },
    {
      id: 'other',
      name: 'Other System',
      description: 'Connect to another EHR or care management system',
      icon: Database
    }
  ]

  return (
    <div className="space-y-8">
      {/* Method Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {methods.map((method) => {
          const Icon = method.icon
          const isSelected = selectedMethod === method.id
          
          return (
            <Card
              key={method.id}
              className={cn(
                "cursor-pointer transition-all border-2 hover:border-primary/50 hover:shadow-sm",
                isSelected 
                  ? "border-primary bg-primary/5 shadow-sm" 
                  : "border-gray-200 bg-white"
              )}
              onClick={() => handleMethodSelect(method.id)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={cn(
                    "w-14 h-14 rounded-lg flex items-center justify-center transition-colors",
                    isSelected 
                      ? "bg-primary text-white" 
                      : "bg-gray-100 text-gray-600"
                  )}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="w-full">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{method.title}</h3>
                      {isSelected && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {method.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Configuration Based on Selected Method */}
      {selectedMethod === IMPORT_METHODS.BULK_UPLOAD && (
        <div className="mt-4 p-6 border border-gray-200 rounded-lg bg-white">
          <Tabs value={activeUploadTab} onValueChange={(value) => {
            setActiveUploadTab(value)
            // Clear errors when switching tabs
            setBulkUploadError("")
          }} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="file">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="json">
                <Code className="h-4 w-4 mr-2" />
                Paste JSON
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="bulk-file-upload" className="text-sm font-medium">
                  Upload File
                </Label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary/50 transition-colors bg-gray-50/50 cursor-pointer"
                  onClick={() => document.getElementById('bulk-file-upload')?.click()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files[0]
                    if (file) {
                      const fakeEvent = { target: { files: [file] } }
                      handleFileUpload(fakeEvent)
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 text-muted-foreground/60" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Supports CSV, Excel, or JSON files
                  </p>
                  <Input
                    id="bulk-file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      document.getElementById('bulk-file-upload')?.click()
                    }}
                    disabled={isProcessing}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                </div>
                {localFileInput && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">
                      ✓ {localFileInput.name}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="json" className="space-y-4 mt-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-json-input" className="text-sm font-medium">
                    Paste JSON Data
                  </Label>
                  <Textarea
                    id="bulk-json-input"
                    placeholder={`[\n  {\n    "name": "Document Review",\n    "description": "Review all documents"\n  },\n  {\n    "name": "Resident Interviews",\n    "description": "Conduct interviews"\n  }\n]`}
                    value={localJsonInput}
                    onChange={(e) => handleJsonInputChange(e.target.value)}
                    rows={12}
                    className="flex min-h-[240px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  />
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulk-json-file-upload" className="text-sm font-medium">
                    Upload JSON File
                  </Label>
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary/50 transition-colors bg-gray-50/50 cursor-pointer"
                    onClick={() => document.getElementById('bulk-json-file-upload')?.click()}
                    onDrop={(e) => {
                      e.preventDefault()
                      const file = e.dataTransfer.files[0]
                      if (file && file.name.endsWith('.json')) {
                        const reader = new FileReader()
                        reader.onload = (event) => {
                          try {
                            const jsonContent = event.target.result
                            JSON.parse(jsonContent)
                            setLocalJsonInput(jsonContent)
                            handleJsonInputChange(jsonContent)
                            setBulkUploadError("")
                          } catch (error) {
                            setBulkUploadError("Invalid JSON file: " + error.message)
                          }
                        }
                        reader.readAsText(file)
                      } else {
                        setBulkUploadError("Please upload a JSON file")
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <Code className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
                    <p className="text-sm font-medium text-foreground mb-1">
                      Drop JSON file here or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Supports .json files only
                    </p>
                    <Input
                      id="bulk-json-file-upload"
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          setBulkUploadError("")
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            try {
                              const jsonContent = event.target.result
                              // Validate JSON
                              JSON.parse(jsonContent)
                              setLocalJsonInput(jsonContent)
                              handleJsonInputChange(jsonContent)
                              setBulkUploadError("")
                            } catch (error) {
                              setBulkUploadError("Invalid JSON file: " + error.message)
                            }
                          }
                          reader.onerror = () => {
                            setBulkUploadError("Error reading file")
                          }
                          reader.readAsText(file)
                        }
                      }}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        document.getElementById('bulk-json-file-upload')?.click()
                      }}
                      disabled={isProcessing}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose JSON File
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {bulkUploadError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-destructive">{bulkUploadError}</p>
            </div>
          )}

          <Button
            type="button"
            onClick={handleBulkUpload}
            disabled={(!localFileInput && !localJsonInput.trim()) || isProcessing}
            className="w-full mt-6"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-pulse" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Sessions
              </>
            )}
          </Button>
        </div>
      )}

      {selectedMethod === IMPORT_METHODS.SYSTEM_LINK && (
        <div className="mt-4 p-6 border border-gray-200 rounded-lg bg-white">
          <p className="text-sm text-muted-foreground mb-6 text-center">
            Select your EHR or care management system to connect and import session templates
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {systems.map((system) => {
              const Icon = system.icon
              return (
                <Card
                  key={system.id}
                  className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm border-2 border-gray-200"
                  onClick={() => handleSystemLink(system.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-14 h-14 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Icon className="h-7 w-7" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-base mb-1">{system.name}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {system.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> System integration requires initial setup. Our support team will help you configure the connection securely.
            </p>
          </div>
        </div>
      )}

      {selectedMethod === IMPORT_METHODS.MANUAL && (
        <div className="mt-4 p-6 border border-gray-200 rounded-lg bg-white">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              You'll create sessions manually in the next step. Click <strong>Continue</strong> to proceed.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export { IMPORT_METHODS }

