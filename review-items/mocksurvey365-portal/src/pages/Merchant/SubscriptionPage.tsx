import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Plus, Edit, Trash2, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { tokens } from "@/styles/theme";
import { getTheme } from "@/styles/getTheme";
import { resolveToken } from "@/utils/resolveToken";
import { getAllSubscriptions } from "@/api/services/subscriptionService";
import type { Subscription } from "@/api/services/subscriptionService";

const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = getTheme();

  const [items, setItems] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [planQuery, setPlanQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Subscription | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllSubscriptions();
      // Normalize ids
      const normalized = data.map((d: any) => ({
        id: d.id || d._id,
        plan: d.plan,
        pricingModel: d.pricingModel,
        yearlyPrice: d.yearlyPrice,
        usageLimit: d.usageLimit,
        additionalSurvey: d.additionalSurvey,
        included: d.included,
        restrictions: d.restrictions,
        status: d.status,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }));
      setItems(normalized);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load subscriptions", { description: "Please try again later" });
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    return items.filter((s) => planQuery === "" || s.plan.toLowerCase().includes(planQuery.toLowerCase()));
  }, [items, planQuery]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageItems = filtered.slice(startIndex, endIndex);

  const formatMoney = (n?: number) => (n !== undefined ? `$${n.toLocaleString()}` : "-");

  return (
    <div
      className="container mx-auto md:px-9 px-5 pt-24"
      style={{
        background: resolveToken(
          theme === "dark" ? tokens.Dark.Surface.Primary : tokens.Light.Surface.Primary
        ),
      }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1
          className="md:text-[25px] font-[500] text-[22px] mb-4 md:mb-0"
          style={{
            color: resolveToken(
              theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading
            ),
          }}
        >
          Subscriptions
        </h1>
        <Button
          onClick={() => navigate("/dashboard/subscriptions/add")}
          className="flex items-center gap-2"
          style={{
            background: resolveToken(theme === "dark" ? tokens.Dark.Button.Primary : tokens.Light.Button.Primary),
            color: resolveToken(theme === "dark" ? tokens.Dark.Button["Primary Text"] : tokens.Light.Button["Primary Text"]),
            borderRadius: resolveToken(theme === "dark" ? tokens.Dark.Radius["Radius-200"] : tokens.Light.Radius["Radius-200"]),
          }}
        >
          <Plus size={16} />
          Add Subscription
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2"
            style={{
              color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext),
            }}
          />
          <Input
            placeholder="Search by plan name..."
            value={planQuery}
            onChange={(e) => setPlanQuery(e.target.value)}
            className="pl-10"
            style={{
              background: resolveToken(theme === "dark" ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground),
              borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]),
              color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading),
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-md border"
        style={{
          borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]),
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead
              style={{
                background: resolveToken(theme === "dark" ? tokens.Dark.Surface.Secondary : tokens.Light.Surface.Secondary),
              }}
            >
              <tr>
                <th
                  className="px-4 py-3 text-left text-sm font-medium"
                  style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}
                >
                  Plan
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell"
                  style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}
                >
                  Pricing Model
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell"
                  style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}
                >
                  Yearly Price
                </th>
                <th
                  className="px-4 py-3 text-right text-sm font-medium"
                  style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              style={{
                background: resolveToken(theme === "dark" ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground),
              }}
            >
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>
                    Loading subscriptions...
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}>
                    No subscriptions found. Try adjusting your filters or add a new plan.
                  </td>
                </tr>
              ) : (
                pageItems.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-t"
                    style={{
                      borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]),
                    }}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>
                      <div className="font-medium">{sub.plan}</div>
                      <div className="text-xs md:hidden mt-1" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}>
                        {sub.pricingModel}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>
                      {sub.pricingModel}
                    </td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>
                      {formatMoney(sub.yearlyPrice)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/dashboard/subscriptions/edit/${sub.id}`)}
                          className="h-8 w-8"
                          style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Button.Primary : tokens.Light.Button.Primary) }}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setItemToDelete(sub); setDeleteDialogOpen(true); }}
                          className="h-8 w-8"
                          style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Highlight["Highlight Red"][500] : tokens.Light.Highlight["Highlight Red"][500]) }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && filtered.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <div
            className="text-sm"
            style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}
          >
            Showing {startIndex + 1} to {Math.min(endIndex, filtered.length)} of {filtered.length} plans
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
              style={{
                background: "transparent",
                borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]),
                color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext),
              }}
            >
              <ChevronsLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8"
              style={{
                background: "transparent",
                borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]),
                color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext),
              }}
            >
              <ChevronLeft size={16} />
            </Button>
            <div className="flex items-center px-3">
              <span
                className="text-sm font-medium"
                style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}
              >
                {currentPage} / {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
              style={{
                background: "transparent",
                borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]),
                color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext),
              }}
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
              style={{
                background: "transparent",
                borderColor: resolveToken(theme === "dark" ? tokens.Dark.Stroke["Stroke-02"] : tokens.Light.Stroke["Stroke-02"]),
                color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext),
              }}
            >
              <ChevronsRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent
          style={{
            background: resolveToken(theme === "dark" ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground),
          }}
        >
          <DialogHeader>
            <DialogTitle
              style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}
            >
              Confirm Delete
            </DialogTitle>
          </DialogHeader>
          <div className="py-2" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}>
            This action cannot be undone. Remove plan "{itemToDelete?.plan}"?
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                // No DELETE endpoint provided; emulate removal locally
                if (!itemToDelete) return;
                setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
                setDeleteDialogOpen(false);
                setItemToDelete(null);
                toast.success("Plan removed locally");
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPage;
