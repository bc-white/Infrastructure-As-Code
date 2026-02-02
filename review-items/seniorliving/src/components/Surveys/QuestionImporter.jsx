import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileJson, Database, Sparkles, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"

export default function QuestionImporter({ sections = [], onQuestionsImported }) {
  const [activeTab, setActiveTab] = useState("manual")
  const [importMethod, setImportMethod] = useState("manual")
  const [csvFile, setCsvFile] = useState(null)
  const [jsonData, setJsonData] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileUpload = (e, type) => {
    const file = e.target.files?.[0]
    if (file) {
      if (type === "csv") {
        setCsvFile(file)
      }
    }
  }

  const handleCSVImport = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!csvFile) {
      toast.error("Please select a CSV/Excel file")
      return
    }

    setIsProcessing(true)
    try {
      // Mock CSV processing - in real app, parse CSV file
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock parsed questions from CSV
      const mockQuestions = [
        {
          id: `q-${Date.now()}-1`,
          text: "Sample Question 1 from CSV",
          type: "radio",
          required: true,
          sectionId: sections[0]?.id,
          order: 1,
          options: [
            { id: `opt-1`, label: "Yes", value: "yes", order: 1 },
            { id: `opt-2`, label: "No", value: "no", order: 2 }
          ]
        }
      ]

      onQuestionsImported(mockQuestions)
      toast.success(`Successfully imported ${mockQuestions.length} question(s) from CSV`)
      setCsvFile(null)
    } catch (error) {
      toast.error("Failed to import CSV: " + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleJSONImport = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!jsonData.trim()) {
      toast.error("Please enter JSON data")
      return
    }

    setIsProcessing(true)
    try {
      const parsed = JSON.parse(jsonData)
      
      // Validate and format questions
      const questions = Array.isArray(parsed.questions) 
        ? parsed.questions.map((q, i) => ({
            id: q.id || `q-${Date.now()}-${i}`,
            text: q.text || q.question || "",
            type: q.type || "text",
            required: q.required !== undefined ? q.required : true,
            sectionId: q.sectionId || sections[0]?.id,
            order: q.order || i + 1,
            options: q.options || [],
            helpText: q.helpText || "",
            validation: q.validation || {}
          }))
        : []

      if (questions.length === 0) {
        toast.error("No valid questions found in JSON")
        return
      }

      onQuestionsImported(questions)
      toast.success(`Successfully imported ${questions.length} question(s) from JSON`)
      setJsonData("")
    } catch (error) {
      toast.error("Invalid JSON format: " + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEHRImport = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setIsProcessing(true)
    try {
      // Mock EHR import - simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockQuestions = [
        {
          id: `q-${Date.now()}-1`,
          text: "Sample Question from EHR System",
          type: "checkbox",
          required: true,
          sectionId: sections[0]?.id,
          order: 1,
          options: []
        }
      ]

      onQuestionsImported(mockQuestions)
      toast.success("Successfully imported questions from EHR system")
    } catch (error) {
      toast.error("Failed to import from EHR: " + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAIGenerate = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!aiPrompt.trim()) {
      toast.error("Please enter a prompt for AI generation")
      return
    }

    setIsProcessing(true)
    try {
      // Mock AI generation - simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Mock AI-generated questions based on prompt
      const mockQuestions = [
        {
          id: `q-${Date.now()}-1`,
          text: "AI Generated Question 1 based on your prompt",
          type: "radio",
          required: true,
          sectionId: sections[0]?.id,
          order: 1,
          options: [
            { id: `opt-1`, label: "Yes", value: "yes", order: 1 },
            { id: `opt-2`, label: "No", value: "no", order: 2 }
          ]
        },
        {
          id: `q-${Date.now()}-2`,
          text: "AI Generated Question 2 based on your prompt",
          type: "textarea",
          required: false,
          sectionId: sections[0]?.id,
          order: 2,
          options: []
        }
      ]

      onQuestionsImported(mockQuestions)
      toast.success(`AI generated ${mockQuestions.length} question(s)`)
      setAiPrompt("")
    } catch (error) {
      toast.error("Failed to generate questions: " + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Import Questions</h3>
        <p className="text-sm text-muted-foreground">
          Add questions to your survey using one of the methods below
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="manual">Manual</TabsTrigger>
          <TabsTrigger value="csv">CSV/Excel</TabsTrigger>
          <TabsTrigger value="json">JSON</TabsTrigger>
          <TabsTrigger value="ehr">EHR</TabsTrigger>
          <TabsTrigger value="ai">AI Generate</TabsTrigger>
        </TabsList>

        {/* Manual Entry */}
        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Manual Entry
              </CardTitle>
              <CardDescription>
                Add questions manually one by one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Use the "Add Question" button below to manually create questions for each section.
              </p>
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const newQuestion = {
                    id: `q-${Date.now()}`,
                    text: "",
                    type: "text",
                    required: true,
                    sectionId: sections[0]?.id,
                    order: 1,
                    options: []
                  }
                  onQuestionsImported([newQuestion])
                }}
                variant="outline"
              >
                Add Question Manually
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CSV/Excel Upload */}
        <TabsContent value="csv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                CSV/Excel Upload
              </CardTitle>
              <CardDescription>
                Upload a CSV or Excel file with your questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-file">Select CSV/Excel File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => handleFileUpload(e, "csv")}
                  disabled={isProcessing}
                />
                {csvFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {csvFile.name}
                  </p>
                )}
              </div>
              <Button
                type="button"
                onClick={handleCSVImport}
                disabled={!csvFile || isProcessing}
              >
                {isProcessing ? "Processing..." : "Import from CSV/Excel"}
              </Button>
              <p className="text-xs text-muted-foreground">
                CSV format: Question Text, Type, Required (Yes/No), Options (comma-separated)
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* JSON Import */}
        <TabsContent value="json" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                JSON Import
              </CardTitle>
              <CardDescription>
                Paste JSON data with your questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="json-data">JSON Data</Label>
                <textarea
                  id="json-data"
                  rows={10}
                  placeholder='{"questions": [{"text": "Question 1", "type": "radio", "required": true, "options": [{"label": "Yes", "value": "yes"}]}]}'
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isProcessing}
                />
              </div>
              <Button
                type="button"
                onClick={handleJSONImport}
                disabled={!jsonData.trim() || isProcessing}
              >
                {isProcessing ? "Processing..." : "Import from JSON"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EHR Import */}
        <TabsContent value="ehr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                EHR System Import
              </CardTitle>
              <CardDescription>
                Import questions from your existing EHR system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect to your EHR system to import existing survey questions and templates.
              </p>
              <Button
                type="button"
                onClick={handleEHRImport}
                disabled={isProcessing}
              >
                {isProcessing ? "Connecting to EHR..." : "Import from EHR System"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Note: EHR integration requires system configuration. Contact support for setup.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Generation */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Question Generation
              </CardTitle>
              <CardDescription>
                Generate questions and sections using AI based on your prompt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-prompt">Describe what you need</Label>
                <textarea
                  id="ai-prompt"
                  rows={6}
                  placeholder="e.g., 'Create a survey for resident care services in an assisted living facility. Include questions about medication management, activities of daily living, and safety protocols.'"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isProcessing}
                />
              </div>
              <Button
                type="button"
                onClick={handleAIGenerate}
                disabled={!aiPrompt.trim() || isProcessing}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isProcessing ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Questions with AI
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                AI will generate questions and organize them into appropriate sections based on your description.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

