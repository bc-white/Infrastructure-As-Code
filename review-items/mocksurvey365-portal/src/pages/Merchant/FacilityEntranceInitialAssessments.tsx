import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resolveToken } from "@/utils/resolveToken";
import { tokens } from "@/styles/theme";
import { getTheme } from "@/styles/getTheme";
import { Edit, Trash2, Plus, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Assessment {
  id: string;
  facilityName: string;
  residentName: string;
  assessmentType: string;
  assessmentDate: string;
  status: "completed" | "pending" | "in-progress";
  completedBy: string;
  notes: string;
  questions?: { id: string; question: string; tag?: string }[];
}

const FacilityEntranceInitialAssessments = () => {
  const theme = getTheme();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assessmentTypeFilter, setAssessmentTypeFilter] = useState<string>("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  

  // Mock initial data
  useEffect(() => {
    setAssessments([
      {
        id: "1",
        facilityName: "Health Assessment for New Residents",
        residentName: "Comprehensive health evaluation for all new facility residents",
        assessmentType: "Initial Health",
        assessmentDate: "2024-10-15",
        status: "completed",
        completedBy: "Dr. Sarah Johnson",
        notes: "Standard assessment for all new residents.",
        questions: [
          { id: "q1", question: "Does the resident have any chronic conditions?", tag: "Medical" },
          { id: "q2", question: "Is the resident currently taking any medications?", tag: "Medical" },
          { id: "q3", question: "Does the resident have any known allergies?", tag: "Medical" },
        ]
      },
      {
        id: "2",
        facilityName: "Cognitive Function Evaluation",
        residentName: "Assessment to evaluate memory and cognitive abilities",
        assessmentType: "Cognitive",
        assessmentDate: "2024-10-18",
        status: "pending",
        completedBy: "Dr. Thompson",
        notes: "Scheduled for all residents quarterly.",
        questions: []
      },
      {
        id: "3",
        facilityName: "Nutritional Status Assessment",
        residentName: "Evaluation of dietary needs and nutritional health",
        assessmentType: "Nutritional",
        assessmentDate: "2024-10-12",
        status: "in-progress",
        completedBy: "Nutritionist Emma Clark",
        notes: "Initial evaluation complete, awaiting lab results.",
        questions: [
          { id: "q1", question: "Does the resident have any dietary restrictions?", tag: "Nutrition" },
          { id: "q2", question: "Has the resident experienced weight loss in the past 3 months?", tag: "Nutrition" },
        ]
      },
      {
        id: "4",
        facilityName: "Mobility and Fall Risk Assessment",
        residentName: "Evaluation of mobility capabilities and fall risk factors",
        assessmentType: "Mobility",
        assessmentDate: "2024-10-10",
        status: "completed",
        completedBy: "Physical Therapist Michael Lee",
        notes: "Standard mobility assessment for all residents.",
        questions: [
          { id: "q1", question: "Can the resident walk unassisted?", tag: "Mobility" },
          { id: "q2", question: "Does the resident use assistive devices?", tag: "Mobility" },
          { id: "q3", question: "Is the resident at risk for falls?", tag: "Safety" },
          { id: "q4", question: "Can the resident transfer from bed to chair independently?", tag: "Mobility" },
        ]
      },
      {
        id: "5",
        facilityName: "Annual Wellness Review",
        residentName: "Comprehensive annual health and wellness evaluation",
        assessmentType: "Annual Review",
        assessmentDate: "2024-10-20",
        status: "pending",
        completedBy: "Dr. Roberts",
        notes: "Required annual assessment for all residents.",
        questions: [
          { id: "q1", question: "Has the resident had any hospitalizations in the past year?", tag: "Medical" },
          { id: "q2", question: "Have there been any changes to the resident's medication regimen?", tag: "Medical" },
        ]
      },
    ]);
  }, []);


  const confirmDelete = (assessment: Assessment) => {
    setAssessmentToDelete(assessment);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteAssessment = () => {
    if (assessmentToDelete) {
      setAssessments(assessments.filter(assessment => assessment.id !== assessmentToDelete.id));
      setIsDeleteDialogOpen(false);
      setAssessmentToDelete(null);
      toast.success("Assessment deleted successfully");
    }
  };


  // Filter assessments based on search query and filters
  const filteredAssessments = useMemo(() => {
    const filtered = assessments.filter(assessment => {
      const matchesSearch = 
        assessment.facilityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.assessmentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.notes.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || assessment.status === statusFilter;
      
      const matchesType = assessmentTypeFilter === "all" || 
        assessment.assessmentType.toLowerCase() === assessmentTypeFilter.toLowerCase();
      
      return matchesSearch && matchesStatus && matchesType;
    });
    
    // Reset to first page when filters change
    if (filtered.length > 0 && Math.ceil(filtered.length / itemsPerPage) < currentPage) {
      setCurrentPage(1);
    }
    
    return filtered;
  }, [assessments, searchQuery, statusFilter, assessmentTypeFilter]);
  
  // Pagination calculations
  const totalPages = Math.ceil(filteredAssessments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Define unique assessment types for filter dropdown
  const assessmentTypes = useMemo(() => {
    const types = new Set(assessments.map(a => a.assessmentType));
    return Array.from(types);
  }, [assessments]);


  return (
    <div
      className="min-h-screen"
      style={{
        background: resolveToken(
          theme === "dark"
            ? tokens.Dark.Surface.Primary
            : tokens.Light.Surface.Primary
        ),
      }}
    >
      <main className="container mx-auto md:px-9 px-5 pt-24">
        {/* Header */}
        <div className="flex flex-col gap-1 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <h1
                className="md:text-[25px] font-[500] text-[22px]"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                Facility Entrance Initial Assessments
              </h1> 
              <p
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                }}
                className="text-[16px] font-[400]"
              >
                Manage facility entrance assessments for residents
              </p>
            </div>
            <Button onClick={() => navigate("/dashboard/facility-entrance-initial-assessments/add")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Assessment
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
              style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                ),
              }}
            />
            <Input
              placeholder="Search assessments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
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
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className="w-[150px]"
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
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
            <Select value={assessmentTypeFilter} onValueChange={setAssessmentTypeFilter}>
              <SelectTrigger
                className="w-[150px]"
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
              >
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {["all", ...assessmentTypes].map((type) => (
                  <SelectItem key={type} value={type === "all" ? "all" : type.toLowerCase()}>
                    {type === "all" ? "All Types" : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Assessments Table */}
        <div
          className="rounded-lg overflow-hidden border"
          style={{
            borderColor: resolveToken(
              theme === "dark"
                ? tokens.Dark.Stroke["Stroke-02"]
                : tokens.Light.Stroke["Stroke-02"]
            ),
          }}
        >

          <table className="w-full">
            <thead>
              <tr
                style={{
                  background: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Surface.Secondary
                      : tokens.Light.Surface.Secondary
                  ),
                }}
              >
                <th
                  className="px-4 py-3 text-left text-sm font-medium"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  Assessment Name
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  Type
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  Date
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  Created By
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  Questions
                </th>
                <th
                  className="px-4 py-3 text-right text-sm font-medium"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
              <tbody
                style={{
                  background: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Surface.Foreground
                      : tokens.Light.Surface.Foreground
                  ),
                }}
              >
                {filteredAssessments.slice(startIndex, endIndex).map((assessment) => (
                  <tr
                    key={assessment.id}
                    className="border-t"
                    style={{
                      borderColor: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Stroke["Stroke-02"]
                          : tokens.Light.Stroke["Stroke-02"]
                      ),
                    }}
                  >
                    <td
                      className="px-4 py-3 text-sm"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    >
                      <div className="font-medium">{assessment.facilityName}</div>
                      <div 
                        className="text-xs truncate max-w-[250px]"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Subtext
                              : tokens.Light.Typography.Subtext
                          ),
                        }}
                      >
                        {assessment.residentName}
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    >
                      <Badge
                        variant="secondary"
                        style={{
                          background: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Highlight["HIghhlight Gray"][50]
                              : tokens.Light.Highlight["HIghhlight Gray"][50]
                          ),
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Subtext
                              : tokens.Light.Typography.Subtext
                          ),
                        }}
                      >
                        {assessment.assessmentType}
                      </Badge>
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    >
                      {new Date(assessment.assessmentDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    >
                      {assessment.completedBy || "-"}
                    </td>
                    <td
                      className="px-4 py-3 text-sm hidden md:table-cell"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    >
                      {assessment.questions && assessment.questions.length > 0 ? (
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Button.Primary
                                : tokens.Light.Button.Primary
                            ),
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Button.Primary
                                : tokens.Light.Button.Primary
                            ),
                          }}
                        >
                          {assessment.questions.length} Questions
                        </Badge>
                      ) : (
                        <span className="text-xs">No questions</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/dashboard/facility-entrance-initial-assessments/edit/${assessment.id}`)}
                          className="h-8 w-8"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Button.Primary
                                : tokens.Light.Button.Primary
                            ),
                          }}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDelete(assessment)}
                          className="h-8 w-8"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Highlight["Highlight Red"][500]
                                : tokens.Light.Highlight["Highlight Red"][500]
                            ),
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAssessments.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Subtext
                            : tokens.Light.Typography.Subtext
                        ),
                      }}
                    >
                      No assessments found. Try adjusting your filters or add a new assessment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

          {/* Pagination */}
          {filteredAssessments.length > 0 && (
            <div className="flex justify-between items-center p-4">
              <div
                className="text-sm"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                }}
              >
                Showing {startIndex + 1} to {Math.min(endIndex, filteredAssessments.length)} of {filteredAssessments.length} assessments
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8"
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
                  <ChevronsLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8"
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
                  <ChevronLeft size={16} />
                </Button>
                <div className="flex items-center px-3">
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    {currentPage} / {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8"
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
                  <ChevronRight size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8"
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
                  <ChevronsRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Assessment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this assessment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {assessmentToDelete && (
              <div className="space-y-2">
                <p><strong>Facility:</strong> {assessmentToDelete.facilityName}</p>
                <p><strong>Resident:</strong> {assessmentToDelete.residentName}</p>
                <p><strong>Assessment Type:</strong> {assessmentToDelete.assessmentType}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAssessment}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FacilityEntranceInitialAssessments;
