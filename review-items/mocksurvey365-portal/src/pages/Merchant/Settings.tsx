import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/FormSelect";
import { resolveToken } from "@/utils/resolveToken";
import { getTheme } from "@/styles/getTheme"; // Fixed import
import { tokens } from "@/styles/theme";
import { toast } from "sonner";

interface Settings {
  // General Settings
  currency: string;
  timezone: string;
  language: string;
  dateFormat: string;
  
  // Email Settings
  emailNotifications: boolean;
  marketingEmails: boolean;
  systemAlerts: boolean;
  weeklyReports: boolean;
  
  // Security Settings
  twoFactorAuth: boolean;
  sessionTimeout: number;
  loginNotifications: boolean;
  
  // Business Settings
  businessHours: {
    start: string;
    end: string;
  };
  autoApproveDiscounts: boolean;
  maxDiscountValue: number;
  
  // Display Settings
  theme: "light" | "dark" | "auto";
  dashboardLayout: "compact" | "comfortable";
  showTutorials: boolean;
}

const Settings = () => {
  const theme = getTheme();
  const [settings, setSettings] = useState<Settings>({
    currency: "GHS",
    timezone: "Africa/Accra",
    language: "en",
    dateFormat: "DD/MM/YYYY",
    emailNotifications: true,
    marketingEmails: false,
    systemAlerts: true,
    weeklyReports: true,
    twoFactorAuth: false,
    sessionTimeout: 30,
    loginNotifications: true,
    businessHours: {
      start: "09:00",
      end: "17:00",
    },
    autoApproveDiscounts: false,
    maxDiscountValue: 50,
    theme: "auto",
    dashboardLayout: "comfortable",
    showTutorials: true,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState<"general" | "email" | "security" | "business" | "display">("general");

  const currencies = [
    { value: "GHS", label: "Ghana Cedi (GHS)" },
    { value: "USD", label: "US Dollar (USD)" },
    { value: "EUR", label: "Euro (EUR)" },
    { value: "GBP", label: "British Pound (GBP)" },
  ];

  const timezones = [
    { value: "Africa/Accra", label: "GMT (Accra)" },
    { value: "Africa/Lagos", label: "WAT (Lagos)" },
    { value: "Europe/London", label: "GMT (London)" },
    { value: "America/New_York", label: "EST (New York)" },
  ];

  const languages = [
    { value: "en", label: "English" },
    { value: "fr", label: "Français" },
    { value: "es", label: "Español" },
  ];

  const dateFormats = [
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
  ];

  const themes = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "auto", label: "Auto (System)" },
  ];

  const dashboardLayouts = [
    { value: "compact", label: "Compact" },
    { value: "comfortable", label: "Comfortable" },
  ];

  const sessionTimeouts = [
    { value: "15", label: "15 minutes" },
    { value: "30", label: "30 minutes" },
    { value: "60", label: "1 hour" },
    { value: "120", label: "2 hours" },
  ];

  const handleSave = () => {
    // Here you would typically save to backend
    setIsEditing(false);
    toast.success("Settings saved successfully");
  };

  const handleReset = () => {
    // Reset to default settings
    setSettings({
      currency: "GHS",
      timezone: "Africa/Accra",
      language: "en",
      dateFormat: "DD/MM/YYYY",
      emailNotifications: true,
      marketingEmails: false,
      systemAlerts: true,
      weeklyReports: true,
      twoFactorAuth: false,
      sessionTimeout: 30,
      loginNotifications: true,
      businessHours: {
        start: "09:00",
        end: "17:00",
      },
      autoApproveDiscounts: false,
      maxDiscountValue: 50,
      theme: "auto",
      dashboardLayout: "comfortable",
      showTutorials: true,
    });
    toast.success("Settings reset to defaults");
  };

  const sections = [
    { key: "general", label: "General", icon: "⚙️" },
    { key: "email", label: "Email", icon: "📧" },
    { key: "security", label: "Security", icon: "🔒" },
    { key: "business", label: "Business", icon: "🏢" },
    { key: "display", label: "Display", icon: "🎨" },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              color: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Typography.Heading
                  : tokens.Light.Typography.Heading
              ),
            }}
          >
            Settings
          </h1>
          <p
            className="text-lg"
            style={{
              color: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Typography.Subtext
                  : tokens.Light.Typography.Subtext
              ),
            }}
          >
            Customize your merchant account preferences and configuration
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div
              className="rounded-2xl p-4 sticky top-6"
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
              <div className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.key}
                    onClick={() => setActiveSection(section.key as any)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                      activeSection === section.key ? "font-medium" : ""
                    }`}
                    style={{
                      background: activeSection === section.key ? resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Highlight["HIghhlight Gray"][100]
                          : tokens.Light.Highlight["HIghhlight Gray"][100]
                      ) : "transparent",
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    <span className="mr-3">{section.icon}</span>
                    {section.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
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
              {/* Section Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2
                    className="text-xl font-semibold"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    {sections.find(s => s.key === activeSection)?.icon} {sections.find(s => s.key === activeSection)?.label} Settings
                  </h2>
                  <p
                    className="text-sm mt-1"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Subtext
                          : tokens.Light.Typography.Subtext
                      ),
                    }}
                  >
                    {activeSection === "general" && "Configure your general preferences and regional settings"}
                    {activeSection === "email" && "Manage your email notification preferences"}
                    {activeSection === "security" && "Configure security settings and authentication"}
                    {activeSection === "business" && "Set up business-specific preferences and rules"}
                    {activeSection === "display" && "Customize your interface and display options"}
                  </p>
                </div>
                <div className="flex gap-3">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
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
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Settings
                    </Button>
                  )}
                </div>
              </div>

              {/* Settings Content */}
              <div className="space-y-6">
                {activeSection === "general" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          Currency
                        </label>
                        {isEditing ? (
                          <FormSelect
                            required={false}
                            optional={false}
                            id="currency"
                            name="currency"
                            label=""
                            value={settings.currency}
                            onChange={(value) => setSettings({ ...settings, currency: value })}
                            placeholder="Select currency"
                            error=""
                            options={currencies}
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
                            {currencies.find(c => c.value === settings.currency)?.label || "Not set"}
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
                          Timezone
                        </label>
                        {isEditing ? (
                          <FormSelect
                            required={false}
                            optional={false}
                            id="timezone"
                            name="timezone"
                            label=""
                            value={settings.timezone}
                            onChange={(value) => setSettings({ ...settings, timezone: value })}
                            placeholder="Select timezone"
                            error=""
                            options={timezones}
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
                            {timezones.find(t => t.value === settings.timezone)?.label || "Not set"}
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
                          Language
                        </label>
                        {isEditing ? (
                          <FormSelect
                            required={false}
                            optional={false}
                            id="language"
                            name="language"
                            label=""
                            value={settings.language}
                            onChange={(value) => setSettings({ ...settings, language: value })}
                            placeholder="Select language"
                            error=""
                            options={languages}
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
                            {languages.find(l => l.value === settings.language)?.label || "Not set"}
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
                          Date Format
                        </label>
                        {isEditing ? (
                          <FormSelect
                            required={false}
                            optional={false}
                            id="dateFormat"
                            name="dateFormat"
                            label=""
                            value={settings.dateFormat}
                            onChange={(value) => setSettings({ ...settings, dateFormat: value })}
                            placeholder="Select date format"
                            error=""
                            options={dateFormats}
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
                            {settings.dateFormat}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "email" && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {[
                        { key: "emailNotifications", label: "Email Notifications", description: "Receive important updates via email" },
                        { key: "marketingEmails", label: "Marketing Emails", description: "Receive promotional content and tips" },
                        { key: "systemAlerts", label: "System Alerts", description: "Get notified about system maintenance and updates" },
                        { key: "weeklyReports", label: "Weekly Reports", description: "Receive weekly performance summaries" },
                      ].map((setting) => (
                        <div key={setting.key} className="flex items-center justify-between p-4 rounded-lg border" style={{
                          borderColor: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Stroke["Stroke-02"]
                              : tokens.Light.Stroke["Stroke-02"]
                          ),
                        }}>
                          <div>
                            <h3
                              className="font-medium"
                              style={{
                                color: resolveToken(
                                  theme === "dark"
                                    ? tokens.Dark.Typography.Heading
                                    : tokens.Light.Typography.Heading
                                ),
                              }}
                            >
                              {setting.label}
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
                              {setting.description}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings[setting.key as keyof Settings] as boolean}
                              onChange={(e) => setSettings({ ...settings, [setting.key]: e.target.checked })}
                              disabled={!isEditing}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === "security" && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg border" style={{
                        borderColor: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Stroke["Stroke-02"]
                            : tokens.Light.Stroke["Stroke-02"]
                        ),
                      }}>
                        <div>
                          <h3
                            className="font-medium"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Two-Factor Authentication
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
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.twoFactorAuth}
                            onChange={(e) => setSettings({ ...settings, twoFactorAuth: e.target.checked })}
                            disabled={!isEditing}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
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
                          Session Timeout
                        </label>
                        {isEditing ? (
                          <FormSelect
                            required={false}
                            optional={false}
                            id="sessionTimeout"
                            name="sessionTimeout"
                            label=""
                            value={settings.sessionTimeout.toString()}
                            onChange={(value) => setSettings({ ...settings, sessionTimeout: Number(value) })}
                            placeholder="Select timeout duration"
                            error=""
                            options={sessionTimeouts}
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
                            {sessionTimeouts.find(s => s.value === settings.sessionTimeout.toString())?.label || "Not set"}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-lg border" style={{
                        borderColor: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Stroke["Stroke-02"]
                            : tokens.Light.Stroke["Stroke-02"]
                        ),
                      }}>
                        <div>
                          <h3
                            className="font-medium"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Login Notifications
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
                            Get notified when someone logs into your account
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.loginNotifications}
                            onChange={(e) => setSettings({ ...settings, loginNotifications: e.target.checked })}
                            disabled={!isEditing}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "business" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          Business Hours Start
                        </label>
                        {isEditing ? (
                          <Input
                            type="time"
                            value={settings.businessHours.start}
                            onChange={(e) => setSettings({ 
                              ...settings, 
                              businessHours: { ...settings.businessHours, start: e.target.value }
                            })}
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
                            {settings.businessHours.start}
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
                          Business Hours End
                        </label>
                        {isEditing ? (
                          <Input
                            type="time"
                            value={settings.businessHours.end}
                            onChange={(e) => setSettings({ 
                              ...settings, 
                              businessHours: { ...settings.businessHours, end: e.target.value }
                            })}
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
                            {settings.businessHours.end}
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
                          Maximum Discount Value (%)
                        </label>
                        {isEditing ? (
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            value={settings.maxDiscountValue}
                            onChange={(e) => setSettings({ ...settings, maxDiscountValue: Number(e.target.value) })}
                            placeholder="Enter maximum discount percentage"
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
                            {settings.maxDiscountValue}%
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border" style={{
                      borderColor: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Stroke["Stroke-02"]
                          : tokens.Light.Stroke["Stroke-02"]
                      ),
                    }}>
                      <div>
                        <h3
                          className="font-medium"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          Auto-Approve Discounts
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
                          Automatically approve discounts that meet your criteria
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.autoApproveDiscounts}
                          onChange={(e) => setSettings({ ...settings, autoApproveDiscounts: e.target.checked })}
                          disabled={!isEditing}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                )}

                {activeSection === "display" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          Theme
                        </label>
                        {isEditing ? (
                          <FormSelect
                            required={false}
                            optional={false}
                            id="theme"
                            name="theme"
                            label=""
                            value={settings.theme}
                            onChange={(value) => setSettings({ ...settings, theme: value as any })}
                            placeholder="Select theme"
                            error=""
                            options={themes}
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
                            {themes.find(t => t.value === settings.theme)?.label || "Not set"}
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
                          Dashboard Layout
                        </label>
                        {isEditing ? (
                          <FormSelect
                            required={false}
                            optional={false}
                            id="dashboardLayout"
                            name="dashboardLayout"
                            label=""
                            value={settings.dashboardLayout}
                            onChange={(value) => setSettings({ ...settings, dashboardLayout: value as any })}
                            placeholder="Select layout"
                            error=""
                            options={dashboardLayouts}
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
                            {dashboardLayouts.find(l => l.value === settings.dashboardLayout)?.label || "Not set"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border" style={{
                      borderColor: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Stroke["Stroke-02"]
                          : tokens.Light.Stroke["Stroke-02"]
                      ),
                    }}>
                      <div>
                        <h3
                          className="font-medium"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          Show Tutorials
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
                          Display helpful tips and tutorials throughout the interface
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.showTutorials}
                          onChange={(e) => setSettings({ ...settings, showTutorials: e.target.checked })}
                          disabled={!isEditing}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Reset Button */}
              <div className="mt-8 pt-6 border-t" style={{
                borderColor: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Stroke["Stroke-02"]
                    : tokens.Light.Stroke["Stroke-02"]
                ),
              }}>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  style={{
                    borderColor: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Highlight["Highlight Red"][500]
                        : tokens.Light.Highlight["Highlight Red"][500]
                    ),
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Highlight["Highlight Red"][500]
                        : tokens.Light.Highlight["Highlight Red"][500]
                    ),
                  }}
                >
                  Reset to Defaults
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
