import { useState, useEffect, useCallback } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { resolveToken } from "@/utils/resolveToken";
import { tokens } from "@/styles/theme";
import { getTheme } from "@/styles/getTheme";
import { Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getSignedUsers,
  getRoles,
  inviteAccount,
  type Role,
  type SignedUser,
} from "@/api/services/usersService";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RegisteredAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  registeredDate: string;
  status: "active" | "inactive" | "pending";
  plan: string;
  location: string;
  age: number;
  gender: string;
} 

interface InviteFormState {
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  phoneNumber: string;
  roleId: string;
}

const initialInviteFormState: InviteFormState = {
  firstName: "",
  lastName: "",
  email: "",
  organization: "",
  phoneNumber: "",
  roleId: "",
};

const DiscountManagement = () => {
  const theme = getTheme();
  const navigate = useNavigate();
  
  const [accounts, setAccounts] = useState<RegisteredAccount[]>([]); 
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteFormState>(initialInviteFormState);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const fetchAccounts = useCallback(
    async (page: number = currentPage, limit: number = itemsPerPage) => {
      setLoading(true);
      try {
        const response = await getSignedUsers(page, limit);

        // Map API response to RegisteredAccount interface
        const mappedAccounts: RegisteredAccount[] = response.users.map((user: SignedUser) => {
          // Determine status based on lastSignIn and isEmailVerified
          let status: "active" | "inactive" | "pending" = "pending";
          if (user.isEmailVerified) {
            status = user.lastSignIn ? "active" : "inactive";
          }

          // Get location from city or countryName
          const location = user.city || user.countryName || "Unknown";

          return {
            id: user.id,
            fullName: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email,
            phone: user.phoneNumber || "N/A",
            registeredDate: user.createdAt,
            status: status,
            plan: user.roleId?.name || "N/A", // Use role as plan
            location: location,
            age: 0, // Not provided by API
            gender: "", // Not provided by API
          };
        });

        setAccounts(mappedAccounts);
        setTotalPages(response.pagination.totalPages || 1);
        setTotalItems(response.pagination.total);
      } catch (error: any) {
        console.error("Failed to fetch accounts:", error);
        toast.error(error?.response?.data?.message || "Failed to load accounts");
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    },
    [currentPage, itemsPerPage]
  );

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    const fetchRolesData = async () => {
      setRolesLoading(true);
      try {
        const rolesResponse = await getRoles();
        setRoles(rolesResponse);
      } catch (error: any) {
        console.error("Failed to fetch roles:", error);
        toast.error(error?.response?.data?.message || "Failed to load roles");
      } finally {
        setRolesLoading(false);
      }
    };

    fetchRolesData();
  }, []);

  useEffect(() => {
    if (!inviteDialogOpen) {
      setInviteForm(initialInviteFormState);
    }
  }, [inviteDialogOpen]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", label: "Active" },
      inactive: { color: "bg-red-100 text-red-800", label: "Inactive" },
      pending: { color: "bg-blue-100 text-blue-800", label: "Pending" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };


  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleInviteInputChange = (field: keyof InviteFormState, value: string) => {
    setInviteForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleInviteSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const requiredFields: Array<keyof InviteFormState> = [
      "firstName",
      "lastName",
      "email",
      "organization",
      "phoneNumber",
      "roleId",
    ];

    const hasEmptyFields = requiredFields.some((field) => !inviteForm[field]?.trim());

    if (hasEmptyFields) {
      toast.error("Please fill in all required fields before inviting an account");
      return;
    }

    setInviteSubmitting(true);
    try {
      const payload = {
        firstName: inviteForm.firstName.trim(),
        lastName: inviteForm.lastName.trim(),
        email: inviteForm.email.trim(),
        organization: inviteForm.organization.trim(),
        phoneNumber: inviteForm.phoneNumber.trim(),
        roleId: inviteForm.roleId,
        agreementConfirmation: true,
        src: "web",
      };

      await inviteAccount(payload);
      toast.success("Invitation sent successfully");
      setInviteDialogOpen(false);
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        await fetchAccounts(1, itemsPerPage);
      }
    } catch (error: any) {
      console.error("Failed to invite account:", error);
      toast.error(error?.response?.data?.message || "Failed to invite account");
    } finally {
      setInviteSubmitting(false);
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
          <div className="flex items-start justify-between flex-col md:flex-row">
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
                Accounts
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
                View and manage registered accounts and survey completion status
              </p>
            </div>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="px-4"
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
                    Invite Account
                  </Button>
                </DialogTrigger>
                <DialogContent
                  className="sm:max-w-lg"
                  style={{
                    background: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Surface.Primary
                        : tokens.Light.Surface.Primary
                    ),
                    borderRadius: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Radius["Radius-lg"]
                        : tokens.Light.Radius["Radius-lg"]
                    ),
                    border: `1px solid ${resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Stroke["Stroke-02"]
                        : tokens.Light.Stroke["Stroke-02"]
                    )}`,
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
                      Invite Account
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
                      Send an invitation email to onboard a new team member and assign
                      their role.
                    </DialogDescription>
                  </DialogHeader>
                  <form className="mt-4 space-y-4" onSubmit={handleInviteSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label
                          htmlFor="invite-first-name"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                          First Name
                        </Label>
                        <Input
                          id="invite-first-name"
                          value={inviteForm.firstName}
                          onChange={(event) =>
                            handleInviteInputChange("firstName", event.target.value)
                          }
                          placeholder="Jane"
                          autoComplete="given-name"
                          disabled={inviteSubmitting}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label
                          htmlFor="invite-last-name"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                          Last Name
                        </Label>
                        <Input
                          id="invite-last-name"
                          value={inviteForm.lastName}
                          onChange={(event) =>
                            handleInviteInputChange("lastName", event.target.value)
                          }
                          placeholder="Doe"
                          autoComplete="family-name"
                          disabled={inviteSubmitting}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label
                          htmlFor="invite-email"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                          Email
                        </Label>
                        <Input
                          id="invite-email"
                          type="email"
                          value={inviteForm.email}
                          onChange={(event) =>
                            handleInviteInputChange("email", event.target.value)
                          }
                          placeholder="jane.doe@example.com"
                          autoComplete="email"
                          disabled={inviteSubmitting}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label
                          htmlFor="invite-phone"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                          Phone Number
                        </Label>
                        <Input
                          id="invite-phone"
                          type="tel"
                          value={inviteForm.phoneNumber}
                          onChange={(event) =>
                            handleInviteInputChange("phoneNumber", event.target.value)
                          }
                          placeholder="+1234567890"
                          autoComplete="tel"
                          disabled={inviteSubmitting}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label
                        htmlFor="invite-organization"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Subtext
                              : tokens.Light.Typography.Subtext
                          ),
                        }}
                      >
                        Organization
                      </Label>
                      <Input
                        id="invite-organization"
                        value={inviteForm.organization}
                        onChange={(event) =>
                          handleInviteInputChange("organization", event.target.value)
                        }
                        placeholder="CodeHealth Labs"
                        autoComplete="organization"
                        disabled={inviteSubmitting}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label
                        htmlFor="invite-role"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Subtext
                              : tokens.Light.Typography.Subtext
                          ),
                        }}
                      >
                        Role
                      </Label>
                      <Select
                        value={inviteForm.roleId || undefined}
                        onValueChange={(value) => handleInviteInputChange("roleId", value)}
                        disabled={rolesLoading || inviteSubmitting}
                      >
                        <SelectTrigger
                          id="invite-role"
                          className="h-10"
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
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                          <SelectValue
                            placeholder={
                              rolesLoading ? "Loading roles..." : "Select a role"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.length > 0 ? (
                            roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name || "Unnamed Role"}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-role" disabled>
                              {rolesLoading
                                ? "Loading roles..."
                                : "No roles available"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div
                      className="text-xs leading-relaxed"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Subtext
                            : tokens.Light.Typography.Subtext
                        ),
                      }}
                    >
                      The selected role determines the plan and permissions the account
                      receives after accepting the invitation.
                    </div>
                    <DialogFooter className="gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setInviteDialogOpen(false)}
                        disabled={inviteSubmitting}
                        style={{
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
                      <Button
                        type="submit"
                        disabled={inviteSubmitting}
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
                        {inviteSubmitting ? "Sending..." : "Send Invite"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
          </div>
        </div>

        {/* Accounts Table */}
        <div
          className="rounded-2xl p-6"
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
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-lg font-semibold"
              style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Heading
                    : tokens.Light.Typography.Heading
                ),
              }}
            >
              Registered Accounts
            </h2>
            <div className="flex items-center gap-3">
              <span
                className="text-sm"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                }}
              >
                {loading ? "Loading..." : `${totalItems} total accounts`}
              </span>
            
            </div>
          </div>

          {/* Responsive Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className="border-b"
                  style={{
                    borderColor: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Stroke["Stroke-02"]
                        : tokens.Light.Stroke["Stroke-02"]
                    ),
                  }}
                >
                  <th
                    className="text-left py-3 px-4 font-medium"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    Email
                  </th>
                  <th
                    className="text-left py-3 px-4 font-medium"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    Phone
                  </th>
                  <th
                    className="text-left py-3 px-4 font-medium"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    Location
                  </th>
                  <th
                    className="text-left py-3 px-4 font-medium"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    Registered
                  </th>
                  <th
                    className="text-left py-3 px-4 font-medium"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading 
                      ),
                    }}
                  >
                    Plan
                  </th>
                  <th
                    className="text-left py-3 px-4 font-medium"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    Status
                  </th>
                  <th
                    className="text-right py-3 px-4 font-medium"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center">
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
                        Loading accounts...
                      </div>
                    </td>
                  </tr>
                ) : (
                  accounts.map((account) => (
                  <tr
                    key={account.id}
                    className="border-b hover:bg-opacity-50 transition-colors"
                    style={{
                      borderColor: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Stroke["Stroke-02"]
                          : tokens.Light.Stroke["Stroke-02"]
                      ),
                      backgroundColor: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Surface.Foreground
                          : tokens.Light.Surface.Foreground
                      ),
                    }}
                  >
                    <td className="py-4 px-4">
                      <span
                        className="text-sm"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Subtext
                              : tokens.Light.Typography.Subtext
                          ),
                        }}
                      >
                        {account.email}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className="text-sm"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                        {account.phone}
                      </span>
                    </td>
                    <td className="py-4 px-4">
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
                        {account.location}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className="text-sm"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Subtext
                              : tokens.Light.Typography.Subtext
                          ),
                        }}
                      >
                        {new Date(account.registeredDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        variant="secondary"
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
                        {account.plan}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(account.status)}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/dashboard/accounts/detail/${account.id}`)}
                          className="h-8 w-8 p-0 border-none"
                          style={{
                            background: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Button.Secondary
                                : tokens.Light.Button.Secondary
                            ),
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Button["Secondary Text"]
                                : tokens.Light.Button["Secondary Text"]
                            ),
                          }}
                        >
                          <Eye size={14} /> 
                        </Button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {!loading && accounts.length === 0 && (
            <div className="text-center py-12">
              <div
                className="text-lg font-medium mb-2"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                No accounts found
              </div>
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
                No registered accounts to display
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {accounts.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Subtext
                          : tokens.Light.Typography.Subtext
                      ),
                    }}
                  >
                    Rows per page:
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      handleItemsPerPageChange(Number(e.target.value));
                    }}
                    className="px-2 py-1 border rounded text-sm"
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
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
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
                  Showing {loading ? 0 : (currentPage - 1) * itemsPerPage + 1} to {loading ? 0 : Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                  style={{
                    background: currentPage === 1 
                      ? resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Button["Primary Disabled"]
                            : tokens.Light.Button["Primary Disabled"]
                        )
                      : undefined,
                    color: currentPage === 1 
                      ? resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Button["Primary Disabled Text"]
                            : tokens.Light.Button["Primary Disabled Text"]
                        )
                      : undefined,
                  }}
                >
                  <ChevronsLeft size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                  style={{
                    background: currentPage === 1 
                      ? resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Button["Primary Disabled"]
                            : tokens.Light.Button["Primary Disabled"]
                        )
                      : undefined,
                    color: currentPage === 1 
                      ? resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Button["Primary Disabled Text"]
                            : tokens.Light.Button["Primary Disabled Text"]
                        )
                      : undefined,
                  }}
                >
                  <ChevronLeft size={16} />
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNum)}
                        className="h-8 w-8 p-0"
                        style={{
                          background: currentPage === pageNum 
                            ? resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Button.Primary
                                  : tokens.Light.Button.Primary
                              )
                            : undefined,
                          color: currentPage === pageNum 
                            ? resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Button["Primary Text"]
                                  : tokens.Light.Button["Primary Text"]
                              )
                            : undefined,
                        }}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                  style={{
                    background: currentPage === totalPages 
                      ? resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Button["Primary Disabled"]
                            : tokens.Light.Button["Primary Disabled"]
                        )
                      : undefined,
                    color: currentPage === totalPages 
                      ? resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Button["Primary Disabled Text"]
                            : tokens.Light.Button["Primary Disabled Text"]
                        )
                      : undefined,
                  }}
                >
                  <ChevronRight size={16} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                  style={{
                    background: currentPage === totalPages 
                      ? resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Button["Primary Disabled"]
                            : tokens.Light.Button["Primary Disabled"]
                        )
                      : undefined,
                    color: currentPage === totalPages 
                      ? resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Button["Primary Disabled Text"]
                            : tokens.Light.Button["Primary Disabled Text"]
                        )
                      : undefined,
                  }}
                >
                  <ChevronsRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DiscountManagement;
