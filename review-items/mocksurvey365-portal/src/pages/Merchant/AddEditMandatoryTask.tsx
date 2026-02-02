import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { resolveToken } from "@/utils/resolveToken";
import { tokens } from "@/styles/theme";
import { getTheme } from "@/styles/getTheme";
import { ArrowLeft, Plus, X, Download, Video, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { 
  getMandatoryTaskById, 
  createMandatoryTask, 
  updateMandatoryTask,
  type MandatoryTaskPayload,
  type Question as ServiceQuestion,
  type Category as ServiceCategory
} from "@/api/services/mandatoryTasksService";

// Local interfaces that extend service types
interface Question extends ServiceQuestion {
  id: string; // Ensure id is always string, not optional
}

interface Category extends Omit<ServiceCategory, 'questions'> {
  questions: Question[]; // Use local Question type
}

const AddEditMandatoryTask = () => {
  const theme = getTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    version_date: "",
    source_citation: "",
    description: "",
    tag: "",
    categories: [] as Category[],
    questions: [] as Question[], // Legacy flat list
  });

  const [newQuestion, setNewQuestion] = useState("");
  const [newQuestionNumber, setNewQuestionNumber] = useState<number | undefined>(undefined);
  const [newQuestionFTag, setNewQuestionFTag] = useState("");
  const [newQuestionCategory, setNewQuestionCategory] = useState("");
  const [newQuestionNotApplicable, setNewQuestionNotApplicable] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  // File input refs
  const questionsFileInputRef = useRef<HTMLInputElement>(null);
  const taskFileInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch task data when editing
  useEffect(() => {
    const fetchTask = async () => {
    if (isEdit && id) {
        setIsFetching(true);
        try {
          const task = await getMandatoryTaskById(id);
          if (task) {
            // Flatten questions from categories if they exist, otherwise use flat questions
            const allQuestions: Question[] = task.categories 
              ? task.categories.flatMap((cat: ServiceCategory) => 
                  cat.questions.map((q: ServiceQuestion) => ({
                    id: q.id || Date.now().toString() + Math.random(),
                    number: q.number,
                    text: q.text,
                    question: q.question || q.text || "",
                    f_tag: q.f_tag,
                    tag: q.tag || q.f_tag || "",
                    not_applicable_allowed: q.not_applicable_allowed,
                  }))
                )
              : (task.questions || []).map((q: ServiceQuestion) => ({
                  id: q.id || Date.now().toString() + Math.random(),
                  number: q.number,
                  text: q.text,
                  question: q.question || q.text || "",
                  f_tag: q.f_tag,
                  tag: q.tag || q.f_tag || "",
                  not_applicable_allowed: q.not_applicable_allowed,
                }));

            // Map categories to local Category type
            const mappedCategories: Category[] = (task.categories || []).map((cat: ServiceCategory) => ({
              name: cat.name,
              ftags: cat.ftags,
              f_tags: cat.f_tags,
              observations: cat.observations,
              questions: cat.questions.map((q: ServiceQuestion) => ({
                id: q.id || Date.now().toString() + Math.random(),
                number: q.number,
                text: q.text,
                question: q.question || q.text || "",
                f_tag: q.f_tag,
                tag: q.tag || q.f_tag || "",
                not_applicable_allowed: q.not_applicable_allowed,
              })),
            }));

      setFormData({
              title: task.title,
              version_date: task.version_date || "",
              source_citation: task.source_citation || "",
              description: task.facilityTask || task.desc || task.description || "",
              tag: task.tag || "",
              categories: mappedCategories,
              questions: allQuestions,
            });
          } else {
            toast.error("Mandatory task not found");
            navigate("/dashboard/mandatory-tasks");
          }
        } catch (error: any) {
          console.error("Failed to fetch mandatory task:", error);
          toast.error(error?.response?.data?.message || "Failed to load mandatory task");
          navigate("/dashboard/mandatory-tasks");
        } finally {
          setIsFetching(false);
        }
      }
    };

    fetchTask();
  }, [isEdit, id, navigate]);

  const validateStep1 = () => {
    return (
      formData.title.trim().length > 0 &&
      formData.description.trim().length > 0
    );
  };

  const validateStep2 = () => {
    // Check if we have questions either in categories or flat list
    const hasQuestions = formData.questions.length > 0 || 
                        formData.categories.some(cat => cat.questions.length > 0);
    return hasQuestions;
  };

  const validateStep3 = () => {
    // Review step – no new required inputs; rely on previous validations
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) {
      if (!validateStep1()) {
        toast.error("Please complete Step 1: Title and Description are required");
      } else if (!validateStep2()) {
        toast.error("Please complete Step 2: At least one question is required");
      }
      return;
    }

    setLoading(true);
    try {
      // Prepare payload as object
      // If categories exist, use them; otherwise use flat questions
      const payload: MandatoryTaskPayload = {
        title: formData.title,
        version_date: formData.version_date || undefined,
        source_citation: formData.source_citation || undefined,
        desc: formData.source_citation || formData.description || '',
        categories: formData.categories.length > 0 ? formData.categories.map(cat => ({
          name: cat.name,
          ftags: cat.ftags || cat.f_tags || undefined,
          f_tags: cat.f_tags || cat.ftags || undefined,
          questions: cat.questions.map(q => ({
            number: q.number,
            text: q.text || q.question,
            question: q.question || q.text,
            f_tag: q.f_tag || q.tag,
            tag: q.tag || q.f_tag,
            not_applicable_allowed: q.not_applicable_allowed,
          })),
          observations: cat.observations || undefined,
        })) : undefined,
        questions: formData.categories.length === 0 ? formData.questions.map(q => ({
          number: q.number,
          text: q.text || q.question,
          question: q.question || q.text || "",
          f_tag: q.f_tag || q.tag,
          tag: q.tag || q.f_tag,
          not_applicable_allowed: q.not_applicable_allowed,
        })) : undefined,
      };
      console.log(payload, 'payload');

   

      if (isEdit && id) {
        await updateMandatoryTask(id, payload);
      toast.success("Mandatory Task Updated Successfully", {
        description: "Your mandatory task has been updated",
        duration: 3000,
      });
    } else {
      console.log(payload, 'payload 2');
        await createMandatoryTask(payload);
      toast.success("Mandatory Task Added Successfully", {
        description: "Your new mandatory task is now available",
        duration: 3000,
      });
    }
    
    // Navigate back to mandatory tasks management
    navigate("/dashboard/mandatory-tasks");
    } catch (error: any) {
      console.error("Failed to save mandatory task:", error);
      toast.error(error?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} mandatory task`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard/mandatory-tasks");
  };

  const addQuestion = () => {
    if (newQuestion.trim()) {
      const question: Question = {
        id: Date.now().toString(),
        number: newQuestionNumber,
        text: newQuestion.trim(),
        question: newQuestion.trim(), // For backward compatibility
        f_tag: newQuestionFTag.trim() || undefined,
        tag: newQuestionFTag.trim() || "", // For backward compatibility
        not_applicable_allowed: newQuestionNotApplicable || undefined,
      };

      // If a category is specified, add question to that category
      if (newQuestionCategory.trim()) {
        const categoryName = newQuestionCategory.trim();
        const existingCategoryIndex = formData.categories.findIndex(
          cat => cat.name.toLowerCase() === categoryName.toLowerCase()
        );

        if (existingCategoryIndex >= 0) {
          // Add to existing category
          const updatedCategories = [...formData.categories];
          updatedCategories[existingCategoryIndex] = {
            ...updatedCategories[existingCategoryIndex],
            questions: [...updatedCategories[existingCategoryIndex].questions, question],
          };
          setFormData({
            ...formData,
            categories: updatedCategories,
            questions: [...formData.questions, question], // Also add to flat list for display
          });
        } else {
          // Create new category
          const newCategory: Category = {
            name: categoryName,
            questions: [question],
          };
          setFormData({
            ...formData,
            categories: [...formData.categories, newCategory],
            questions: [...formData.questions, question], // Also add to flat list for display
          });
        }
      } else {
        // No category specified, add to flat questions list (legacy mode)
      setFormData({
        ...formData,
        questions: [...formData.questions, question],
      });
      }

      // Reset form
      setNewQuestion("");
      setNewQuestionNumber(undefined);
      setNewQuestionFTag("");
      setNewQuestionCategory("");
      setNewQuestionNotApplicable(false);
    }
  };

  const removeQuestion = (questionId: string) => {
    // Remove from flat questions list
    const updatedQuestions = formData.questions.filter(q => q.id !== questionId);
    
    // Remove from categories if present
    const updatedCategories = formData.categories.map(cat => ({
      ...cat,
      questions: cat.questions.filter(q => q.id !== questionId),
    })).filter(cat => cat.questions.length > 0); // Remove empty categories

    setFormData({
      ...formData,
      questions: updatedQuestions,
      categories: updatedCategories,
    });
  };

  const updateQuestion = (questionId: string, newText: string) => {
    // Update in flat questions list
    const updatedQuestions = formData.questions.map(q =>
      q.id === questionId ? { ...q, text: newText, question: newText } : q
    );
    
    // Update in categories if present
    const updatedCategories = formData.categories.map(cat => ({
      ...cat,
      questions: cat.questions.map(q =>
        q.id === questionId ? { ...q, text: newText, question: newText } : q
      ),
    }));

    setFormData({
      ...formData,
      questions: updatedQuestions,
      categories: updatedCategories,
    });
  };

  const handleQuestionsFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        toast.error("Invalid file type", {
          description: "Please upload a valid Excel or CSV file",
          duration: 3000,
        });
        return;
      }

      // Simulate file parsing and adding questions
      // In a real implementation, you would parse the file here
      toast.success("File uploaded successfully", {
        description: `Processing ${file.name}...`,
        duration: 3000,
      });

      // Mock adding some questions from the file
      setTimeout(() => {
        const mockQuestions = [
          { id: Date.now().toString() + "1", question: "Are all safety protocols being followed?", tag: "Safety" },
          { id: Date.now().toString() + "2", question: "Is the facility equipment in good working condition?", tag: "Maintenance" },
          { id: Date.now().toString() + "3", question: "Have all required documentation been completed?", tag: "Compliance" },
        ];

        setFormData(prev => ({
          ...prev,
          questions: [...prev.questions, ...mockQuestions],
        }));

        toast.success("Questions added successfully", {
          description: `${mockQuestions.length} questions imported from file`,
          duration: 3000,
        });
      }, 1000);
    }

    // Reset the input
    event.target.value = '';
  };
  
  // Handle JSON file upload
  const handleJsonFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const validExtensions = ['.json'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        toast.error("Invalid file type", {
          description: "Please upload a valid JSON file",
          duration: 3000,
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonText = e.target?.result as string;
          const jsonData = JSON.parse(jsonText);

          // Validate JSON structure
          if (!jsonData.title) {
            toast.error("Invalid JSON structure", {
              description: "JSON must have a 'title' field",
              duration: 3000,
            });
            return;
          }

          // Map JSON structure to form data
          const mappedCategories: Category[] = (jsonData.categories || []).map((cat: any) => ({
            name: cat.name || '',
            ftags: cat.ftags || undefined,
            f_tags: cat.f_tags || cat.ftags || undefined,
            questions: (cat.questions || []).map((q: any, index: number) => ({
              id: Date.now().toString() + index + Math.random(),
              number: q.number,
              text: q.text || '',
              question: q.text || q.question || '',
              f_tag: q.f_tag || '',
              tag: q.f_tag || '',
              not_applicable_allowed: q.not_applicable_allowed,
            })),
            observations: cat.observations || [],
          }));

          // Flatten questions from categories for display
          const allQuestions = mappedCategories.flatMap(cat =>
            cat.questions.map(q => ({
              ...q,
              id: q.id || Date.now().toString() + Math.random(),
            }))
          );

          setFormData({
            title: jsonData.title || '',
            version_date: jsonData.version_date || '',
            source_citation: jsonData.source_citation || '',
            description: jsonData.description || jsonData.source_citation || jsonData.title || '', // Use description if available, otherwise fallback to source_citation or title
            tag: '',
            categories: mappedCategories,
            questions: allQuestions,
          });

          toast.success("JSON file imported successfully", {
            description: `Loaded ${mappedCategories.length} categories with ${allQuestions.length} questions`,
            duration: 3000,
          });

          // Auto-advance to step 2 if questions were loaded
          if (allQuestions.length > 0) {
            setCurrentStep(2);
          }
        } catch (error) {
          console.error("Error parsing JSON:", error);
          toast.error("Failed to parse JSON file", {
            description: "Please ensure the file contains valid JSON",
            duration: 3000,
          });
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read file", {
          description: "Please try again",
          duration: 3000,
        });
      };

      reader.readAsText(file);
    }

    // Reset the input
    event.target.value = '';
  };
  
  const handleTaskFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        toast.error("Invalid file type", {
          description: "Please upload a valid Excel or CSV file",
          duration: 3000,
        });
        return;
      }

      // Simulate file parsing and importing task data
      toast.success("File uploaded successfully", {
        description: `Processing ${file.name}...`,
        duration: 3000,
      });

      // Mock importing task data from the file
      setTimeout(() => {
        // Mock data that would be parsed from the file
        const mockTaskData = {
          title: "Quarterly Fire Safety Inspection",
          description: "Conduct a comprehensive inspection of all fire safety equipment, emergency exits, and evacuation procedures across the facility. Document any issues found and create action plans for remediation.",
          tag: "Safety",
          questions: [
            { id: Date.now().toString() + "1", question: "Are all fire extinguishers properly charged and accessible?", tag: "Safety" },
            { id: Date.now().toString() + "2", question: "Are emergency exit signs clearly visible and illuminated?", tag: "Safety" },
            { id: Date.now().toString() + "3", question: "Are evacuation routes clear of obstructions?", tag: "Safety" },
            { id: Date.now().toString() + "4", question: "Have staff been trained on emergency procedures in the last quarter?", tag: "Training" },
            { id: Date.now().toString() + "5", question: "Are fire alarm systems functioning properly?", tag: "Equipment" },
          ]
        };

        // Update form data with imported information
        setFormData({
          ...formData,
          title: mockTaskData.title,
          description: mockTaskData.description,
          tag: mockTaskData.tag,
          questions: mockTaskData.questions,
        });

        toast.success("Mandatory task imported successfully", {
          description: "Title, description, and questions have been imported",
          duration: 3000,
        });
        
        // If questions were imported, automatically advance to step 2
        if (mockTaskData.questions.length > 0) {
          setCurrentStep(2);
        }
      }, 1000);
    }

    // Reset the input
    event.target.value = '';
  };

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{
        background: resolveToken(
          theme === "dark"
            ? tokens.Dark.Surface.Primary
            : tokens.Light.Surface.Primary
        ),
      }}
    >
      {/* Left Sidebar */}
      <div 
        className="hidden lg:block w-80 p-6 sticky top-0 self-start h-screen overflow-hidden flex flex-col"
        style={{
          background: `linear-gradient(180deg, ${resolveToken(
            theme === "dark"
              ? tokens.Dark.Gradient["Gradient Grey 25"]
              : tokens.Light.Gradient["Gradient Grey 25"]
          )} 0%, ${resolveToken(
            theme === "dark"
              ? tokens.Dark.Gradient["Gradient White"]
              : tokens.Light.Gradient["Gradient White"]
          )} 100%)`,
          borderRadius: resolveToken(
            theme === "dark"
              ? tokens.Dark.Radius["Radius-lg"]
              : tokens.Light.Radius["Radius-lg"]
          ),
        }}
      >
        <div className="mb-8 flex-shrink-0">
          <h2 
            className="text-[20px] font-semibold mb-2"
            style={{
              color: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Typography.Heading
                  : tokens.Light.Typography.Heading
              ), 
            }}
          >
            Mandatory Task Setup
          </h2>
        </div>

        <div className="space-y-6">
          <div 
            className="flex items-start gap-3 cursor-pointer hover:opacity-80"
            onClick={() => setCurrentStep(1)}
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
              style={{
                background: currentStep === 1 ? resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button.Primary
                    : tokens.Light.Button.Primary
                ) : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Surface.Foreground
                    : tokens.Light.Surface.Foreground
                ),
                color: currentStep === 1 ? resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button["Primary Text"]
                    : tokens.Light.Button["Primary Text"]
                ) : resolveToken(
                theme === "dark"
                  ? tokens.Dark.Typography.Subtext
                  : tokens.Light.Typography.Subtext
                ),
                borderColor: currentStep === 1 ? "transparent" : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Stroke["Stroke-02"]
                    : tokens.Light.Stroke["Stroke-02"]
                ),
                border: currentStep === 1 ? "none" : "1px solid",
              }}
            >
              1
            </div>
            <div>
              <h3 
                className="font-medium mb-1"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                Basic Details
              </h3>
              <p 
                className="text-sm"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                }}
              >
                Title and description.
              </p>
            </div>
          </div>

          <div 
            className={`flex items-start gap-3 ${
              currentStep === 1 && !validateStep1() 
                ? 'cursor-not-allowed opacity-50' 
                : 'cursor-pointer hover:opacity-80'
            }`}
            onClick={() => {
              if (validateStep1()) {
                setCurrentStep(2);
              }
            }}
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
              style={{
                background: currentStep === 2 ? resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button.Primary
                    : tokens.Light.Button.Primary
                ) : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Surface.Foreground
                    : tokens.Light.Surface.Foreground
                ),
                color: currentStep === 2 ? resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button["Primary Text"]
                    : tokens.Light.Button["Primary Text"]
                ) : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                ),
                borderColor: currentStep === 2 ? "transparent" : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Stroke["Stroke-02"]
                    : tokens.Light.Stroke["Stroke-02"]
                ),
                border: currentStep === 2 ? "none" : "1px solid",
              }}
            >
              2
            </div>
            <div>
              <h3 
                className="font-medium mb-1"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                Questions
              </h3>
              <p 
                className="text-sm"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                }}
              >
                {currentStep === 1 && !validateStep1() 
                  ? "Complete Step 1 to continue" 
                  : "Add questions for the task."
                }
              </p>
            </div>
          </div>

          <div 
            className={`flex items-start gap-3 ${
              (currentStep === 1 && !validateStep1()) || (currentStep === 2 && !validateStep2())
                ? 'cursor-not-allowed opacity-50' 
                : 'cursor-pointer hover:opacity-80'
            }`}
            onClick={() => {
              if (validateStep1() && validateStep2()) {
                setCurrentStep(3);
              }
            }}
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
              style={{
                background: currentStep === 3 ? resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button.Primary
                    : tokens.Light.Button.Primary
                ) : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Surface.Foreground
                    : tokens.Light.Surface.Foreground
                ),
                color: currentStep === 3 ? resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button["Primary Text"]
                    : tokens.Light.Button["Primary Text"]
                ) : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                ),
                borderColor: currentStep === 3 ? "transparent" : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Stroke["Stroke-02"]
                    : tokens.Light.Stroke["Stroke-02"]
                ),
                border: currentStep === 3 ? "none" : "1px solid",
              }}
            >
              3
            </div>
            <div>
              <h3 
                className="font-medium mb-1"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                Review
              </h3>
              <p 
                className="text-sm"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                }}
              >
                {(currentStep === 1 && !validateStep1()) || (currentStep === 2 && !validateStep2())
                  ? "Complete previous steps to continue" 
                  : "Review questions before submitting."
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Step Indicator */}
      <div className="lg:hidden p-4 border-b" style={{
        background: resolveToken(
          theme === "dark"
            ? tokens.Dark.Surface.Secondary
            : tokens.Light.Surface.Secondary
              ),
              borderColor: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Stroke["Stroke-02"]
                  : tokens.Light.Stroke["Stroke-02"]
        ),
      }}>
        <div className="flex items-center justify-between mb-4">
          <h2 
            className="text-[20px] font-semibold"
            style={{
              color: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Typography.Heading
                  : tokens.Light.Typography.Heading
              ),
            }}
          >
            Mandatory Task Setup
          </h2> 
        </div>
        
        <div className="flex items-center gap-2"> 
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`flex-1 h-2 rounded-full ${
                step <= currentStep ? 'opacity-100' : 'opacity-30'
              }`}
              style={{
                background: step <= currentStep ? resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button.Primary
                    : tokens.Light.Button.Primary
                ) : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Surface.Foreground
                    : tokens.Light.Surface.Foreground
                ),
              }}
            />
          ))}
        </div>
        
        <div className="mt-3">
          <h3 
            className="font-medium text-sm"
              style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Heading
                    : tokens.Light.Typography.Heading
                ),
              }}
            >
            {currentStep === 1 && "Basic Details"}
            {currentStep === 2 && "Questions"}
            {currentStep === 3 && "Review"}
          </h3>
          <p 
            className="text-xs mt-1"
              style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                ),
              }}
          >
            {currentStep === 1 && "Title and description"}
            {currentStep === 2 && "Add questions for the task"}
            {currentStep === 3 && "Review questions before submitting"}
            </p>
          </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <div className="lg:hidden">
            <h1
              className="text-xl font-semibold"
              style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Heading
                    : tokens.Light.Typography.Heading
                ),
              }}
            >
              {isEdit ? "Edit Mandatory Task" : "Add New Mandatory Task"}
            </h1>
          </div>
        </div>

        {/* Loading state when fetching task data */}
        {isFetching && (
          <div className="flex items-center justify-center p-8">
            <p style={{
              color: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Typography.Subtext
                  : tokens.Light.Typography.Subtext
              ),
            }}>
              Loading mandatory task...
            </p>
          </div>
        )}

        {/* Form */}
        {!isFetching && (
        <div
          className="rounded-2xl p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto border-none"
          style={{
            background: resolveToken(
              theme === "dark"
                ? tokens.Dark.Surface.Primary
                : tokens.Light.Surface.Primary
            ),
            borderRadius: resolveToken(
              theme === "dark"
                ? tokens.Dark.Radius["Radius-sm"]
                : tokens.Light.Radius["Radius-sm"]
            ),
          }}
        >
          {/* Step Content */}
          {currentStep === 1 && (
            <div className="space-y-8 w-full max-w-3xl">
              <div>
                <h2 
                  className="text-[32px] font-semibold mb-6"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}
                >
                  Basic Details
                </h2>
                
                <div className="space-y-6">
                  {/* File upload option */}
                  <div className="mb-8 space-y-4">
                    {/* Import JSON option */}
                    <button
                      className="w-full p-6 border-none transition-all cursor-pointer text-left flex justify-between"
                      style={{
                        background: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Surface.Foreground
                            : tokens.Light.Surface.Foreground
                        ),
                        borderRadius: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Radius["Radius-sm"]
                            : tokens.Light.Radius["Radius-sm"]
                        ),
                      }}
                      onClick={() => {
                        jsonFileInputRef.current?.click();
                      }}
                    >
                      <div>
                        <h3
                          className="text-[16px] font-semibold mb-1"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          Import from JSON
                        </h3>
                        <p
                          className="text-[13px]"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                          Upload a JSON file to import task with categories, questions, and observations.
                        </p>
                      </div>
                      <ArrowRight 
                        size={24}
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      />
                    </button>
                    <input
                      ref={jsonFileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleJsonFileUpload}
                      style={{ display: 'none' }}
                    />
                    
                    {/* Import task option (Excel/CSV) */}
                    <button
                      className="w-full p-6 border-none transition-all cursor-pointer text-left flex justify-between"
                      style={{
                        background: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Surface.Foreground
                            : tokens.Light.Surface.Foreground
                        ),
                        borderRadius: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Radius["Radius-sm"]
                            : tokens.Light.Radius["Radius-sm"]
                        ),
                      }}
                      onClick={() => {
                        taskFileInputRef.current?.click();
                      }}
                    >
                      <div>
                        <h3
                          className="text-[16px] font-semibold mb-1"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          Import Complete Task (Excel/CSV)
                        </h3>
                        <p
                          className="text-[13px]"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                          Upload a file to automatically import task title, description, and questions.
                        </p>
                      </div>
                      <ArrowRight 
                        size={24}
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      />
                    </button>
                    <input
                      ref={taskFileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleTaskFileUpload}
                      style={{ display: 'none' }}
                    />
                    
                    {/* Helper links */}
                    <div className="pl-4 space-y-3 mt-2">
                      <button
                        onClick={() => toast.info("Downloading Task Template...")}
                        className="flex items-center gap-2 hover:opacity-70"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Button.Primary
                              : tokens.Light.Button.Primary
                          ),
                        }}
                      >
                        <Download size={16} />
                        <span className="text-sm underline">
                          Download task template
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label 
                      className="text-sm font-medium mb-2 block"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    >
                      Title *
                    </Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter mandatory task title"
                      style={{
                        background: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Surface.Foreground
                            : tokens.Light.Surface.Foreground
                        ),
                        borderColor: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Stroke["Stroke-02"]
                            : tokens.Light.Stroke["Stroke-02"]
                        ),
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label 
                        className="text-sm font-medium mb-2 block"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      >
                        Version Date
                      </Label>
                      <Input
                        value={formData.version_date}
                        onChange={(e) => setFormData({ ...formData, version_date: e.target.value })}
                        placeholder="e.g., 2022-10"
                        style={{
                          background: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Surface.Foreground
                              : tokens.Light.Surface.Foreground
                          ),
                          borderColor: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Stroke["Stroke-02"]
                              : tokens.Light.Stroke["Stroke-02"]
                          ),
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      />
                    </div>
                    <div>
                      <Label 
                        className="text-sm font-medium mb-2 block"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      >
                        Source Citation
                      </Label>
                      <Input
                        value={formData.source_citation}
                        onChange={(e) => setFormData({ ...formData, source_citation: e.target.value })}
                        placeholder="e.g., FORM CMS–20053 (10/2022)"
                        style={{
                          background: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Surface.Foreground
                              : tokens.Light.Surface.Foreground
                          ),
                          borderColor: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Stroke["Stroke-02"]
                              : tokens.Light.Stroke["Stroke-02"]
                          ),
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label 
                      className="text-sm font-medium mb-2 block"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    >
                      Description * 
                    </Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the facility task that needs to be completed"
                      rows={6}
                      style={{
                        background: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Surface.Foreground
                            : tokens.Light.Surface.Foreground
                        ),
                        borderColor: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Stroke["Stroke-02"]
                            : tokens.Light.Stroke["Stroke-02"]
                        ),
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    />
                    <p 
                      className="text-xs mt-2"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Subtext
                            : tokens.Light.Typography.Subtext
                        ),
                      }}
                    >
                      Provide a detailed description of what facility staff need to complete for this mandatory task.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8 w-full max-w-3xl">
              <div>
                <h2 
                  className="text-[32px] font-semibold mb-2"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}
                >
                  Questions
                </h2>
                <p
                  className="text-lg mb-8"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  Add questions for the task.
                </p>
                
                <div className="space-y-6">
                  {/* Show options if no questions and manual input not shown, otherwise show list */}
                  {formData.questions.length === 0 && !showManualInput ? (
                    <div className="space-y-4">
                      {/* Add questions from Excel/CSV option */}
                      <button
                        className="w-full p-6 border-none transition-all cursor-pointer text-left flex justify-between"
                        style={{
                          background: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Surface.Foreground
                              : tokens.Light.Surface.Foreground
                          ),
                          borderRadius: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Radius["Radius-sm"]
                              : tokens.Light.Radius["Radius-sm"]
                          ),
                        }}
                        onClick={() => {
                          questionsFileInputRef.current?.click();
                        }}
                      >
                        <div>
                          <h3
                            className="text-[16px] font-semibold mb-1"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Add questions from Excel / CSV
                          </h3>
                          <p
                            className="text-[13px]"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Subtext
                                  : tokens.Light.Typography.Subtext
                              ),
                            }}
                          >
                            Bulk upload questions from a spreadsheet file.
                          </p>
                        </div>
                        <ArrowRight 
                          size={24}
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        />
                      </button>

                      {/* Add questions manually option */}
                      <button
                        className="w-full p-6 border-none transition-all cursor-pointer text-left flex justify-between"
                        style={{
                          background: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Surface.Foreground
                              : tokens.Light.Surface.Foreground
                          ),
                          borderRadius: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Radius["Radius-sm"]
                              : tokens.Light.Radius["Radius-sm"]
                          ),
                        }}
                        onClick={() => {
                          // Show the manual input form
                          setShowManualInput(true);
                        }}
                      >
                        <div>
                          <h3
                            className="text-[16px] font-semibold mb-1"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Add questions manually
                          </h3>
                          <p
                            className="text-[13px]"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Subtext
                                  : tokens.Light.Typography.Subtext
                              ),
                            }}
                          >
                            Add questions one by one using the form.
                          </p>
                        </div>
                        <ArrowRight 
                          size={24}
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        />
                      </button>

                      {/* Helper links */}
                      <div className="pl-4 space-y-3 mt-6">
                        <button
                          onClick={() => toast.info("Downloading Excel Template...")}
                          className="flex items-center gap-2 hover:opacity-70"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Button.Primary
                                : tokens.Light.Button.Primary
                            ),
                          }}
                        >
                          <Download size={16} />
                          <span className="text-sm underline">
                            Click to download Excel Template
                          </span>
                        </button>
                        <button
                          onClick={() => toast.info("Opening tutorial video...")}
                          className="flex items-center gap-2 hover:opacity-70"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Button.Primary
                                : tokens.Light.Button.Primary
                            ),
                          }}
                        >
                          <Video size={16} />
                          <span className="text-sm underline">
                            Don't know how to use excel sheet? Watch this
                          </span>
                        </button>
                      </div>

                      {/* Hidden file input for questions upload */}
                      <input
                        ref={questionsFileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleQuestionsFileUpload}
                        style={{ display: 'none' }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {showManualInput && formData.questions.length === 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3
                              className="text-lg font-semibold"
                              style={{
                                color: resolveToken(
                                  theme === "dark"
                                    ? tokens.Dark.Typography.Heading
                                    : tokens.Light.Typography.Heading
                                ),
                              }}
                            >
                              Add Questions Manually
                            </h3>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowManualInput(false)}
                              style={{
                                color: resolveToken(
                                  theme === "dark"
                                    ? tokens.Dark.Typography.Subtext
                                    : tokens.Light.Typography.Subtext
                                ),
                              }}
                            >
                              Back
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className="space-y-4">
                        <div>
                          <Label 
                            className="text-sm font-medium mb-2 block"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Category (optional)
                          </Label>
                          <Input
                            value={newQuestionCategory}
                            onChange={(e) => setNewQuestionCategory(e.target.value)}
                            placeholder="e.g., Meal Services, Infection Control"
                            style={{
                              background: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Surface.Foreground
                                  : tokens.Light.Surface.Foreground
                              ),
                              borderColor: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Stroke["Stroke-02"]
                                  : tokens.Light.Stroke["Stroke-02"]
                              ),
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          />
                          <p 
                            className="text-xs mt-1"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Subtext
                                  : tokens.Light.Typography.Subtext
                              ),
                            }}
                          >
                            Questions will be grouped by category. Leave empty to add without category.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label 
                              className="text-sm font-medium mb-2 block"
                              style={{
                                color: resolveToken(
                                  theme === "dark"
                                    ? tokens.Dark.Typography.Heading
                                    : tokens.Light.Typography.Heading
                                ),
                              }}
                            >
                              Question Number (optional)
                            </Label>
                            <Input
                              type="number"
                              value={newQuestionNumber || ""}
                              onChange={(e) => setNewQuestionNumber(e.target.value ? parseInt(e.target.value) : undefined)}
                              placeholder="e.g., 1, 2, 3"
                            style={{
                              background: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Surface.Foreground
                                  : tokens.Light.Surface.Foreground
                              ),
                              borderColor: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Stroke["Stroke-02"]
                                  : tokens.Light.Stroke["Stroke-02"]
                              ),
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          />
                        </div>
                        <div>
                          <Label 
                            className="text-sm font-medium mb-2 block"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                              F-Tag (optional)
                          </Label>
                          <Input
                              value={newQuestionFTag}
                              onChange={(e) => setNewQuestionFTag(e.target.value)}
                              placeholder="e.g., F812, F880, F550"
                              style={{
                                background: resolveToken(
                                  theme === "dark"
                                    ? tokens.Dark.Surface.Foreground
                                    : tokens.Light.Surface.Foreground
                                ),
                                borderColor: resolveToken(
                                  theme === "dark"
                                    ? tokens.Dark.Stroke["Stroke-02"]
                                    : tokens.Light.Stroke["Stroke-02"]
                                ),
                                color: resolveToken(
                                  theme === "dark"
                                    ? tokens.Dark.Typography.Heading
                                    : tokens.Light.Typography.Heading
                                ),
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <Label 
                            className="text-sm font-medium mb-2 block"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Question Text *
                          </Label>
                          <Textarea
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && e.ctrlKey) {
                                e.preventDefault();
                                addQuestion();
                              }
                            }}
                            placeholder="Enter the question text"
                            rows={3}
                            style={{
                              background: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Surface.Foreground
                                  : tokens.Light.Surface.Foreground
                              ),
                              borderColor: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Stroke["Stroke-02"]
                                  : tokens.Light.Stroke["Stroke-02"]
                              ),
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="not-applicable-allowed"
                            checked={newQuestionNotApplicable}
                            onChange={(e) => setNewQuestionNotApplicable(e.target.checked)}
                            style={{
                              cursor: "pointer",
                            }}
                          />
                          <Label 
                            htmlFor="not-applicable-allowed"
                            className="text-sm cursor-pointer"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Not Applicable Allowed
                          </Label>
                        </div>
                        <Button
                          type="button"
                          onClick={addQuestion}
                          disabled={!newQuestion.trim()}
                          className="w-full"
                          style={{
                            background: newQuestion.trim() ? resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Button.Primary
                                : tokens.Light.Button.Primary
                            ) : resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Surface.Foreground
                                : tokens.Light.Surface.Foreground
                            ),
                            color: newQuestion.trim() ? resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Button["Primary Text"]
                                : tokens.Light.Button["Primary Text"]
                            ) : resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                          <Plus size={16} className="mr-2" />
                          Add Question
                        </Button>
                        <p 
                          className="text-xs text-center"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                          Press Ctrl+Enter or click Add Question to add
                        </p>
                      </div>

                      {/* Bulk upload option when questions exist */}
                      <button
                        className="w-full p-4 border-none transition-all cursor-pointer text-left flex justify-between items-center"
                        style={{
                          background: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Surface.Foreground
                              : tokens.Light.Surface.Foreground
                          ),
                          borderRadius: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Radius["Radius-sm"]
                              : tokens.Light.Radius["Radius-sm"]
                          ),
                        }}
                        onClick={() => {
                          questionsFileInputRef.current?.click();
                        }}
                      >
                        <span
                          className="text-sm"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          Add more questions from Excel / CSV
                        </span>
                        <ArrowRight 
                          size={20}
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        />
                      </button>
                    </div>
                  )}

                  {/* Hidden file input for questions upload */}
                  <input
                    ref={questionsFileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleQuestionsFileUpload}
                    style={{ display: 'none' }}
                  />

                  {/* Display Categories if they exist, otherwise show flat questions */}
                  {formData.categories.length > 0 ? (
                    <div className="mt-6 space-y-6">
                      <Label 
                        className="text-sm font-medium mb-3 block"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      >
                        Categories ({formData.categories.length})
                      </Label>
                      
                      {formData.categories.map((category, catIndex) => (
                        <div
                          key={catIndex}
                          className="p-4 rounded-lg border"
                          style={{
                            background: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Surface.Foreground
                                : tokens.Light.Surface.Foreground
                            ),
                            borderColor: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Stroke["Stroke-02"]
                                : tokens.Light.Stroke["Stroke-02"]
                            ),
                          }}
                        >
                          {/* Category Header */}
                          <div className="mb-4 pb-3 border-b flex items-center justify-between"
                            style={{
                              borderColor: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Stroke["Stroke-02"]
                                  : tokens.Light.Stroke["Stroke-02"]
                              ),
                            }}
                          >
                            <div className="flex-1">
                              <h4 
                                className="text-base font-semibold mb-2"
                                style={{
                                  color: resolveToken(
                                    theme === "dark"
                                      ? tokens.Dark.Typography.Heading
                                      : tokens.Light.Typography.Heading
                                  ),
                                }}
                              >
                                {category.name}
                              </h4>
                              
                              {/* F-Tags */}
                              {(category.ftags && category.ftags.length > 0) || (category.f_tags && category.f_tags.length > 0) ? (
                                <div className="flex items-center gap-2 flex-wrap mt-2">
                                  <span 
                                    className="text-xs font-medium"
                                    style={{
                                      color: resolveToken(
                                        theme === "dark"
                                          ? tokens.Dark.Typography.Subtext
                                          : tokens.Light.Typography.Subtext
                                      ),
                                    }}
                                  >
                                    F-Tags:
                                  </span>
                                  {((category.ftags || category.f_tags) || []).map((ftag, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-1 rounded"
                                      style={{
                                        background: resolveToken(
                                          theme === "dark"
                                            ? tokens.Dark.Button.Primary
                                            : tokens.Light.Button.Primary
                                        ),
                                        color: resolveToken(
                                          theme === "dark"
                                            ? tokens.Dark.Button["Primary Text"]
                                            : tokens.Light.Button["Primary Text"]
                                        ),
                                      }}
                                    >
                                      {ftag}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </div>

                          {/* Questions */}
                          {category.questions.length > 0 && (
                            <div className="space-y-3 mb-4">
                              <h5 
                                className="text-sm font-medium mb-3"
                                style={{
                                  color: resolveToken(
                                    theme === "dark"
                                      ? tokens.Dark.Typography.Subtext
                                      : tokens.Light.Typography.Subtext
                                  ),
                                }}
                              >
                                Questions ({category.questions.length})
                              </h5>
                              {category.questions.map((q) => (
                                <div
                                  key={q.id}
                                  className="p-3 rounded border flex items-start gap-3"
                                  style={{
                                    background: resolveToken(
                                      theme === "dark"
                                        ? tokens.Dark.Surface.Primary
                                        : tokens.Light.Surface.Primary
                                    ),
                                    borderColor: resolveToken(
                                      theme === "dark"
                                        ? tokens.Dark.Stroke["Stroke-02"]
                                        : tokens.Light.Stroke["Stroke-02"]
                                    ),
                                  }}
                                >
                                  <span
                                    className="text-sm font-medium mt-1 flex-shrink-0"
                                    style={{
                                      color: resolveToken(
                                        theme === "dark"
                                          ? tokens.Dark.Typography.Subtext
                                          : tokens.Light.Typography.Subtext
                                      ),
                                    }}
                                  >
                                    {q.number ? `${q.number}.` : '•'}
                                  </span>
                                  <div className="flex-1 flex flex-col gap-1">
                                    <Input
                                      value={q.text || q.question || ""}
                                      onChange={(e) => updateQuestion(q.id, e.target.value)}
                                      placeholder="Question text"
                                      style={{
                                        background: "transparent",
                                        border: "none",
                                        padding: 0,
                                        color: resolveToken(
                                          theme === "dark"
                                            ? tokens.Dark.Typography.Heading
                                            : tokens.Light.Typography.Heading
                                        ),
                                      }}
                                    />
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {q.f_tag && (
                                        <span
                                          className="text-xs px-2 py-1 rounded"
                                          style={{
                                            background: resolveToken(
                                              theme === "dark"
                                                ? tokens.Dark.Surface.Secondary
                                                : tokens.Light.Surface.Secondary
                                            ),
                                            color: resolveToken(
                                              theme === "dark"
                                                ? tokens.Dark.Typography.Subtext
                                                : tokens.Light.Typography.Subtext
                                            ),
                                          }}
                                        >
                                          F-Tag: {q.f_tag}
                                        </span>
                                      )}
                                      {q.not_applicable_allowed && (
                                        <span
                                          className="text-xs px-2 py-1 rounded"
                                          style={{
                                            background: resolveToken(
                                              theme === "dark"
                                                ? tokens.Dark.Button.Primary
                                                : tokens.Light.Button.Primary
                                            ),
                                            color: resolveToken(
                                              theme === "dark"
                                                ? tokens.Dark.Button["Primary Text"]
                                                : tokens.Light.Button["Primary Text"]
                                            ),
                                          }}
                                        >
                                          N/A Allowed
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeQuestion(q.id)}
                                    className="h-8 w-8 flex-shrink-0"
                                    style={{
                                      color: resolveToken(
                                        theme === "dark"
                                          ? tokens.Dark.Highlight["Highlight Red"][500]
                                          : tokens.Light.Highlight["Highlight Red"][500]
                                      ),
                                    }}
                                  >
                                    <X size={16} />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Observations */}
                          {category.observations && category.observations.length > 0 && (
                            <div className="mt-4 pt-3 border-t"
                              style={{
                                borderColor: resolveToken(
                                  theme === "dark"
                                    ? tokens.Dark.Stroke["Stroke-02"]
                                    : tokens.Light.Stroke["Stroke-02"]
                                ),
                              }}
                            >
                              <h5 
                                className="text-sm font-medium mb-2"
                                style={{
                                  color: resolveToken(
                                    theme === "dark"
                                      ? tokens.Dark.Typography.Subtext
                                      : tokens.Light.Typography.Subtext
                                  ),
                                }}
                              >
                                Observations ({category.observations.length})
                              </h5>
                              <ul className="list-disc list-inside space-y-1">
                                {category.observations.map((obs, obsIdx) => (
                                  <li
                                    key={obsIdx}
                                    className="text-sm"
                                    style={{
                                      color: resolveToken(
                                        theme === "dark"
                                          ? tokens.Dark.Typography.Heading
                                          : tokens.Light.Typography.Heading
                                      ),
                                    }}
                                  >
                                    {obs}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : formData.questions.length > 0 ? (
                    <div className="mt-6">
                      <Label 
                        className="text-sm font-medium mb-3 block"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      >
                        Questions ({formData.questions.length})
                      </Label>
                      <div className="space-y-3">
                        {formData.questions.map((question, index) => (
                          <div
                            key={question.id}
                            className="flex items-start gap-3 p-3 rounded-lg border"
                            style={{
                              background: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Surface.Foreground
                                  : tokens.Light.Surface.Foreground
                              ),
                              borderColor: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Stroke["Stroke-02"]
                                  : tokens.Light.Stroke["Stroke-02"]
                              ),
                            }}
                          >
                            <span
                              className="text-sm font-medium mt-1"
                              style={{
                                color: resolveToken(
                                  theme === "dark"
                                    ? tokens.Dark.Typography.Subtext
                                    : tokens.Light.Typography.Subtext
                                  ),
                              }}
                            >
                              {question.number || index + 1}.
                            </span>
                            <div className="flex-1 flex flex-col gap-1">
                              <Input
                                value={question.text || question.question || ""}
                                onChange={(e) => updateQuestion(question.id, e.target.value)}
                                placeholder="Question text"
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  padding: 0,
                                  color: resolveToken(
                                    theme === "dark"
                                      ? tokens.Dark.Typography.Heading
                                      : tokens.Light.Typography.Heading
                                    ),
                                }}
                              />
                              <div className="flex items-center gap-2 flex-wrap">
                                {question.f_tag && (
                                <span
                                    className="text-xs px-2 py-1 rounded"
                                  style={{
                                      background: resolveToken(
                                        theme === "dark"
                                          ? tokens.Dark.Surface.Foreground
                                          : tokens.Light.Surface.Foreground
                                      ),
                                      color: resolveToken(
                                        theme === "dark"
                                          ? tokens.Dark.Typography.Subtext
                                          : tokens.Light.Typography.Subtext
                                      ),
                                    }}
                                  >
                                    F-Tag: {question.f_tag}
                                  </span>
                                )}
                                {question.tag && !question.f_tag && (
                                  <span
                                    className="text-xs px-2 py-1 rounded"
                                    style={{
                                      background: resolveToken(
                                        theme === "dark"
                                          ? tokens.Dark.Surface.Foreground
                                          : tokens.Light.Surface.Foreground
                                      ),
                                    color: resolveToken(
                                      theme === "dark"
                                        ? tokens.Dark.Typography.Subtext
                                        : tokens.Light.Typography.Subtext
                                      ),
                                    }}
                                  >
                                    Tag: {question.tag}
                                  </span>
                              )}
                                {question.not_applicable_allowed && (
                                  <span
                                    className="text-xs px-2 py-1 rounded"
                                    style={{
                                      background: resolveToken(
                                        theme === "dark"
                                          ? tokens.Dark.Button.Primary
                                          : tokens.Light.Button.Primary
                                      ),
                                      color: resolveToken(
                                        theme === "dark"
                                          ? tokens.Dark.Button["Primary Text"]
                                          : tokens.Light.Button["Primary Text"]
                                      ),
                                    }}
                                  >
                                    N/A Allowed
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeQuestion(question.id)}
                              className="h-8 w-8"
                              style={{
                                color: resolveToken(
                                  theme === "dark"
                                    ? tokens.Dark.Highlight["Highlight Red"][500]
                                    : tokens.Light.Highlight["Highlight Red"][500]
                                  ),
                              }}
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8 w-full max-w-3xl">
              <div>
                <h2 
                  className="text-[32px] font-semibold mb-6"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}
                >
                  Review Task
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <p
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Subtext
                            : tokens.Light.Typography.Subtext
                        ),
                      }}
                    >
                      Please review the title and description below before submitting.
                    </p>
                  </div>
                  
                  <div
                    className="p-4 rounded-lg border-none space-y-4"
                    style={{
                      background: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Surface.Foreground
                          : tokens.Light.Surface.Foreground
                      ),
                      borderColor: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Stroke["Stroke-02"]
                          : tokens.Light.Stroke["Stroke-02"]
                      ),
                    }}
                  >
                    <div className="space-y-4">
                      <div>
                        <h3 
                          className="text-sm font-medium mb-1"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                          Task Title
                        </h3>
                        <p
                          className="text-base"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          {formData.title}
                        </p>
                      </div>
                      
                      {formData.version_date && (
                      <div>
                        <h3 
                            className="text-sm font-medium mb-1"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                            Version Date
                        </h3>
                        <p
                          className="text-base"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                            {formData.version_date}
                        </p>
                      </div>
                      )}

                      {formData.source_citation && (
                        <div>
                          <h3 
                            className="text-sm font-medium mb-1"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Subtext
                                  : tokens.Light.Typography.Subtext
                              ),
                            }}
                          >
                            Source Citation
                          </h3>
                          <p
                            className="text-base"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            {formData.source_citation}
                          </p>
                        </div>
                      )}

                      <div>
                        <h3 
                          className="text-sm font-medium mb-1"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                          Description
                        </h3>
                        <p
                          className="text-base"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          {formData.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Display Categories if they exist, otherwise show flat questions */}
                  {formData.categories.length > 0 ? (
                    <div className="mt-6 pt-4 border-t space-y-6"
                      style={{
                        borderColor: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Stroke["Stroke-02"]
                            : tokens.Light.Stroke["Stroke-02"]
                        ),
                      }}
                    >
                      <h3 
                        className="text-lg font-semibold mb-4"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      >
                        Categories ({formData.categories.length})
                      </h3>
                      
                      {formData.categories.map((category, catIndex) => (
                        <div
                          key={catIndex}
                          className="p-4 rounded-lg border"
                          style={{
                            background: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Surface.Foreground
                                : tokens.Light.Surface.Foreground
                            ),
                            borderColor: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Stroke["Stroke-02"]
                                : tokens.Light.Stroke["Stroke-02"]
                            ),
                          }}
                        >
                          {/* Category Header */}
                          <div className="mb-4 pb-3 border-b"
                            style={{
                              borderColor: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Stroke["Stroke-02"]
                                  : tokens.Light.Stroke["Stroke-02"]
                              ),
                            }}
                          >
                            <h4 
                              className="text-base font-semibold mb-2"
                              style={{
                                color: resolveToken(
                                  theme === "dark"
                                    ? tokens.Dark.Typography.Heading
                                    : tokens.Light.Typography.Heading
                                ),
                              }}
                            >
                              {category.name}
                            </h4>
                            
                            {/* F-Tags */}
                            {(category.ftags && category.ftags.length > 0) || (category.f_tags && category.f_tags.length > 0) ? (
                              <div className="flex items-center gap-2 flex-wrap mt-2">
                                <span 
                                  className="text-xs font-medium"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Subtext
                              : tokens.Light.Typography.Subtext
                          ),
                        }}
                      >
                                  F-Tags:
                                </span>
                                {((category.ftags || category.f_tags) || []).map((ftag, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs px-2 py-1 rounded"
                                    style={{
                                      background: resolveToken(
                                        theme === "dark"
                                          ? tokens.Dark.Button.Primary
                                          : tokens.Light.Button.Primary
                                      ),
                                      color: resolveToken(
                                        theme === "dark"
                                          ? tokens.Dark.Button["Primary Text"]
                                          : tokens.Light.Button["Primary Text"]
                                      ),
                                    }}
                                  >
                                    {ftag}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          {/* Questions */}
                          {category.questions.length > 0 && (
                            <div className="space-y-3 mb-4">
                              <h5 
                                className="text-sm font-medium mb-2"
                                style={{
                                  color: resolveToken(
                                    theme === "dark"
                                      ? tokens.Dark.Typography.Subtext
                                      : tokens.Light.Typography.Subtext
                                  ),
                                }}
                              >
                                Questions ({category.questions.length})
                              </h5>
                              {category.questions.map((q) => (
                                <div
                                  key={q.id}
                                  className="p-3 rounded border"
                                  style={{
                                    background: resolveToken(
                                      theme === "dark"
                                        ? tokens.Dark.Surface.Primary
                                        : tokens.Light.Surface.Primary
                                    ),
                                    borderColor: resolveToken(
                                      theme === "dark"
                                        ? tokens.Dark.Stroke["Stroke-02"]
                                        : tokens.Light.Stroke["Stroke-02"]
                                    ),
                                  }}
                                >
                                  <div className="flex items-start gap-2">
                                    <span
                                      className="text-sm font-medium"
                                      style={{
                                        color: resolveToken(
                                          theme === "dark"
                                            ? tokens.Dark.Typography.Subtext
                                            : tokens.Light.Typography.Subtext
                                        ),
                                      }}
                                    >
                                      {q.number ? `${q.number}.` : '•'}
                                    </span>
                                    <div className="flex-1">
                                      <p
                                        className="text-sm"
                                        style={{
                                          color: resolveToken(
                                            theme === "dark"
                                              ? tokens.Dark.Typography.Heading
                                              : tokens.Light.Typography.Heading
                                          ),
                                        }}
                                      >
                                        {q.text || q.question}
                                      </p>
                                      <div className="flex items-center gap-2 flex-wrap mt-2">
                                        {q.f_tag && (
                                          <span
                                            className="text-xs px-2 py-1 rounded"
                                            style={{
                                              background: resolveToken(
                                                theme === "dark"
                                                  ? tokens.Dark.Surface.Foreground
                                                  : tokens.Light.Surface.Foreground
                                              ),
                                              color: resolveToken(
                                                theme === "dark"
                                                  ? tokens.Dark.Typography.Subtext
                                                  : tokens.Light.Typography.Subtext
                                              ),
                                            }}
                                          >
                                            F-Tag: {q.f_tag}
                                          </span>
                                        )}
                                        {q.not_applicable_allowed && (
                                          <span
                                            className="text-xs px-2 py-1 rounded"
                                            style={{
                                              background: resolveToken(
                                                theme === "dark"
                                                  ? tokens.Dark.Button.Primary
                                                  : tokens.Light.Button.Primary
                                              ),
                                              color: resolveToken(
                                                theme === "dark"
                                                  ? tokens.Dark.Button["Primary Text"]
                                                  : tokens.Light.Button["Primary Text"]
                                              ),
                                            }}
                                          >
                                            N/A Allowed
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Observations */}
                          {category.observations && category.observations.length > 0 && (
                            <div className="mt-4 pt-3 border-t"
                              style={{
                                borderColor: resolveToken(
                                  theme === "dark"
                                    ? tokens.Dark.Stroke["Stroke-02"]
                                    : tokens.Light.Stroke["Stroke-02"]
                                ),
                              }}
                            >
                              <h5 
                                className="text-sm font-medium mb-2"
                                style={{
                                  color: resolveToken(
                                    theme === "dark"
                                      ? tokens.Dark.Typography.Subtext
                                      : tokens.Light.Typography.Subtext
                                  ),
                                }}
                              >
                                Observations ({category.observations.length})
                              </h5>
                              <ul className="list-disc list-inside space-y-1">
                                {category.observations.map((obs, obsIdx) => (
                                  <li
                                    key={obsIdx}
                                    className="text-sm"
                                    style={{
                                      color: resolveToken(
                                        theme === "dark"
                                          ? tokens.Dark.Typography.Heading
                                          : tokens.Light.Typography.Heading
                                      ),
                                    }}
                                  >
                                    {obs}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : formData.questions.length > 0 ? (
                    <div className="mt-6 pt-4 border-t"
                      style={{
                        borderColor: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Stroke["Stroke-02"]
                            : tokens.Light.Stroke["Stroke-02"]
                        ),
                      }}
                    >
                      <h3 
                        className="text-lg font-semibold mb-4"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      >
                        Questions ({formData.questions.length})
                      </h3>
                      <div className="space-y-3">
                        {formData.questions.map((q, i) => (
                          <div
                            key={q.id}
                            className="p-3 rounded-lg border"
                            style={{
                              background: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Surface.Foreground
                                  : tokens.Light.Surface.Foreground
                              ),
                              borderColor: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Stroke["Stroke-02"]
                                  : tokens.Light.Stroke["Stroke-02"]
                              ),
                            }}
                          >
                            <div className="flex items-start gap-2">
                              <span
                                className="text-sm font-medium"
                                style={{
                                  color: resolveToken(
                                    theme === "dark"
                                      ? tokens.Dark.Typography.Subtext
                                      : tokens.Light.Typography.Subtext
                                  ),
                                }}
                              >
                                {q.number ? `${q.number}.` : `${i + 1}.`}
                              </span>
                              <div className="flex-1">
                                <p
                                  className="text-sm font-medium mb-2"
                                  style={{
                                  color: resolveToken(
                                    theme === "dark"
                                      ? tokens.Dark.Typography.Heading
                                      : tokens.Light.Typography.Heading
                                  ),
                                  }}
                                >
                                  {q.text || q.question}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {q.f_tag && (
                                    <span
                                      className="text-xs px-2 py-1 rounded"
                                      style={{
                                        background: resolveToken(
                                          theme === "dark"
                                            ? tokens.Dark.Surface.Primary
                                            : tokens.Light.Surface.Primary
                                        ),
                                    color: resolveToken(
                                      theme === "dark"
                                        ? tokens.Dark.Typography.Subtext
                                        : tokens.Light.Typography.Subtext
                                    ),
                                      }}
                                    >
                                      F-Tag: {q.f_tag}
                                    </span>
                                  )}
                                  {q.tag && !q.f_tag && (
                                    <span
                                      className="text-xs px-2 py-1 rounded"
                                      style={{
                                        background: resolveToken(
                                          theme === "dark"
                                            ? tokens.Dark.Surface.Primary
                                            : tokens.Light.Surface.Primary
                                        ),
                                        color: resolveToken(
                                          theme === "dark"
                                            ? tokens.Dark.Typography.Subtext
                                            : tokens.Light.Typography.Subtext
                                        ),
                                      }}
                                    >
                                    Tag: {q.tag}
                                    </span>
                                  )}
                                  {q.not_applicable_allowed && (
                                    <span
                                      className="text-xs px-2 py-1 rounded"
                                      style={{
                                        background: resolveToken(
                                          theme === "dark"
                                            ? tokens.Dark.Button.Primary
                                            : tokens.Light.Button.Primary
                                        ),
                                        color: resolveToken(
                                          theme === "dark"
                                            ? tokens.Dark.Button["Primary Text"]
                                            : tokens.Light.Button["Primary Text"]
                                        ),
                                      }}
                                    >
                                      N/A Allowed
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-8 lg:mt-12 pt-6 lg:pt-8 max-w-3xl w-full">
            <div className="flex gap-4 order-2 sm:order-1">
              {(currentStep === 2 || currentStep === 3) && (
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  className="flex-1 sm:flex-none px-6 py-2"
                  style={{
                    background: "transparent",
                    borderColor: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Stroke["Stroke-02"]
                        : tokens.Light.Stroke["Stroke-02"]
                    ),
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex gap-4 order-1 sm:order-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1 sm:flex-none px-6 py-2"
                style={{
                  background: "transparent",
                  borderColor: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Stroke["Stroke-02"]
                      : tokens.Light.Stroke["Stroke-02"]
                  ),
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                }}
              > 
                Cancel
              </Button>
              
              {currentStep === 1 ? (
                <Button
                  onClick={handleNextStep}
                  disabled={!validateStep1()}
                  className="flex items-center gap-2 flex-1 sm:flex-none px-6 py-2"
                  style={{
                    background: validateStep1() ? resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button.Primary
                        : tokens.Light.Button.Primary
                    ) : resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Surface.Foreground
                        : tokens.Light.Surface.Foreground
                    ),
                    color: validateStep1() ? resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button["Primary Text"]
                        : tokens.Light.Button["Primary Text"]
                    ) : resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  Next
                </Button>
              ) : currentStep === 2 ? (
                <Button
                  onClick={handleNextStep}
                  disabled={!validateStep2()}
                  className="flex items-center gap-2 flex-1 sm:flex-none px-6 py-2"
                  style={{
                    background: validateStep2() ? resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button.Primary
                        : tokens.Light.Button.Primary
                    ) : resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Surface.Foreground
                        : tokens.Light.Surface.Foreground
                    ),
                    color: validateStep2() ? resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button["Primary Text"]
                        : tokens.Light.Button["Primary Text"]
                    ) : resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!validateStep3() || loading}
                  className="flex items-center gap-2 flex-1 sm:flex-none px-6 py-2"
                  style={{
                    background: validateStep3() && !loading ? resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button.Primary
                        : tokens.Light.Button.Primary
                    ) : resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Surface.Foreground
                        : tokens.Light.Surface.Foreground
                    ),
                    color: validateStep3() && !loading ? resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button["Primary Text"]
                        : tokens.Light.Button["Primary Text"]
                    ) : resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  {loading ? (isEdit ? "Updating..." : "Adding...") : (isEdit ? "Update Mandatory Task" : "Add Mandatory Task")}
                </Button>
              )}
            </div>
          </div>
        </div>
        )}
      </main>
    </div>
  );
};

export default AddEditMandatoryTask;
