import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/FormSelect";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { resolveToken } from "@/utils/resolveToken";
import { tokens } from "@/styles/theme";
import { getTheme } from "@/styles/getTheme";
import { toast } from "sonner";
import { getProfile, updateProfile } from "@/api/services/userProfile";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  phoneNumber: string;
}

interface UserAccess {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  lastActive: string;
  isActive: boolean;
}


const AccountManagement = () => {
  const theme = getTheme();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    email: "",
    organization: "",
    phoneNumber: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [userAccess, setUserAccess] = useState<UserAccess[]>([]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const profileData = await getProfile();
        setProfile({
          firstName: profileData.firstName || "",
          lastName: profileData.lastName || "",
          email: profileData.email || "",
          organization: profileData.organization || "",
          phoneNumber: profileData.phoneNumber || "",
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile", {
          description: "Please try again later",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    setUserAccess([
      {
        id: "1",
        name: "John Doe",
        email: "john@campusbites.com",
        role: "admin",
        permissions: ["manage_discounts", "view_analytics", "manage_users"],
        lastActive: "2024-01-15",
        isActive: true,
      },
      {
        id: "2",
        name: "Jane Smith",
        email: "jane@campusbites.com",
        role: "manager",
        permissions: ["manage_discounts", "view_analytics"],
        lastActive: "2024-01-14",
        isActive: true,
      },
      {
        id: "3",
        name: "Mike Johnson",
        email: "mike@campusbites.com",
        role: "staff",
        permissions: ["view_analytics"],
        lastActive: "2024-01-10",
        isActive: false,
      },
    ]);
  }, []);

  const handleSaveProfile = async () => {
    if (
      !profile.firstName ||
      !profile.lastName ||
      !profile.organization ||
      !profile.phoneNumber
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        organization: profile.organization,
        phoneNumber: profile.phoneNumber,
      });
      setIsEditingProfile(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile", {
        description: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  };



  const handleToggleUserAccess = (id: string) => {
    setUserAccess(
      userAccess.map((user) =>
        user.id === id ? { ...user, isActive: !user.isActive } : user
      )
    );
  };

  const handleUpdateUserRole = (id: string, newRole: string) => {
    setUserAccess(
      userAccess.map((user) =>
        user.id === id ? { ...user, role: newRole } : user
      )
    );
    toast.success("User role updated successfully");
  };


  const roles = [
    { value: "admin", label: "Administrator" },
    { value: "manager", label: "Manager" },
    { value: "analyst", label: "Analyst" },
    { value: "staff", label: "Staff" },
    { value: "viewer", label: "Viewer" },
  ];

  const handleRemoveUser = (id: string) => {
    setUserAccess(userAccess.filter((user) => user.id !== id));
    toast.success("User removed successfully");
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
                Account
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
                Manage your profile information and team permissions
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
         
          <Tabs defaultValue="profile" className="w-auto">
            <TabsList
              className="grid grid-cols-2 gap-1 p-1 w-fit"
              style={{
                background: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Highlight["HIghhlight Gray"][50]
                    : tokens.Light.Highlight["HIghhlight Gray"][50]
                ),
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark["text/soft-400"]
                    : tokens.Light["text/soft-400"]
                ),
                borderRadius: "6px",
                padding: "4px",
              }}
            >
              <TabsTrigger value="profile" className="tabs-trigger rounded-md">
                Profile
              </TabsTrigger>
              <TabsTrigger value="users" className="tabs-trigger rounded-lg">
                User Access
              </TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <TabsContent value="profile">
              <div
                className="rounded-2xl p-6"
                style={{
                  background: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Surface.Foreground
                      : tokens.Light.Surface.Foreground
                  ),
                  borderRadius: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Radius["Radius-lg"]
                      : tokens.Light.Radius["Radius-lg"]
                  ),
                }}
              >
                <div className="flex items-center justify-between mb-6">
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
                    Profile Information
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    disabled={isLoading}
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
                    {isEditingProfile ? "Cancel" : "Edit"}
                        </Button>
                      </div>

                {isLoading && !profile.firstName ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className="text-sm font-medium mb-2 block"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          First Name *
                        </label>
                        {isEditingProfile ? (
                          <Input
                            type="text"
                            value={profile.firstName}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                firstName: e.target.value,
                              })
                            }
                            style={{
                              background: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Surface.Primary
                                  : tokens.Light.Surface.Primary
                              ),
                            }}
                            placeholder="Enter first name"
                          />
                        ) : (
                          <p
                            className="text-sm py-2"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Subtext
                                  : tokens.Light.Typography.Subtext
                              ),
                            }}
                          >
                            {profile.firstName || "Not provided"}
                          </p>
                        )}
                    </div>

                      <div>
                        <label
                          className="text-sm font-medium mb-2 block"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          Last Name *
                        </label>
                        {isEditingProfile ? (
                          <Input
                            type="text"
                            value={profile.lastName}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                lastName: e.target.value,
                              })
                            }
                          style={{
                            background: resolveToken(
                              theme === "dark"
                                  ? tokens.Dark.Surface.Primary
                                  : tokens.Light.Surface.Primary
                              ),
                            }}
                            placeholder="Enter last name"
                        />
                      ) : (
                        <p
                          className="text-sm py-2"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                            {profile.lastName || "Not provided"}
                        </p>
                      )}
                    </div>
                  </div>

                    <div>
                      <label
                        className="text-sm font-medium mb-2 block"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      >
                        Email Address
                      </label>
                        <p
                          className="text-sm py-2"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Subtext
                                : tokens.Light.Typography.Subtext
                            ),
                          }}
                        >
                        {profile.email || "Not provided"}
                        </p>
                    </div>

                      <div>
                        <label
                          className="text-sm font-medium mb-2 block"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                        Organization *
                        </label>
                      {isEditingProfile ? (
                          <Input
                          type="text"
                          value={profile.organization}
                            onChange={(e) =>
                            setProfile({
                              ...profile,
                              organization: e.target.value,
                            })
                          }
                            style={{
                            background: resolveToken(
                                theme === "dark"
                                ? tokens.Dark.Surface.Primary
                                : tokens.Light.Surface.Primary
                            ),
                          }}
                          placeholder="Enter organization name"
                          />
                        ) : (
                          <p
                            className="text-sm py-2"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Subtext
                                  : tokens.Light.Typography.Subtext
                              ),
                            }}
                          >
                          {profile.organization || "Not provided"}
                          </p>
                        )}
                    </div>

                      <div>
                        <label
                          className="text-sm font-medium mb-2 block"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                        Phone Number *
                        </label>
                      {isEditingProfile ? (
                          <Input
                          type="tel"
                          value={profile.phoneNumber}
                            onChange={(e) =>
                            setProfile({
                              ...profile,
                              phoneNumber: e.target.value,
                            })
                          }
                            style={{
                            background: resolveToken(
                                theme === "dark"
                                ? tokens.Dark.Surface.Primary
                                : tokens.Light.Surface.Primary
                            ),
                          }}
                          placeholder="Enter phone number (e.g. +1234567890 or 1234567890)"
                          />
                        ) : (
                          <p
                            className="text-sm py-2"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Subtext
                                  : tokens.Light.Typography.Subtext
                              ),
                            }}
                          >
                          {profile.phoneNumber || "Not provided"}
                          </p>
                        )}
                    </div>

                    {isEditingProfile && (
                      <div className="flex justify-end items-center pt-4">
                        <div className="flex gap-3">
                      <Button
                            onClick={handleSaveProfile}
                            disabled={isLoading}
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
                            {isLoading ? "Saving..." : "Save Changes"}
                      </Button>
                        </div>
                    </div>
                  )}
                </div>
                )}
              </div>
            </TabsContent>

            

            <TabsContent value="users">
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
                    User Access Management
                  </h2>
                  <Button
                    onClick={() => navigate("/dashboard/merchant/add-user")}
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
                    Add User
                  </Button>
                </div>

                <div
                  className="overflow-hidden rounded-2xl border"
                  style={{
                    borderColor: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Stroke["Stroke-02"]
                        : tokens.Light.Stroke["Stroke-02"]
                    ),
                    borderRadius: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Radius["Radius-lg"]
                        : tokens.Light.Radius["Radius-lg"]
                    ),
                  }}
                >
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
                            background: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Surface.Foreground
                                : tokens.Light.Surface.Foreground
                            ),
                          }}
                        >
                          <th
                            className="text-left py-4 px-6 font-semibold text-sm"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            User
                          </th>
                          <th
                            className="text-left py-4 px-6 font-semibold text-sm"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Role
                          </th>
                          <th
                            className="text-left py-4 px-6 font-semibold text-sm"
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
                            className="text-left py-4 px-6 font-semibold text-sm"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Last Active
                          </th>
                          <th
                            className="text-left py-4 px-6 font-semibold text-sm"
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
                        {userAccess.map((user, index) => (
                          <tr
                            key={user.id}
                            className={`border-b transition-colors hover:bg-opacity-50 ${
                              index % 2 === 0 ? "bg-opacity-0" : "bg-opacity-5"
                            }`}
                            style={{
                              borderColor: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Stroke["Stroke-02"]
                                  : tokens.Light.Stroke["Stroke-02"]
                              ),
                              background:
                                index % 2 === 0
                                  ? "transparent"
                                  : resolveToken(
                                      theme === "dark"
                                        ? tokens.Dark.Highlight[
                                            "HIghhlight Gray"
                                          ][50]
                                        : tokens.Light.Highlight[
                                            "HIghhlight Gray"
                                          ][50]
                                    ),
                            }}
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center"
                                  style={{
                                    background: resolveToken(
                                      theme === "dark"
                                        ? tokens.Dark.Highlight[
                                            "HIghhlight Gray"
                                          ][100]
                                        : tokens.Light.Highlight[
                                            "HIghhlight Gray"
                                          ][100]
                                    ),
                                  }}
                                >
                                  <span
                                    className="text-sm font-semibold"
                                    style={{
                                      color: resolveToken(
                                        theme === "dark"
                                          ? tokens.Dark.Typography.Heading
                                          : tokens.Light.Typography.Heading
                                      ),
                                    }}
                                  >
                                    {user.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p
                                    className="font-semibold text-sm"
                                    style={{
                                      color: resolveToken(
                                        theme === "dark"
                                          ? tokens.Dark.Typography.Heading
                                          : tokens.Light.Typography.Heading
                                      ),
                                    }}
                                  >
                                    {user.name}
                                  </p>
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
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <FormSelect
                                required={false}
                                optional={false}
                                id={`role-${user.id}`}
                                name={`role-${user.id}`}
                                label=""
                                value={user.role}
                                onChange={(value) =>
                                  handleUpdateUserRole(user.id, value)
                                }
                                placeholder="Select role"
                                error=""
                                options={roles}
                              />
                            </td>
                            <td className="py-4 px-6">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleUserAccess(user.id)}
                                className="px-3 py-1 text-xs font-medium"
                                style={{
                                  borderColor: resolveToken(
                                    theme === "dark"
                                      ? tokens.Dark.Stroke["Stroke-02"]
                                      : tokens.Light.Stroke["Stroke-02"]
                                  ),
                                  color: resolveToken(
                                    theme === "dark"
                                      ? tokens.Dark["text/soft-400"]
                                      : tokens.Light["text/soft-400"]
                                  ),
                                  background: resolveToken(
                                    theme === "dark"
                                      ? tokens.Dark["text/soft-400"]
                                      : tokens.Light["text/soft-400"]
                                  ),
                                }}
                              >
                                {user.isActive ? "Active" : "Inactive"}
                              </Button>
                            </td>
                            <td className="py-4 px-6">
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
                                {new Date(user.lastActive).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="py-4 px-6">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveUser(user.id)}
                                className="px-3 py-1 text-xs font-medium"
                                style={{
                                  borderColor: resolveToken(
                                    theme === "dark"
                                      ? tokens.Dark.Highlight[
                                          "Highlight Red"
                                        ][500]
                                      : tokens.Light.Highlight[
                                          "Highlight Red"
                                        ][500]
                                  ),
                                  color: resolveToken(
                                    theme === "dark"
                                      ? tokens.Dark.Highlight[
                                          "Highlight Red"
                                        ][500]
                                      : tokens.Light.Highlight[
                                          "Highlight Red"
                                        ][500]
                                  ),
                                  background: "transparent",
                                }}
                              >
                                Remove
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>

            

            
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AccountManagement;
