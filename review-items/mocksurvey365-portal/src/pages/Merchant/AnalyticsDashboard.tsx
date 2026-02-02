import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Upload, Edit, Trash2, Download, X, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText, Book } from "lucide-react";
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
  getAllResourcesPaginated,
  addResource, 
  deleteResource, 
  updateResource,
  getAllLongTermRegulationsPaginated,
  addLongTermRegulation,
  deleteLongTermRegulation,
  updateLongTermRegulation,
  uploadFile
} from "@/api/services/resourcesService";
import type { ResourceFilters, RegulationFilters } from "@/api/services/resourcesService";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Local Resource interface with UI-specific fields
interface Resource {
      id: string;
      title: string;
  name: string; // filename
  type: string;
  size: number; // in bytes
  date: string; // date field
  description: string;
  uploadedDate: string;
  uploadedBy: string;
  pdflink?: string;
  state?: string; // for regulations
  resourceType: "resource" | "regulation";
}

const AnalyticsDashboard = () => {
  const theme = getTheme();
  const truncate = (text: string, max: number = 60) =>
    text && text.length > max ? text.slice(0, max - 1) + "…" : text;
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Input filter states
  const [nameQuery, setNameQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [stateFilter, setStateFilter] = useState<string>("");
  
  // Applied filter states
  const [appliedNameQuery, setAppliedNameQuery] = useState("");
  const [appliedTypeFilter, setAppliedTypeFilter] = useState<string>("all");
  const [appliedStartDate, setAppliedStartDate] = useState<Date | undefined>(undefined);
  const [appliedEndDate, setAppliedEndDate] = useState<Date | undefined>(undefined);
  const [appliedStateFilter, setAppliedStateFilter] = useState<string>("");
  
  const [activeTab, setActiveTab] = useState<"resources" | "regulations">("resources");
  const [uploadForm, setUploadForm] = useState({
    title: "",
    date: undefined as Date | undefined,
    description: "",
    file: null as File | null,
    type: "671", // Default resource type
    state: "", // For regulations
  });
  const [editForm, setEditForm] = useState({
    id: "",
    title: "",
    date: undefined as Date | undefined,
    description: "",
    file: null as File | null,
    pdflink: "",
    type: "",
    state: "",
    resourceType: "resource" as "resource" | "regulation",
  });
  const [isDragging, setIsDragging] = useState(false);

  // Pagination state (from API)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch resources and regulations from API based on active tab
  const fetchResources = useCallback(async (
    page = 1,
    resourceFilters?: ResourceFilters,
    regulationFilters?: RegulationFilters
  ) => {
    setIsLoading(true);
    try {
      // Only fetch data for the active tab
      if (activeTab === "resources") {
        // Fetch only resources (paginated)
        const { items, pagination } = await getAllResourcesPaginated(page, pageLimit, resourceFilters);
        
        // Transform API resources to UI resources
        const resourcesData = items.map(resource => ({
          id: resource.id,
          title: resource.name,
          name: resource.name,
          type: resource.type,
          size: 0, // Size not available from API
          date: resource.date,
          description: resource.description || "",
          uploadedDate: resource.createdAt || new Date().toISOString(),
          uploadedBy: "Admin", // User info not available from API
          pdflink: resource.pdflink,
          resourceType: "resource" as const
        }));
        
        // Set resources and pagination data
        setResources(resourcesData);
        setTotalItems(pagination.total ?? resourcesData.length);
        setTotalPages(pagination.totalPages ?? 1);
        setPageLimit(pagination.limit ?? pageLimit);
        setCurrentPage(pagination.currentPage ?? page);
      } else {
        // Fetch only regulations (paginated)
        const { items, pagination } = await getAllLongTermRegulationsPaginated(page, pageLimit, regulationFilters);
        
        // Transform API regulations to UI resources
        const regulationsData = items.map(regulation => ({
          id: regulation.id,
          title: regulation.name,
          name: regulation.name,
          type: "regulation",
          size: 0, // Size not available from API
          date: regulation.date,
          description: regulation.description || "",
          uploadedDate: regulation.createdAt || new Date().toISOString(),
          uploadedBy: "Admin", // User info not available from API
          pdflink: regulation.pdflink,
          state: regulation.state,
          resourceType: "regulation" as const
        }));
        
        // Set regulations and pagination data
        setResources(regulationsData);
        setTotalItems(pagination.total ?? regulationsData.length);
        setTotalPages(pagination.totalPages ?? 1);
        setPageLimit(pagination.limit ?? pageLimit);
        setCurrentPage(pagination.currentPage ?? page);
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error);
      toast.error(`Failed to fetch ${activeTab}`, {
        description: "Please try again later",
      });
      
      // Set empty resources array on error
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);
  
  // Initial data fetch
  useEffect(() => {
    fetchResources(1);
  }, [fetchResources]);
  
  // Initialize applied filters with the initial filter values
  useEffect(() => {
    setAppliedNameQuery(nameQuery);
    setAppliedTypeFilter(typeFilter);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setAppliedStateFilter(stateFilter);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  
  // Filter resources based on applied filters and active tab
  const filteredResources = useMemo(() => {
    // First filter by resource type based on active tab
    const resourcesByType = resources.filter(resource => 
      activeTab === "resources" 
        ? resource.resourceType === "resource"
        : resource.resourceType === "regulation"
    );
    
    // Then apply search and type filters
    return resourcesByType.filter((resource) => {
      // Name filter
      const matchesName =
        appliedNameQuery === "" ||
        resource.title.toLowerCase().includes(appliedNameQuery.toLowerCase()) ||
        resource.name.toLowerCase().includes(appliedNameQuery.toLowerCase());

      // Type filter
      const matchesType = appliedTypeFilter === "all" || resource.type === appliedTypeFilter;
      
      // State filter (for regulations)
      const matchesState = 
        !appliedStateFilter || 
        !resource.state || 
        resource.state.toLowerCase().includes(appliedStateFilter.toLowerCase());
      
      // Date filters
      const resourceDate = new Date(resource.date);
      const matchesStartDate = !appliedStartDate || resourceDate >= appliedStartDate;
      const matchesEndDate = !appliedEndDate || resourceDate <= appliedEndDate;

      return matchesName && matchesType && matchesState && matchesStartDate && matchesEndDate;
    });
  }, [resources, appliedNameQuery, appliedTypeFilter, appliedStateFilter, appliedStartDate, appliedEndDate, activeTab]);
  
  // Get unique resource types for filter dropdown based on active tab
  const uniqueTypes = useMemo(() => {
    const resourcesByType = resources.filter(resource => 
      activeTab === "resources" 
        ? resource.resourceType === "resource"
        : resource.resourceType === "regulation"
    );
    
    const types = resourcesByType
      .map((resource) => resource.type)
      .filter((type): type is string => !!type);
    return ["all", ...Array.from(new Set(types))];
  }, [resources, activeTab]);
  
  // Pagination (server-driven)
  const startIndex = (currentPage - 1) * pageLimit;
  const endIndex = startIndex + pageLimit;
  
  // Handle pagination
  const goToPage = (page: number) => {
    const next = Math.max(1, Math.min(page, totalPages));
    fetchResources(next, activeTab === 'resources' ? {
      name: appliedNameQuery || undefined,
      type: appliedTypeFilter !== 'all' ? appliedTypeFilter : undefined,
      startDate: appliedStartDate ? appliedStartDate.toISOString().split('T')[0] : undefined,
      endDate: appliedEndDate ? appliedEndDate.toISOString().split('T')[0] : undefined,
    } : undefined, activeTab === 'regulations' ? {
      name: appliedNameQuery || undefined,
      state: appliedStateFilter || undefined,
      startDate: appliedStartDate ? appliedStartDate.toISOString().split('T')[0] : undefined,
      endDate: appliedEndDate ? appliedEndDate.toISOString().split('T')[0] : undefined,
    } : undefined);
  };

  const handleUploadClick = () => {
    setIsUploadDialogOpen(true);
    setUploadForm({
      title: "",
      date: undefined,
      description: "",
      file: null,
        type: "671",
        state: "",
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
      setUploadForm(prev => ({ ...prev, file }));
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  const handleFileUploadToServer = async (file: File): Promise<string> => {
    try {
      const uploadResponse = await uploadFile(file);
      if (uploadResponse.success && uploadResponse.url) {
        return uploadResponse.url;
      } else {
        throw new Error("File upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadForm.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!uploadForm.date) {
      toast.error("Please select a date");
      return;
    }
    if (!uploadForm.file) {
      toast.error("Please select a file");
      return;
    }

    setIsUploading(true);
    try {
      // Upload file first
      const fileUrl = await handleFileUploadToServer(uploadForm.file);
      
      // Create resource or regulation based on active tab
      if (activeTab === "resources") {
        // Add resource
        await addResource({
          name: uploadForm.title.trim(),
          type: uploadForm.type,
          pdflink: fileUrl,
          date: uploadForm.date.toISOString().split('T')[0],
        description: uploadForm.description.trim() || "",
        });
        
        toast.success("Resource uploaded successfully");
      } else {
        // Add regulation
        if (!uploadForm.state) {
          toast.error("Please enter a state for the regulation");
      setIsUploading(false);
          return;
        }
        
        await addLongTermRegulation({
          name: uploadForm.title.trim(),
          state: uploadForm.state,
          pdflink: fileUrl,
          date: uploadForm.date.toISOString().split('T')[0],
          description: uploadForm.description.trim() || "",
        });
        
        toast.success("Regulation uploaded successfully");
      }
      
      // Reset form
      setIsUploadDialogOpen(false);
      setUploadForm({
        title: "",
        date: undefined,
        description: "",
        file: null,
        type: "671",
        state: "",
      });
      
      // Refetch data to update the table
      setCurrentPage(1);
      const resourceFilters: ResourceFilters = {};
      const regulationFilters: RegulationFilters = {};
      
      if (activeTab === "resources") {
        if (appliedNameQuery) resourceFilters.name = appliedNameQuery;
        if (appliedTypeFilter !== "all") resourceFilters.type = appliedTypeFilter;
        if (appliedStartDate) resourceFilters.startDate = appliedStartDate.toISOString().split('T')[0];
        if (appliedEndDate) resourceFilters.endDate = appliedEndDate.toISOString().split('T')[0];
        await fetchResources(1, resourceFilters, undefined);
      } else {
        if (appliedNameQuery) regulationFilters.name = appliedNameQuery;
        if (appliedStateFilter) regulationFilters.state = appliedStateFilter;
        if (appliedStartDate) regulationFilters.startDate = appliedStartDate.toISOString().split('T')[0];
        if (appliedEndDate) regulationFilters.endDate = appliedEndDate.toISOString().split('T')[0];
        await fetchResources(1, undefined, regulationFilters);
      }
    } catch (error) {
      console.error("Error uploading resource:", error);
      toast.error("Failed to upload resource", {
        description: "Please try again later",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditForm({
      id: resource.id,
      title: resource.title,
      date: new Date(resource.date),
      description: resource.description,
      file: null, // Keep existing file, don't allow re-upload
      pdflink: resource.pdflink || "",
      type: resource.type,
      state: resource.state || "",
      resourceType: resource.resourceType,
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
      setEditForm(prev => ({ ...prev, file }));
    }
  }, []);

  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditForm(prev => ({ ...prev, file }));
    }
  };

  const handleEditSubmit = async () => {
    if (!editForm.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!editForm.date) {
      toast.error("Please select a date");
      return;
    }

    setIsUploading(true);
    try {
      let fileUrl = editForm.pdflink;
      
      // If a new file was uploaded, handle that first
      if (editForm.file) {
        fileUrl = await handleFileUploadToServer(editForm.file);
      }
      
      if (editForm.resourceType === "resource") {
        // Update resource
        await updateResource(editForm.id, {
          name: editForm.title.trim(),
          type: editForm.type,
          pdflink: fileUrl,
          date: editForm.date.toISOString().split('T')[0],
          description: editForm.description.trim() || "",
        });
      } else {
        // Update regulation
        if (!editForm.state) {
          toast.error("Please enter a state for the regulation");
          setIsUploading(false);
          return;
        }
        
        await updateLongTermRegulation(editForm.id, {
          name: editForm.title.trim(),
          state: editForm.state,
          pdflink: fileUrl,
          date: editForm.date.toISOString().split('T')[0],
          description: editForm.description.trim() || "",
        });
      }
      
      toast.success(`${editForm.resourceType === "resource" ? "Resource" : "Regulation"} updated successfully`);
      
      // Refetch data to update the table
      const resourceFilters: ResourceFilters = {};
      const regulationFilters: RegulationFilters = {};
      
      if (editForm.resourceType === "resource") {
        if (appliedNameQuery) resourceFilters.name = appliedNameQuery;
        if (appliedTypeFilter !== "all") resourceFilters.type = appliedTypeFilter;
        if (appliedStartDate) resourceFilters.startDate = appliedStartDate.toISOString().split('T')[0];
        if (appliedEndDate) resourceFilters.endDate = appliedEndDate.toISOString().split('T')[0];
        await fetchResources(currentPage, resourceFilters, undefined);
      } else {
        if (appliedNameQuery) regulationFilters.name = appliedNameQuery;
        if (appliedStateFilter) regulationFilters.state = appliedStateFilter;
        if (appliedStartDate) regulationFilters.startDate = appliedStartDate.toISOString().split('T')[0];
        if (appliedEndDate) regulationFilters.endDate = appliedEndDate.toISOString().split('T')[0];
        await fetchResources(currentPage, undefined, regulationFilters);
      }
    } catch (error) {
      console.error("Error updating resource:", error);
      toast.error("Failed to update resource", {
        description: "Please try again later",
      });
    } finally {
      setIsUploading(false);
    setIsEditDialogOpen(false);
    setEditForm({
      id: "",
      title: "",
      date: undefined,
      description: "",
      file: null,
        pdflink: "",
        type: "",
        state: "",
        resourceType: "resource",
    });
    }
  };

  const handleDelete = async (resource: Resource) => {
    const confirmToastId = toast(`Are you sure you want to delete "${resource.title}"?`, {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          // Dismiss the confirmation toast
          toast.dismiss(confirmToastId);
          
          try {
            const deletePromise = async () => {
              if (resource.resourceType === "resource") {
                await deleteResource(resource.id);
              } else {
                await deleteLongTermRegulation(resource.id);
              }
              
              // Refetch data to update the table
              const resourceFilters: ResourceFilters = {};
              const regulationFilters: RegulationFilters = {};
              
              if (resource.resourceType === "resource") {
                if (appliedNameQuery) resourceFilters.name = appliedNameQuery;
                if (appliedTypeFilter !== "all") resourceFilters.type = appliedTypeFilter;
                if (appliedStartDate) resourceFilters.startDate = appliedStartDate.toISOString().split('T')[0];
                if (appliedEndDate) resourceFilters.endDate = appliedEndDate.toISOString().split('T')[0];
                await fetchResources(currentPage, resourceFilters, undefined);
              } else {
                if (appliedNameQuery) regulationFilters.name = appliedNameQuery;
                if (appliedStateFilter) regulationFilters.state = appliedStateFilter;
                if (appliedStartDate) regulationFilters.startDate = appliedStartDate.toISOString().split('T')[0];
                if (appliedEndDate) regulationFilters.endDate = appliedEndDate.toISOString().split('T')[0];
                await fetchResources(currentPage, undefined, regulationFilters);
              }
            };

            toast.promise(deletePromise(), {
              loading: `Deleting "${resource.title}"...`,
              success: `${resource.resourceType === "resource" ? "Resource" : "Regulation"} deleted successfully`,
              error: (error: any) => {
                const errorMessage = error?.response?.data?.message || error?.message || `Failed to delete ${resource.resourceType === "resource" ? "resource" : "regulation"}`;
                return errorMessage;
              },
            });
          } catch (error: any) {
            console.error("Error deleting resource:", error);
            const errorMessage = error?.response?.data?.message || error?.message || "Please try again later";
            toast.error(`Failed to delete ${resource.resourceType === "resource" ? "resource" : "regulation"}`, {
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

  const handleDownload = (resource: Resource) => {
    if (resource.pdflink) {
      // Open the PDF link in a new tab
      window.open(resource.pdflink, '_blank');
    } else {
    toast.info(`Downloading ${resource.title}...`);
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
                Resources
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
                Manage and organize your resources and regulations
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
                Upload {activeTab === "resources" ? "Resource" : "Regulation"}
              </Button>
    </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="mb-6">
          <Tabs 
            defaultValue="resources" 
            value={activeTab} 
            onValueChange={async (value) => {
              const newTab = value as "resources" | "regulations";
              setActiveTab(newTab);
              setCurrentPage(1);
              
              // Reset input filters
              setNameQuery("");
              setTypeFilter("all");
              setStartDate(undefined);
              setEndDate(undefined);
              setStateFilter("");
              
              // Reset applied filters
              setAppliedNameQuery("");
              setAppliedTypeFilter("all");
              setAppliedStartDate(undefined);
              setAppliedEndDate(undefined);
              setAppliedStateFilter("");
              
              // Fetch data for the new tab
              setIsLoading(true);
              try {
                await fetchResources(1);
              } catch (error) {
                console.error(`Error fetching ${newTab}:`, error);
                toast.error(`Failed to fetch ${newTab}`, {
                  description: "Please try again later"
                });
              }
            }}
          >
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="resources" className="flex items-center gap-2">
                <FileText size={16} />
                Resources
              </TabsTrigger>
              <TabsTrigger value="regulations" className="flex items-center gap-2">
                <Book size={16} />
                Regulations
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
              <DialogTitle style={{
                color: resolveToken(
          theme === "dark"
                    ? tokens.Dark.Typography.Heading
                    : tokens.Light.Typography.Heading
                ),
              }}>
                Upload {activeTab === "resources" ? "Resource" : "Regulation"}
              </DialogTitle>
              <DialogDescription style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                ),
              }}>
                Add a new {activeTab === "resources" ? "resource" : "regulation"} with title, date, description, and file
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title" style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}>
                  Title *
                </Label>
                <Input
                  id="title"
                  placeholder={`Enter ${activeTab === "resources" ? "resource" : "regulation"} title`}
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
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
              
              {activeTab === "resources" && (
                <div className="space-y-2">
                  <Label htmlFor="type" style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}>
                    Resource Type *
                  </Label>
                  <Input
                    id="type"
                    placeholder="Enter resource type (e.g. 671)"
                    value={uploadForm.type}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, type: e.target.value }))}
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
              )}
              
              {activeTab === "regulations" && (
                <div className="space-y-2">
                  <Label htmlFor="state" style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}>
                    State *
                  </Label>
                  <Input
                    id="state"
                    placeholder="Enter state name (e.g. Alabama)"
                    value={uploadForm.state}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, state: e.target.value }))}
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
              )}
              
              <div className="space-y-2">
                <Label htmlFor="date" style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}>
                  Date *
                </Label>
                <DatePicker
                  date={uploadForm.date}
                  onDateChange={(date) => setUploadForm(prev => ({ ...prev, date }))}
                  placeholder="Select a date"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}>
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder={`Enter ${activeTab === "resources" ? "resource" : "regulation"} description (optional)`}
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
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
                <Label htmlFor="file" style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}>
                  File *
                </Label>
                {!uploadForm.file ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging ? 'opacity-60' : ''
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
                        <span style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                        }}>
                          {" "}or drag and drop
                        </span>
                      </div>
                      <p className="text-xs" style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Subtext
                            : tokens.Light.Typography.Subtext
                        ),
                      }}>
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
                        <Upload size={20} style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Button.Primary
                              : tokens.Light.Button.Primary
                          ),
                        }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                        }}>
                          {uploadForm.file.name}
                        </p>
                        <p className="text-sm" style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Subtext
                              : tokens.Light.Typography.Subtext
                          ),
                        }}>
                          {formatFileSize(uploadForm.file.size)}
              </p>
            </div>
          </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setUploadForm(prev => ({ ...prev, file: null }))}
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
              <DialogTitle style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
              }}>
                Edit {editForm.resourceType === "resource" ? "Resource" : "Regulation"}
              </DialogTitle>
              <DialogDescription style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                ),
              }}>
                Update {editForm.resourceType === "resource" ? "resource" : "regulation"} details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title" style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}>
                  Title *
                </Label>
                <Input
                  id="edit-title"
                  placeholder={`Enter ${editForm.resourceType === "resource" ? "resource" : "regulation"} title`}
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
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
              
              {editForm.resourceType === "resource" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-type" style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}>
                    Resource Type *
                  </Label>
                  <Input
                    id="edit-type"
                    placeholder="Enter resource type (e.g. 671)"
                    value={editForm.type}
                    onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
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
              )}
              
              {editForm.resourceType === "regulation" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-state" style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}>
                    State *
                  </Label>
                  <Input
                    id="edit-state"
                    placeholder="Enter state name (e.g. Alabama)"
                    value={editForm.state}
                    onChange={(e) => setEditForm(prev => ({ ...prev, state: e.target.value }))}
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
              )}
              
              <div className="space-y-2">
                <Label htmlFor="edit-date" style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}>
                  Date *
                </Label>
                <DatePicker
                  date={editForm.date}
                  onDateChange={(date) => setEditForm(prev => ({ ...prev, date }))}
                  placeholder="Select a date"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description" style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}>
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  placeholder={`Enter ${editForm.resourceType === "resource" ? "resource" : "regulation"} description (optional)`}
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
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
                <Label htmlFor="edit-file" style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}>
                  File (optional - select new file to replace)
                </Label>
                {!editForm.file ? (
                  <div
                    onDragOver={handleEditDragOver}
                    onDragLeave={handleEditDragLeave}
                    onDrop={handleEditDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging ? 'opacity-60' : ''
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
                        <span style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Subtext
                              : tokens.Light.Typography.Subtext
                          ),
                        }}>
                          {" "}or drag and drop
                        </span>
            </div>
                      <p className="text-xs" style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Subtext
                            : tokens.Light.Typography.Subtext
                        ),
                      }}>
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
                        <Upload size={20} style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Button.Primary
                              : tokens.Light.Button.Primary
                          ),
                        }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate" style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                        }}>
                          {editForm.file.name}
                        </p>
                        <p className="text-sm" style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                        }}>
                          {formatFileSize(editForm.file.size)}
              </p>
            </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditForm(prev => ({ ...prev, file: null }))}
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
                  setEditForm({
                    id: "",
                    title: "",
                    date: undefined,
                    description: "",
                    file: null,
        pdflink: "",
        type: "",
        state: "",
        resourceType: "resource",
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
            
            {/* State filter for regulations */}
            {activeTab === "regulations" && (
              <div className="flex-1">
                <Label 
                  htmlFor="state-filter"
                  className="mb-2 block"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}
                >
                  State
                </Label>
                <Input
                  id="state-filter"
                  placeholder="Filter by state"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="w-full"
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
            )}
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
                setStateFilter("");
                
                // Reset applied filters
                setAppliedNameQuery("");
                setAppliedTypeFilter("all");
                setAppliedStartDate(undefined);
                setAppliedEndDate(undefined);
                setAppliedStateFilter("");
                
                // Reset to first page
                setCurrentPage(1);
                
                // Fetch data without filters (page 1)
                await fetchResources(1);
                
                // Show toast notification
                toast.success("Filters reset", {
                  description: "All filters have been cleared"
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
                setAppliedStateFilter(stateFilter);
                
                // Reset to first page
                setCurrentPage(1);
                
                // Build filters and fetch page 1 with filters
                const resourceFilters: ResourceFilters = {};
                const regulationFilters: RegulationFilters = {};
                if (nameQuery) resourceFilters.name = nameQuery;
                if (typeFilter !== "all") resourceFilters.type = typeFilter;
                if (startDate) resourceFilters.startDate = startDate.toISOString().split('T')[0];
                if (endDate) resourceFilters.endDate = endDate.toISOString().split('T')[0];
                if (nameQuery) regulationFilters.name = nameQuery;
                if (stateFilter) regulationFilters.state = stateFilter;
                if (startDate) regulationFilters.startDate = startDate.toISOString().split('T')[0];
                if (endDate) regulationFilters.endDate = endDate.toISOString().split('T')[0];
                await fetchResources(1, resourceFilters, regulationFilters);
                
                // Show toast notification
                toast.success("Filters applied", {
                  description: "The table has been updated with your filters"
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

        {/* Resources Table */}
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading resources...</span>
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
              {filteredResources.map((resource) => (
                <tr
                  key={resource.id}
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
                    <div className="font-medium" title={resource.title}>{truncate(resource.title, 70)}</div>
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
                      {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
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
                      className={`${getTypeBadge(resource.type)} border-none`}
                      variant="outline"
                    >
                      {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
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
                    {formatFileSize(resource.size)}
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
                    {new Date(resource.date).toLocaleDateString()}
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
                    {resource.uploadedBy}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(resource)}
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
                        onClick={() => handleEdit(resource)}
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
                        onClick={() => handleDelete(resource)}
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
              {filteredResources.length === 0 && (
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
                    No resources found. Try adjusting your filters or upload a new resource.
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
              Showing {Math.min(startIndex + 1, totalItems)} to {Math.min(endIndex, totalItems)} of {totalItems} {activeTab === 'resources' ? 'resources' : 'regulations'}
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

export default AnalyticsDashboard;