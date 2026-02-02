import { useState, useRef, useEffect, useLayoutEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { 
  Mic, 
  Send, 
  Bot, 
  User, 
  ArrowLeft,
  Search,
  Lightbulb,
  ChevronDown,
  Square,
  FileText,
  BookOpen,
  MessageSquare,
  Upload,
  X,
  Sparkles,
  Shield,
  GraduationCap,
  Briefcase
} from "lucide-react"
import { toast } from "sonner"

export default function AskMocky365() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [isThinkingMode, setIsThinkingMode] = useState(false)
  const [searchMode, setSearchMode] = useState("web") // "web", "regulations", "resources", "conversations"
  const [showSearchMenu, setShowSearchMenu] = useState(false)
  const [agentMode, setAgentMode] = useState("general") // "general", "compliance", "training", "legal"
  const [showAgentMenu, setShowAgentMenu] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const fileInputRef = useRef(null)
  const recognitionRef = useRef(null)
  const interimTranscriptRef = useRef("")
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  // Get user's first name
  const getUserName = () => {
    if (user?.name) {
      return user.name.split(" ")[0]
    }
    return user?.email?.split("@")[0] || "there"
  }

  // Check if browser supports speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsRecording(true)
        interimTranscriptRef.current = ""
      }

      recognition.onresult = (event) => {
        let interimTranscript = ""
        let finalTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " "
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          setInputValue(prev => prev + finalTranscript)
          interimTranscriptRef.current = ""
        } else {
          interimTranscriptRef.current = interimTranscript
        }
      }

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        if (event.error === "no-speech") {
          toast.error("No speech detected. Please try again.")
        } else if (event.error === "not-allowed") {
          toast.error("Microphone permission denied. Please enable microphone access.")
        } else {
          toast.error("Speech recognition error. Please try again.")
        }
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
        if (interimTranscriptRef.current) {
          setInputValue(prev => prev + interimTranscriptRef.current)
          interimTranscriptRef.current = ""
        }
      }

      recognitionRef.current = recognition
    } else {
      setIsSupported(false)
      toast.info("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.")
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  // Handle microphone click
  const handleMicClick = () => {
    if (!isSupported) {
      toast.error("Speech recognition is not supported in your browser.")
      return
    }

    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsRecording(false)
    } else {
      // Start recording
      try {
        if (recognitionRef.current) {
          recognitionRef.current.start()
        }
      } catch (error) {
        console.error("Error starting recognition:", error)
        toast.error("Failed to start recording. Please try again.")
      }
    }
  }

  // Handle Think button click
  const handleThinkClick = () => {
    setIsThinkingMode(prev => !prev)
    if (!isThinkingMode) {
      toast.info("Think mode enabled - AI will show reasoning process")
    } else {
      toast.info("Think mode disabled")
    }
  }

  // Handle Search mode selection
  const handleSearchModeSelect = (mode) => {
    setSearchMode(mode)
    setShowSearchMenu(false)
    const modeLabels = {
      web: "Web Search",
      regulations: "Regulations",
      resources: "Resources",
      conversations: "Conversations"
    }
    toast.info(`Search mode: ${modeLabels[mode]}`)
  }

  const searchModeOptions = [
    { value: "web", label: "Web Search", icon: Search, description: "Search the web" },
    { value: "regulations", label: "Regulations", icon: FileText, description: "Search regulations" },
    { value: "resources", label: "Resources", icon: BookOpen, description: "Search resources" },
    { value: "conversations", label: "Conversations", icon: MessageSquare, description: "Search past conversations" }
  ]

  const getSearchModeLabel = () => {
    const option = searchModeOptions.find(opt => opt.value === searchMode)
    return option ? option.label : "Search"
  }

  // Handle Agent mode selection
  const handleAgentModeSelect = (mode) => {
    setAgentMode(mode)
    setShowAgentMenu(false)
    const modeLabels = {
      general: "General Assistant",
      compliance: "Compliance Expert",
      training: "Training Specialist",
      legal: "Legal Advisor"
    }
    toast.info(`Agent mode: ${modeLabels[mode]}`)
  }

  const agentModeOptions = [
    { value: "general", label: "General Assistant", icon: Bot, description: "General purpose AI assistant" },
    { value: "compliance", label: "Compliance Expert", icon: Shield, description: "Specialized in compliance" },
    { value: "training", label: "Training Specialist", icon: GraduationCap, description: "Training and education" },
    { value: "legal", label: "Legal Advisor", icon: Briefcase, description: "Legal and regulatory guidance" }
  ]

  const getAgentModeLabel = () => {
    const option = agentModeOptions.find(opt => opt.value === agentMode)
    return option ? option.label : "Agent"
  }

  // Handle file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is 10MB.`)
        return false
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported file type.`)
        return false
      }
      return true
    })

    const newFiles = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString()
    }))
    
    setUploadedFiles(prev => [...prev, ...newFiles])
    toast.success(`${newFiles.length} file(s) uploaded successfully`)
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
    toast.info("File removed")
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  // Generate thinking steps based on the question
  const generateThinkingSteps = (question) => {
    const lowerQuestion = question.toLowerCase()
    const steps = []

    // Analyze question type
    if (lowerQuestion.includes("compliance") || lowerQuestion.includes("requirement")) {
      steps.push({
        step: 1,
        thought: "The user is asking about compliance requirements. I should identify the relevant regulations and standards.",
        reasoning: "Compliance questions typically require referencing specific regulatory frameworks like Florida FAC Chapter 58A-5."
      })
      steps.push({
        step: 2,
        thought: "I need to consider the context - this is about assisted living facilities in Florida.",
        reasoning: "State-specific regulations apply, so I should focus on Florida's specific requirements."
      })
      steps.push({
        step: 3,
        thought: "Key areas to cover: licensing, staffing, resident care, documentation, and facility standards.",
        reasoning: "These are the main compliance categories for assisted living facilities."
      })
    } else if (lowerQuestion.includes("survey") || lowerQuestion.includes("inspection")) {
      steps.push({
        step: 1,
        thought: "The user wants to know about survey preparation. I should outline the survey process.",
        reasoning: "Understanding the survey process helps facilities prepare effectively."
      })
      steps.push({
        step: 2,
        thought: "I should mention key documents needed: policies, procedures, resident records, staff certifications.",
        reasoning: "Documentation is critical during surveys and demonstrates compliance."
      })
      steps.push({
        step: 3,
        thought: "I should also mention common areas of focus during surveys.",
        reasoning: "Knowing what surveyors look for helps facilities prepare proactively."
      })
    } else if (lowerQuestion.includes("medication") || lowerQuestion.includes("medication management")) {
      steps.push({
        step: 1,
        thought: "This is about medication management. I should cover storage, administration, and documentation requirements.",
        reasoning: "Medication management is a critical compliance area with specific regulations."
      })
      steps.push({
        step: 2,
        thought: "I need to mention staff training requirements and proper documentation procedures.",
        reasoning: "Proper training and documentation are essential for medication safety."
      })
    } else {
      // Generic thinking process
      steps.push({
        step: 1,
        thought: "Let me analyze the user's question to understand what information they need.",
        reasoning: "Understanding the question helps me provide the most relevant and helpful response."
      })
      steps.push({
        step: 2,
        thought: "I should consider the context of assisted living facility compliance and regulations.",
        reasoning: "All responses should be relevant to the assisted living industry and compliance requirements."
      })
      steps.push({
        step: 3,
        thought: "I'll structure my response to be clear, actionable, and reference relevant regulations when applicable.",
        reasoning: "Users need practical, accurate information they can apply to their facility operations."
      })
    }

    return steps
  }

  const handleSend = async (e) => {
    e?.preventDefault()
    
    if (!inputValue.trim()) return

    setShowSuggestions(false)

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputValue,
      timestamp: new Date().toISOString(),
      files: uploadedFiles.length > 0 ? uploadedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })) : null,
      agentMode: agentMode
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = inputValue
    const currentFiles = [...uploadedFiles]
    setInputValue("")
    // Keep uploaded files visible in input area - user can remove them manually if needed
    // setUploadedFiles([]) // Don't clear uploaded files after sending
    setIsLoading(true)
    
    // Force scroll after user message is added
    setTimeout(() => {
      scrollToBottom(false, true)
    }, 0)

    // Generate thinking steps if think mode is enabled
    const thinkingSteps = isThinkingMode ? generateThinkingSteps(currentInput) : null

    // Simulate AI response with thinking
    setTimeout(() => {
      let responseContent = "I understand you're asking about: " + currentInput + ". "
      
      if (currentFiles.length > 0) {
        responseContent += `I've reviewed the ${currentFiles.length} document(s) you uploaded: ${currentFiles.map(f => f.name).join(", ")}. `
      }
      
      const agentModeLabels = {
        general: "General Assistant",
        compliance: "Compliance Expert",
        training: "Training Specialist",
        legal: "Legal Advisor"
      }
      responseContent += `As your ${agentModeLabels[agentMode]}, this is a mock response. In the full implementation, I would provide detailed assistance with compliance questions, survey preparation, regulation references, and more.`
      
      const assistantMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: responseContent,
        timestamp: new Date().toISOString(),
        thinking: thinkingSteps,
        agentMode: agentMode
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
      
      // Force scroll after AI response is added
      setTimeout(() => {
        scrollToBottom(false, true)
      }, 0)
      setTimeout(() => {
        scrollToBottom(true, false)
      }, 100)
    }, isThinkingMode ? 2000 : 1000) // Longer delay when showing thinking
  }

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion)
    setShowSuggestions(false)
  }

  const suggestedPrompts = [
    "What are the key requirements for assisted living facility compliance?",
    "How do I prepare for a state survey?",
    "What documentation is needed for medication management?",
    "Explain the difference between assisted living and memory care regulations"
  ]

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  }

  // Scroll to bottom of messages - robust implementation
  const scrollToBottom = (smooth = true, force = false) => {
    const performScroll = () => {
      const container = messagesContainerRef.current
      
      if (!container) {
        // Fallback to scrollIntoView if container not available
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: smooth ? "smooth" : "auto",
            block: "end",
            inline: "nearest"
          })
        }
        return false
      }
      
      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight
      const maxScroll = scrollHeight - clientHeight
      
      // Scroll to absolute bottom
      if (smooth && !force) {
        container.scrollTo({
          top: scrollHeight,
          behavior: 'smooth'
        })
      } else {
        // Force instant scroll
        container.scrollTop = scrollHeight
      }
      
      // Return true if scroll was successful
      return container.scrollTop >= maxScroll - 1
    }
    
    // Try immediately
    let success = performScroll()
    
    // Also try after delays to catch DOM updates
    if (force || !success) {
      setTimeout(() => performScroll(), 10)
      setTimeout(() => performScroll(), 50)
      setTimeout(() => performScroll(), 100)
      setTimeout(() => performScroll(), 200)
    } else {
      setTimeout(() => performScroll(), 50)
    }
  }

  // Auto-scroll when messages change - use useLayoutEffect for immediate DOM updates
  useLayoutEffect(() => {
    if (messages.length > 0 && !showSuggestions) {
      // Force scroll immediately after DOM update
      scrollToBottom(false, true)
    }
  }, [messages, showSuggestions])

  // Also use useEffect for smooth scrolling after content is fully rendered
  useEffect(() => {
    if (messages.length > 0 && !showSuggestions) {
      // Multiple scroll attempts to ensure it works
      const timeout1 = setTimeout(() => {
        scrollToBottom(false, true)
      }, 50)
      
      const timeout2 = setTimeout(() => {
        scrollToBottom(false, true)
      }, 150)
      
      const timeout3 = setTimeout(() => {
        scrollToBottom(true, false)
      }, 300)
      
      return () => {
        clearTimeout(timeout1)
        clearTimeout(timeout2)
        clearTimeout(timeout3)
      }
    }
  }, [messages, isLoading, showSuggestions])

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Top Header - Fixed */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-32 max-w-4xl mx-auto w-full min-h-0">
        {messages.length === 0 && showSuggestions ? (
          <>
            {/* Greeting */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {getGreeting()}, {getUserName()}.
              </h2>
              <p className="text-lg text-gray-600">
                How can I help you today?
              </p>
            </div>

            {/* Input Area - Fixed at bottom for chat mode */}
            <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              {/* Agent Mode Selector */}
              <div className="mb-3 pb-3 border-b border-gray-100">
                <Popover open={showAgentMenu} onOpenChange={setShowAgentMenu}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                      <Sparkles className="h-3.5 w-3.5" />
                      {getAgentModeLabel()}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" side="bottom" align="start">
                    <div className="space-y-1">
                      {agentModeOptions.map((option) => {
                        const Icon = option.icon
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleAgentModeSelect(option.value)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                              agentMode === option.value
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-gray-100 text-gray-700"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <div className="flex-1 text-left">
                              <div className="font-medium">{option.label}</div>
                              <div className={`text-xs ${agentMode === option.value ? "text-primary-foreground/70" : "text-gray-500"}`}>
                                {option.description}
                              </div>
                            </div>
                            {agentMode === option.value && (
                              <div className="w-2 h-2 rounded-full bg-current" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Uploaded Files Display */}
              {uploadedFiles.length > 0 && (
                <div className="mb-3 pb-3 border-b border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-md text-xs border border-gray-200"
                      >
                        <FileText className="h-3.5 w-3.5 text-gray-600" />
                        <span className="text-gray-700 max-w-[150px] truncate">{file.name}</span>
                        <span className="text-gray-500">({formatFileSize(file.size)})</span>
                        <button
                          onClick={() => handleRemoveFile(file.id)}
                          className="ml-1 hover:text-red-600 transition-colors"
                          title="Remove file"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                /> 
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload documents"
                >
                  <Upload className="h-4 w-4" />
                </Button> 
                <Button 
                  variant={isRecording ? "destructive" : "ghost"} 
                  size="icon" 
                  className={`h-8 w-8 ${isRecording ? "animate-pulse" : ""}`}
                  onClick={handleMicClick}
                  title={isRecording ? "Stop recording" : "Start voice recording"}
                >
                  {isRecording ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
                {isRecording && (
                  <span className="text-xs text-red-600 font-medium animate-pulse">
                    Recording...
                  </span>
                )} 
                <Popover open={showSearchMenu} onOpenChange={setShowSearchMenu}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1">
                      <Search className="h-3.5 w-3.5" />
                      {getSearchModeLabel()}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" side="top" align="start">
                    <div className="space-y-1">
                      {searchModeOptions.map((option) => {
                        const Icon = option.icon
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleSearchModeSelect(option.value)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                              searchMode === option.value
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-gray-100 text-gray-700"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <div className="flex-1 text-left">
                              <div className="font-medium">{option.label}</div>
                              <div className={`text-xs ${searchMode === option.value ? "text-primary-foreground/70" : "text-gray-500"}`}>
                                {option.description}
                              </div>
                            </div>
                            {searchMode === option.value && (
                              <div className="w-2 h-2 rounded-full bg-current" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
                <Button 
                  variant={isThinkingMode ? "default" : "outline"} 
                  size="sm" 
                  className={`h-8 gap-1 ${isThinkingMode ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={handleThinkClick}
                  title={isThinkingMode ? "Disable think mode" : "Enable think mode to see AI reasoning"}
                >
                  <Lightbulb className={`h-3.5 w-3.5 ${isThinkingMode ? "fill-current" : ""}`} />
                  Think
                </Button>
                <div className="flex-1" />
                <Button
                  type="submit"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => inputValue.trim() && handleSend()}
                  disabled={!inputValue.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleSend} className="w-full">
                <div className="relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask a question about compliance, regulations, surveys..."
                    className="border-0 focus-visible:ring-0 text-base h-auto py-2 px-0"
                    disabled={isLoading || isRecording}
                  />
                  {isRecording && interimTranscriptRef.current && (
                    <div className="absolute left-0 top-2 pointer-events-none text-gray-400">
                      {inputValue}
                      <span className="text-gray-300 italic">{interimTranscriptRef.current}</span>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Suggested Prompts */}
            <div className="w-full space-y-2">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(prompt)}
                  className="w-full text-left px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-sm text-gray-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Chat Messages */
          <div className="w-full flex-1 flex flex-col min-h-0">
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto space-y-6 px-2 pt-4 pb-8"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    {/* Uploaded Files in User Messages */}
                    {message.files && message.files.length > 0 && (
                      <div className={`mb-3 pb-3 border-b ${message.role === "user" ? "border-primary-foreground/20" : "border-gray-200"}`}>
                        <div className="flex flex-wrap gap-2">
                          {message.files.map((file, index) => (
                            <div
                              key={index}
                              className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs border ${
                                message.role === "user"
                                  ? "bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground"
                                  : "bg-gray-50 border-gray-200 text-gray-700"
                              }`}
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span className="max-w-[150px] truncate">{file.name}</span>
                              <span className="opacity-70">({formatFileSize(file.size)})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Agent Mode Badge in Assistant Messages */}
                    {message.role === "assistant" && message.agentMode && (
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-md text-xs font-medium">
                          <Sparkles className="h-3 w-3" />
                          {agentModeOptions.find(opt => opt.value === message.agentMode)?.label || "Assistant"}
                        </span>
                      </div>
                    )}

                    {/* Thinking Steps */}
                    {message.thinking && message.thinking.length > 0 && (
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="h-4 w-4 text-amber-500 fill-amber-500" />
                          <span className="text-xs font-semibold text-gray-700">Thinking Process</span>
                        </div>
                        <div className="space-y-3">
                          {message.thinking.map((step, index) => (
                            <div key={index} className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                              <div className="flex items-start gap-2 mb-1">
                                <span className="text-xs font-semibold text-amber-700 bg-amber-200 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                                  {step.step}
                                </span>
                                <p className="text-xs text-amber-900 font-medium flex-1">
                                  {step.thought}
                                </p>
                              </div>
                              <p className="text-xs text-amber-700 ml-7 italic">
                                {step.reasoning}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Main Response */}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                    <p
                      className={`text-xs mt-2 ${
                        message.role === "user"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 max-w-[80%]">
                    {isThinkingMode ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb className="h-4 w-4 text-amber-500 fill-amber-500 animate-pulse" />
                          <span className="text-xs font-semibold text-gray-700">Thinking...</span>
                        </div>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Scroll anchor - invisible element at the bottom with padding */}
              <div ref={messagesEndRef} className="h-1 w-full flex-shrink-0" />
            </div>

            {/* Input Area (when in chat mode) - Fixed */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#f5f5f5] border-t border-gray-200 p-4">
              <div className="max-w-4xl mx-auto">
                <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                  {/* Uploaded Files Display */}
                  {uploadedFiles.length > 0 && (
                    <div className="mb-3 pb-3 border-b border-gray-100">
                      <div className="flex flex-wrap gap-2">
                        {uploadedFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-md text-xs border border-gray-200"
                          >
                            <FileText className="h-3.5 w-3.5 text-gray-600" />
                            <span className="text-gray-700 max-w-[150px] truncate">{file.name}</span>
                            <span className="text-gray-500">({formatFileSize(file.size)})</span>
                            <button
                              onClick={() => handleRemoveFile(file.id)}
                              className="ml-1 hover:text-red-600 transition-colors"
                              title="Remove file"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

              <div className="flex items-center gap-2 mb-2">
              <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload documents"
                >
                  <Upload className="h-4 w-4" />
                </Button> 
                <Button 
                  variant={isRecording ? "destructive" : "ghost"} 
                  size="icon" 
                  className={`h-8 w-8 ${isRecording ? "animate-pulse" : ""}`}
                  onClick={handleMicClick}
                  title={isRecording ? "Stop recording" : "Start voice recording"}
                >
                  {isRecording ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
                {isRecording && (
                  <span className="text-xs text-red-600 font-medium animate-pulse">
                    Recording...
                  </span>
                )}
                <Popover open={showSearchMenu} onOpenChange={setShowSearchMenu}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1">
                      <Search className="h-3.5 w-3.5" />
                      {getSearchModeLabel()}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" side="top" align="start">
                    <div className="space-y-1">
                      {searchModeOptions.map((option) => {
                        const Icon = option.icon
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleSearchModeSelect(option.value)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                              searchMode === option.value
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-gray-100 text-gray-700"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            <div className="flex-1 text-left">
                              <div className="font-medium">{option.label}</div>
                              <div className={`text-xs ${searchMode === option.value ? "text-primary-foreground/70" : "text-gray-500"}`}>
                                {option.description}
                              </div>
                            </div>
                            {searchMode === option.value && (
                              <div className="w-2 h-2 rounded-full bg-current" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
                <Button 
                  variant={isThinkingMode ? "default" : "outline"} 
                  size="sm" 
                  className={`h-8 gap-1 ${isThinkingMode ? "bg-primary text-primary-foreground" : ""}`}
                  onClick={handleThinkClick}
                  title={isThinkingMode ? "Disable think mode" : "Enable think mode to see AI reasoning"}
                >
                  <Lightbulb className={`h-3.5 w-3.5 ${isThinkingMode ? "fill-current" : ""}`} />
                  Think
                </Button>
                <div className="flex-1" />
                <Button
                  type="submit"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => inputValue.trim() && handleSend()}
                  disabled={!inputValue.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleSend} className="w-full">
                <div className="relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask a question about compliance, regulations, surveys..."
                    className="border-0 focus-visible:ring-0 text-base h-auto py-2 px-0"
                    disabled={isLoading || isRecording}
                  />
                  {isRecording && interimTranscriptRef.current && (
                    <div className="absolute left-0 top-2 pointer-events-none text-gray-400">
                      {inputValue}
                      <span className="text-gray-300 italic">{interimTranscriptRef.current}</span>
                    </div>
                  )}
                </div>
              </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
