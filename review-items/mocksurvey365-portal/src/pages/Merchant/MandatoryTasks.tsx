import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveToken } from "@/utils/resolveToken";
import { tokens } from "@/styles/theme";
import { getTheme } from "@/styles/getTheme";
import {
  Edit,
  Trash2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { toast } from "sonner";
import { getAllMandatoryTasks, deleteMandatoryTask, type MandatoryTask as ServiceMandatoryTask } from "@/api/services/mandatoryTasksService";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MandatoryTask {
  id: string;
  title: string;
  description: string;
  tag: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "inactive" | "archived";
  questionsCount: number;
}

const MandatoryTasks = () => {
  const theme = getTheme();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<MandatoryTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch mandatory tasks from API
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const apiTasks = await getAllMandatoryTasks();
      
      // Map API tasks to component's MandatoryTask interface
      const mappedTasks: MandatoryTask[] = apiTasks.map((task: ServiceMandatoryTask) => {
        // Calculate questions count from categories or flat questions array
        const questionsCount = task.categories 
          ? task.categories.reduce((sum, cat) => sum + (cat.questions?.length || 0), 0)
          : task.questions?.length || 0;
        
        return {
          id: task.id,
          title: task.title || '',
          description: task.description || task.facilityTask || '',
          tag: task.tag || 'General',
          createdAt: task.createdAt || new Date().toISOString(),
          updatedAt: task.updatedAt || task.createdAt || new Date().toISOString(),
          status: "active" as const, // Default to active since API doesn't provide status
          questionsCount,
        };
      });
      
      setTasks(mappedTasks);
    } catch (error: any) {
      console.error("Failed to fetch mandatory tasks:", error);
      toast.error(error?.response?.data?.message || "Failed to load mandatory tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Filter tasks based on search query and filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tag.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;

      // Tag filter
      const matchesTag = tagFilter === "all" || task.tag === tagFilter;

      return matchesSearch && matchesStatus && matchesTag;
    });
  }, [tasks, searchQuery, statusFilter, tagFilter]);

  // Get unique tags for filter dropdown
  const uniqueTags = useMemo(() => {
    const tags = tasks.map((task) => task.tag);
    return ["all", ...Array.from(new Set(tags))];
  }, [tasks]);

  // Pagination logic
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Handle delete task
  const handleDelete = async (task: MandatoryTask) => {
    const deleteTask = async () => {
      await deleteMandatoryTask(task.id);
      await fetchTasks(); // Refetch tasks after deletion
    };

    toast.promise(deleteTask(), {
      loading: "Deleting task...",
      success: `Task "${task.title}" deleted successfully`,
      error: (error: any) => error?.response?.data?.message || "Failed to delete task",
    });
  };

  // Open delete confirmation
  const openDeleteDialog = (task: MandatoryTask) => {
    const confirmToastId = toast(`Are you sure you want to delete "${task.title}"?`, {
      description: "This action cannot be undone.",
      duration: Infinity,
      action: {
        label: "Delete",
        onClick: () => {
          toast.dismiss(confirmToastId);
          handleDelete(task);
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {
          toast.dismiss(confirmToastId);
        },
      },
    });
  };

  // Handle pagination
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div
      style={{
        background: resolveToken(
          theme === "dark"
            ? tokens.Dark.Surface.Primary
            : tokens.Light.Surface.Primary
        ),
      }}
      className="min-h-screen"
    >
      <main className="container mx-auto md:px-9 px-5 pt-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Heading
                    : tokens.Light.Typography.Heading
                ),
              }}
            >
              Mandatory Tasks
            </h1>
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
              Manage facility mandatory tasks and requirements
            </p>
          </div>
          <Button
            onClick={() => navigate("/dashboard/mandatory-tasks/add")}
            className="flex items-center gap-2"
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
            <Plus size={16} />
            Add New Task
          </Button>
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
              placeholder="Search tasks..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tagFilter} onValueChange={setTagFilter}>
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
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                {uniqueTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag === "all" ? "All Tags" : tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
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
                  Title
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
                  Tag
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
                  className="px-4 py-3 text-left text-sm font-medium"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  Status
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
                  Last Updated
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
              {loading ? (
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
                    Loading tasks...
                  </td>
                </tr>
              ) : (
                <>
                  {filteredTasks.slice(startIndex, endIndex).map((task) => (
                <tr
                  key={task.id}
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
                    <div className="font-medium">{task.title}</div>
                    <div
                      className="text-xs truncate max-w-[250px] md:hidden"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Subtext
                            : tokens.Light.Typography.Subtext
                        ),
                      }}
                    >
                      {task.tag}
                    </div>
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
                    {task.tag}
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
                    {task.questionsCount}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge
                      className={`${getStatusColor(task.status)} border-none`}
                      variant="outline"
                    >
                      {task.status.charAt(0).toUpperCase() +
                        task.status.slice(1)}
                    </Badge>
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
                    {new Date(task.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          navigate(`/dashboard/mandatory-tasks/edit/${task.id}`)
                        }
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
                        onClick={() => openDeleteDialog(task)}
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
                  {filteredTasks.length === 0 && (
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
                    No tasks found. Try adjusting your filters or add a new
                    task.
                  </td>
                </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredTasks.length > 0 && (
          <div className="flex justify-between items-center mt-4">
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
              Showing {startIndex + 1} to{" "}
              {Math.min(endIndex, filteredTasks.length)} of{" "}
              {filteredTasks.length} tasks
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

      </main>
    </div>
  );
};

export default MandatoryTasks;
