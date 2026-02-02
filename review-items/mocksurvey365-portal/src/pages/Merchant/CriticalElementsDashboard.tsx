import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
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
import {
  Upload,
  Edit,
  Trash2,
  Download,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAllCriticalElementsPaginated,
  addCriticalElement,
  updateCriticalElement,
  deleteCriticalElement,
  uploadFile,
} from "@/api/services/criticalElementsService";
import type { CriticalElementFilters } from "@/api/services/criticalElementsService";

interface CriticalElement {
  id: string;
  title: string; // Maps to 'name' from API
  name: string; // filename extracted from pdflink
  type: "document" | "image" | "video" | "other";
  size: number; // in bytes (estimated)
  date: string; // date field (using createdAt from API)
  description: string;
  tag: string;
  uploadedDate: string; // createdAt from API
  uploadedBy: string;
  pdflink: string; // From API
}

const CriticalElementsDashboard = () => {
  const theme = getTheme();
  const truncate = (text: string, max: number = 60) =>
    text && text.length > max ? text.slice(0, max - 1) + "…" : text;
  const [criticalElements, setCriticalElements] = useState<CriticalElement[]>(
    []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [_, setEditingElement] = useState<CriticalElement | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  // Input filter states
  const [nameQuery, setNameQuery] = useState(""); // Changed from searchQuery to nameQuery
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Applied filter states
  const [appliedNameQuery, setAppliedNameQuery] = useState(""); // Changed from appliedSearchQuery to appliedNameQuery
  const [appliedTypeFilter, setAppliedTypeFilter] = useState<string>("all");
  const [appliedStartDate, setAppliedStartDate] = useState<Date | undefined>(
    undefined
  );
  const [appliedEndDate, setAppliedEndDate] = useState<Date | undefined>(
    undefined
  );
  const [uploadForm, setUploadForm] = useState({
    title: "",
    type: "",
    file: null as File | null,
  });
  const [editForm, setEditForm] = useState({
    id: "",
    title: "",
    type: "",
    file: null as File | null,
    pdflink: "",
  });
  const [isDragging, setIsDragging] = useState(false);

  // Pagination state (from API)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Function to transform API data to our interface
  const transformApiData = useCallback((data: any[]) => {
    return data.map((item) => {
      // Extract filename from pdflink
      const urlParts = item.pdflink?.split("/") || [];
      const filename = urlParts[urlParts.length - 1] || "";

      // Use API type field if available, otherwise determine from extension
      let fileType: "document" | "image" | "video" | "other" = "other";
      if (item.type) {
        // Use API type as-is (e.g., "Resident CE Pathways")
        fileType = "document"; // Default to document for critical elements
      } else {
        // Fallback: Determine file type based on extension
        const fileExtension = filename.split(".").pop()?.toLowerCase() || "";
        if (["pdf", "doc", "docx", "txt"].includes(fileExtension)) {
          fileType = "document";
        } else if (
          ["jpg", "jpeg", "png", "gif", "webp"].includes(fileExtension)
        ) {
          fileType = "image";
        } else if (["mp4", "mov", "avi", "webm"].includes(fileExtension)) {
          fileType = "video";
        }
      }

      // Estimate file size (since we don't have this from API)
      const estimatedSize = Math.floor(Math.random() * 5000000) + 500000;

      return {
        id: item.id || item._id || '',
        title: item.name || '',
        name: filename,
        type: fileType,
        size: estimatedSize,
        date: item.createdAt
          ? new Date(item.createdAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        description: "", // API doesn't provide this
        tag: item.type || "", // Use API type as tag
        uploadedDate: item.createdAt || new Date().toISOString(),
        uploadedBy: "Admin User", // API doesn't provide this
        pdflink: item.pdflink || "",
      };
    });
  }, []);

  // Function to fetch critical elements with filters and pagination
  const fetchCriticalElements = useCallback(
    async (page = 1, filters?: CriticalElementFilters) => {
      try {
        setIsLoading(true);
        const { items, pagination } = await getAllCriticalElementsPaginated(page, pageLimit, filters);

        // Transform API data to match our interface
        const transformedData = transformApiData(items);

        setCriticalElements(transformedData);
        setTotalItems(pagination.total ?? transformedData.length);
        setTotalPages(pagination.totalPages ?? 1);
        setPageLimit(pagination.limit ?? pageLimit);
        setCurrentPage(pagination.currentPage ?? page);
      } catch (error) {
        console.error("Error fetching critical elements:", error);
        toast.error("Failed to load critical elements", {
          description: "Please try again later",
        });
        setCriticalElements([]);
      } finally {
        setIsLoading(false);
      }
    },
    [transformApiData, pageLimit]
  );

  // Fetch critical elements on initial load
  useEffect(() => {
    fetchCriticalElements();
  }, [fetchCriticalElements]);

  // Initialize applied filters with the initial filter values
  useEffect(() => {
    setAppliedNameQuery(nameQuery);
    setAppliedTypeFilter(typeFilter);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Format date with time for display
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter critical elements based on applied filters (client-side filtering removed - using server-side filtering)
  // const filteredElements = useMemo(() => {
  //   return criticalElements.filter((element) => {
  //     // Name filter - only filter by title/name field
  //     const matchesName =
  //       appliedNameQuery === "" ||
  //       element.title.toLowerCase().includes(appliedNameQuery.toLowerCase());

  //     // Type filter
  //     const matchesType =
  //       appliedTypeFilter === "all" || element.type === appliedTypeFilter;

  //     // Date filter
  //     const elementDate = new Date(element.date);
  //     const matchesStartDate =
  //       !appliedStartDate || elementDate >= appliedStartDate;
  //     const matchesEndDate = !appliedEndDate || elementDate <= appliedEndDate;

  //     return matchesName && matchesType && matchesStartDate && matchesEndDate;
  //   });
  // }, [
  //   criticalElements,
  //   appliedNameQuery,
  //   appliedTypeFilter,
  //   appliedStartDate,
  //   appliedEndDate,
  // ]);

  // Get unique element types for filter dropdown (for display filtering)
  const uniqueTypes = useMemo(() => {
    const types = criticalElements
      .map((element) => element.type)
      .filter((type): type is "document" | "image" | "video" | "other" => !!type);
    return ["all", ...Array.from(new Set(types))];
  }, [criticalElements]);

  // Get unique API types for form dropdowns (actual API type values like "Resident CE Pathways")
  const uniqueApiTypes = useMemo(() => {
    const types = criticalElements
      .map((element) => element.tag) // tag contains the API type value
      .filter((type): type is string => !!type && type !== "");
    return Array.from(new Set(types));
  }, [criticalElements]);

  // Pagination (server-driven)
  const startIndex = (currentPage - 1) * pageLimit;
  const endIndex = startIndex + pageLimit;

  // Handle pagination
  const goToPage = (page: number) => {
    const next = Math.max(1, Math.min(page, totalPages));
    const filters: CriticalElementFilters = {};
    if (appliedNameQuery) filters.name = appliedNameQuery;
    if (appliedTypeFilter !== 'all') filters.type = appliedTypeFilter;
    if (appliedStartDate) filters.startDate = appliedStartDate.toISOString().split('T')[0];
    if (appliedEndDate) filters.endDate = appliedEndDate.toISOString().split('T')[0];
    fetchCriticalElements(next, filters);
  };

  const handleUploadClick = () => {
    setIsUploadDialogOpen(true);
    setUploadForm({
      title: "",
      type: "",
      file: null,
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadForm((prev) => ({ ...prev, file }));
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm((prev) => ({ ...prev, file }));
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadForm.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!uploadForm.file) {
      toast.error("Please select a file");
      return;
    }

    setIsUploading(true);

    try {
      // First upload the file
      const fileUploadResponse = await uploadFile(uploadForm.file);

      if (!fileUploadResponse.url) {
        throw new Error("File upload failed");
      }

      // Then create the critical element with the file link
      const newElementData = {
        name: uploadForm.title.trim(),
        pdflink: fileUploadResponse.url,
        type: uploadForm.type || undefined,
      };

      await addCriticalElement(newElementData);

      toast.success("Critical element uploaded successfully");
      
      // Reset form
      setIsUploadDialogOpen(false);
      setUploadForm({
        title: "",
        type: "",
        file: null,
      });
      
      // Refetch data to update the table
      setCurrentPage(1);
      const filters: CriticalElementFilters = {};
      if (appliedNameQuery) filters.name = appliedNameQuery;
      if (appliedTypeFilter !== "all") filters.type = appliedTypeFilter;
      if (appliedStartDate) filters.startDate = appliedStartDate.toISOString().split('T')[0];
      if (appliedEndDate) filters.endDate = appliedEndDate.toISOString().split('T')[0];
      await fetchCriticalElements(1, filters);
    } catch (error) {
      console.error("Error uploading critical element:", error);
      toast.error("Failed to upload critical element", {
        description: "Please try again later",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (element: CriticalElement) => {
    setEditingElement(element);
    setEditForm({
      id: element.id,
      title: element.title,
      type: element.tag || "", // tag contains the API type value
      file: null, // Keep existing file, don't allow re-upload
      pdflink: element.pdflink,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleEditDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleEditDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setEditForm((prev) => ({ ...prev, file }));
    }
  }, []);

  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditForm((prev) => ({ ...prev, file }));
    }
  };

  const handleEditSubmit = async () => {
    if (!editForm.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setIsUploading(true);

    try {
      let pdflink = editForm.pdflink;

      // If a new file was uploaded, process it first
      if (editForm.file) {
        const fileUploadResponse = await uploadFile(editForm.file);

        if (!fileUploadResponse.url) {
          throw new Error("File upload failed");
        }

        pdflink = fileUploadResponse.url;
      }

      // Update the critical element with the API
      const updatedElementData = {
        id: editForm.id,
        name: editForm.title.trim(),
        pdflink: pdflink,
        type: editForm.type || undefined,
      };

      await updateCriticalElement(updatedElementData);

      toast.success("Critical element updated successfully");
      
      // Refetch data to update the table
      const filters: CriticalElementFilters = {};
      if (appliedNameQuery) filters.name = appliedNameQuery;
      if (appliedTypeFilter !== "all") filters.type = appliedTypeFilter;
      if (appliedStartDate) filters.startDate = appliedStartDate.toISOString().split('T')[0];
      if (appliedEndDate) filters.endDate = appliedEndDate.toISOString().split('T')[0];
      await fetchCriticalElements(currentPage, filters);
    } catch (error) {
      console.error("Error updating critical element:", error);
      toast.error("Failed to update critical element", {
        description: "Please try again later",
      });
    } finally {
      setIsUploading(false);
      setIsEditDialogOpen(false);
      setEditingElement(null);
      setEditForm({
        id: "",
        title: "",
        type: "",
        file: null,
        pdflink: "",
      });
    }
  };

  const handleDelete = async (element: CriticalElement) => {
    const confirmToastId = toast(`Are you sure you want to delete "${element.title}"?`, {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          // Dismiss the confirmation toast
          toast.dismiss(confirmToastId);
          
          try {
            const deletePromise = async () => {
              await deleteCriticalElement(element.id);
              
              // Refetch data to update the table
              const filters: CriticalElementFilters = {};
              if (appliedNameQuery) filters.name = appliedNameQuery;
              if (appliedTypeFilter !== "all") filters.type = appliedTypeFilter;
              if (appliedStartDate) filters.startDate = appliedStartDate.toISOString().split('T')[0];
              if (appliedEndDate) filters.endDate = appliedEndDate.toISOString().split('T')[0];
              await fetchCriticalElements(currentPage, filters);
            };

            toast.promise(deletePromise(), {
              loading: `Deleting "${element.title}"...`,
              success: "Critical element deleted successfully",
              error: (error: any) => {
                const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete critical element";
                return errorMessage;
              },
            });
          } catch (error: any) {
            console.error("Error deleting critical element:", error);
            const errorMessage = error?.response?.data?.message || error?.message || "Please try again later";
            toast.error("Failed to delete critical element", {
              description: errorMessage,
            });
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {
          toast.dismiss(confirmToastId);
        },
      },
      duration: Infinity,
    });
  };

  const handleDownload = (element: CriticalElement) => {
    if (element.pdflink) {
      // Open the PDF link in a new tab
      window.open(element.pdflink, "_blank");
    } else {
      toast.error("Download link not available");
    }
  };

  // Get type badge style
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "document":
        return "bg-blue-100 text-blue-800";
      case "image":
        return "bg-green-100 text-green-800";
      case "video":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
                Critical Elements
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
                Manage and organize your critical elements
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleUploadClick}
                disabled={isUploading}
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
                  borderRadius: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Radius["Radius-200"]
                      : tokens.Light.Radius["Radius-200"]
                  ),
                }}
              >
                <Upload size={16} />
                Upload Critical Element
              </Button>
            </div>
          </div>
        </div>

        {/* Upload Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent
            style={{
              background: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Surface.Foreground
                  : tokens.Light.Surface.Foreground
              ),
            }}
          >
            <DialogHeader>
              <DialogTitle
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                Upload Critical Element
              </DialogTitle>
              <DialogDescription
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                }}
              >
                Add a new critical element with title and file
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label
                  htmlFor="title"
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
                  id="title"
                  placeholder="Enter critical element title"
                  value={uploadForm.title}
                  onChange={(e) =>
                    setUploadForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  style={{
                    background: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Surface.Primary
                        : tokens.Light.Surface.Primary
                    ),
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                    borderColor: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Stroke["Stroke-02"]
                        : tokens.Light.Stroke["Stroke-02"]
                    ),
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="type"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}
                >
                  Type
                </Label>
                <Select
                  value={uploadForm.type}
                  onValueChange={(value) =>
                    setUploadForm((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger
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
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    <SelectValue placeholder="Select type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueApiTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="file"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}
                >
                  File *
                </Label>
                {!uploadForm.file ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging ? "opacity-60" : ""
                    }`}
                    style={{
                      borderColor: isDragging
                        ? resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Button.Primary
                              : tokens.Light.Button.Primary
                          )
                        : resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Stroke["Stroke-02"]
                              : tokens.Light.Stroke["Stroke-02"]
                          ),
                      background: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Surface.Primary
                          : tokens.Light.Surface.Primary
                      ),
                    }}
                  >
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="file"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload
                        size={32}
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Button.Primary
                              : tokens.Light.Button.Primary
                          ),
                        }}
                      />
                      <div>
                        <span
                          className="font-medium"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Button.Primary
                                : tokens.Light.Button.Primary
                            ),
                          }}
                        >
                          Click to upload
                        </span>
                        <span
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                          {" "}
                          or drag and drop
                        </span>
                      </div>
                      <p
                        className="text-xs"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Subtext
                              : tokens.Light.Typography.Subtext
                          ),
                        }}
                      >
                        Any file type
                      </p>
                    </label>
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-between p-4 rounded-lg border"
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
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="p-2 rounded"
                        style={{
                          background: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Highlight["HIghhlight Gray"][50]
                              : tokens.Light.Highlight["HIghhlight Gray"][50]
                          ),
                        }}
                      >
                        <Upload
                          size={20}
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Button.Primary
                                : tokens.Light.Button.Primary
                            ),
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-medium truncate"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          {uploadForm.file.name}
                        </p>
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
                          {formatFileSize(uploadForm.file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setUploadForm((prev) => ({ ...prev, file: null }))
                      }
                      className="h-8 w-8"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsUploadDialogOpen(false)}
                style={{
                  background: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Button.Primary
                      : tokens.Light.Button.Primary
                  ),
                  borderColor: resolveToken(
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
                Cancel
              </Button>
              <Button
                onClick={handleUploadSubmit}
                disabled={isUploading}
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
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent
            style={{
              background: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Surface.Foreground
                  : tokens.Light.Surface.Foreground
              ),
            }}
          >
            <DialogHeader>
              <DialogTitle
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                Edit Critical Element
              </DialogTitle>
              <DialogDescription
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                }}
              >
                Update critical element details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label
                  htmlFor="edit-title"
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
                  id="edit-title"
                  placeholder="Enter critical element title"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  style={{
                    background: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Surface.Primary
                        : tokens.Light.Surface.Primary
                    ),
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                    borderColor: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Stroke["Stroke-02"]
                        : tokens.Light.Stroke["Stroke-02"]
                    ),
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="edit-type"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}
                >
                  Type
                </Label>
                <Select
                  value={editForm.type}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger
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
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    <SelectValue placeholder="Select type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueApiTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="edit-file"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}
                >
                  File (optional - select new file to replace)
                </Label>
                {!editForm.file ? (
                  <div
                    onDragOver={handleEditDragOver}
                    onDragLeave={handleEditDragLeave}
                    onDrop={handleEditDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging ? "opacity-60" : ""
                    }`}
                    style={{
                      borderColor: isDragging
                        ? resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Button.Primary
                              : tokens.Light.Button.Primary
                          )
                        : resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Stroke["Stroke-02"]
                              : tokens.Light.Stroke["Stroke-02"]
                          ),
                      background: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Surface.Primary
                          : tokens.Light.Surface.Primary
                      ),
                    }}
                  >
                    <Input
                      id="edit-file"
                      type="file"
                      onChange={handleEditFileSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="edit-file"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload
                        size={32}
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Button.Primary
                              : tokens.Light.Button.Primary
                          ),
                        }}
                      />
                      <div>
                        <span
                          className="font-medium"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Button.Primary
                                : tokens.Light.Button.Primary
                            ),
                          }}
                        >
                          Click to upload
                        </span>
                        <span
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                          {" "}
                          or drag and drop
                        </span>
                      </div>
                      <p
                        className="text-xs"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Subtext
                              : tokens.Light.Typography.Subtext
                          ),
                        }}
                      >
                        Replace current file (optional)
                      </p>
                    </label>
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-between p-4 rounded-lg border"
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
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="p-2 rounded"
                        style={{
                          background: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Highlight["HIghhlight Gray"][50]
                              : tokens.Light.Highlight["HIghhlight Gray"][50]
                          ),
                        }}
                      >
                        <Upload
                          size={20}
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Button.Primary
                                : tokens.Light.Button.Primary
                            ),
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-medium truncate"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          {editForm.file.name}
                        </p>
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
                          {formatFileSize(editForm.file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setEditForm((prev) => ({ ...prev, file: null }))
                      }
                      className="h-8 w-8"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingElement(null);
                  setEditForm({
                    id: "",
                    title: "",
                    type: "",
                    file: null,
                    pdflink: "",
                  });
                }}
                style={{
                  background: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Button.Primary
                      : tokens.Light.Button.Primary
                  ),
                  borderColor: resolveToken(
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
                Cancel
              </Button>
              <Button
                onClick={handleEditSubmit}
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
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
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
                placeholder="Search by name..."
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
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
              <Select value={typeFilter} onValueChange={setTypeFilter}>
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
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "all" ? "All Types" : (type ? type.charAt(0).toUpperCase() + type.slice(1) : "")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label
                htmlFor="start-date"
                className="mb-2 block"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                Start Date
              </Label>
              <DatePicker
                date={startDate}
                onDateChange={setStartDate}
                placeholder="Filter from date"
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <Label
                htmlFor="end-date"
                className="mb-2 block"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                End Date
              </Label>
              <DatePicker
                date={endDate}
                onDateChange={setEndDate}
                placeholder="Filter to date"
                className="w-full"
              />
            </div>
          </div>

          {/* Filter Action Buttons */}
          <div className="flex flex-col md:flex-row gap-2 justify-end">
            <Button
              variant="outline"
              onClick={async () => {
                // Reset input filters
                setNameQuery("");
                setTypeFilter("all");
                setStartDate(undefined);
                setEndDate(undefined);

                // Reset applied filters
                setAppliedNameQuery("");
                setAppliedTypeFilter("all");
                setAppliedStartDate(undefined);
                setAppliedEndDate(undefined);

                // Reset to first page
                setCurrentPage(1);

                // Fetch data without filters (page 1)
                await fetchCriticalElements(1);

                // Show toast notification
                toast.success("Filters reset", {
                  description: "All filters have been cleared",
                });
              }}
              className="h-10"
              style={{
                background: "transparent",
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
              Reset All Filters
            </Button>
            <Button
              onClick={async () => {
                // Apply the current filter values
                setAppliedNameQuery(nameQuery);
                setAppliedTypeFilter(typeFilter);
                setAppliedStartDate(startDate);
                setAppliedEndDate(endDate);

                // Reset to first page
                setCurrentPage(1);

                // Create filters object for API call
                const apiFilters: CriticalElementFilters = {};

                if (nameQuery) apiFilters.name = nameQuery;
                if (typeFilter !== "all") apiFilters.type = typeFilter;
                if (startDate)
                  apiFilters.startDate = startDate.toISOString().split("T")[0];
                if (endDate)
                  apiFilters.endDate = endDate.toISOString().split("T")[0];

                // Fetch data with filters (page 1)
                await fetchCriticalElements(1, apiFilters);

                // Show toast notification
                toast.success("Filters applied", {
                  description: "The table has been updated with your filters",
                });
              }}
              className="h-10"
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
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Critical Elements Table */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mb-4"
              style={{
                borderColor: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button.Primary
                    : tokens.Light.Button.Primary
                ),
              }}
            ></div>
            <p
              style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Heading
                    : tokens.Light.Typography.Heading
                ),
              }}
            >
              Loading critical elements...
            </p>
          </div>
        ) : (
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
                    Type
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
                    Size
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
                    className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Subtext
                          : tokens.Light.Typography.Subtext
                      ),
                    }}
                  >
                    Uploaded By
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
                {criticalElements.map((element) => (
                  <tr
                    key={element.id}
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
                      <div className="font-medium" title={element.title}>{truncate(element.title, 70)}</div>
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
                        {element.type.charAt(0).toUpperCase() +
                          element.type.slice(1)}
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
                      <Badge
                        className={`${getTypeBadge(element.type)} border-none`}
                        variant="outline"
                      >
                        {element.type.charAt(0).toUpperCase() +
                          element.type.slice(1)}
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
                      {formatFileSize(element.size)}
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
                      {new Date(element.date).toLocaleDateString()}
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
                      <div>{element.uploadedBy}</div>
                      <div
                        className="text-xs"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Subtext
                              : tokens.Light.Typography.Subtext
                          ),
                        }}
                      >
                        {formatDateTime(element.uploadedDate)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(element)}
                          className="h-8 w-8"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Button.Primary
                                : tokens.Light.Button.Primary
                            ),
                          }}
                        >
                          <Download size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(element)}
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
                          onClick={() => handleDelete(element)}
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
                {criticalElements.length === 0 && (
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
                      No critical elements found. Try adjusting your filters or
                      upload a new element.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalItems > 0 && (
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
              Showing {Math.min(startIndex + 1, totalItems)} to {Math.min(endIndex, totalItems)} of {totalItems} elements
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

export default CriticalElementsDashboard;
