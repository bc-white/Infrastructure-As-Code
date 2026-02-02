import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { logout as apiLogout } from "../../service/api";
import api from "../../service/api";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "../ui/alert-dialog";
import {
  Home,
  BarChart3,
  Layers,
  CheckSquare,
  LogOut,
  X,
  PanelLeftClose,
  PanelLeft,
  Tag,
  Crown,
  Settings,
  Users,
  FileText,
  Building2,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Briefcase,
  User
} from "lucide-react";
import useSubscription from "../../hooks/useSubscription";

const Sidebar = ({
  navigation,
  adminNavigation,
  user,
  handleLogout,
  onClose,
  isMobile = false,
  collapsed = false,
  onToggleCollapse,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentPlan, isOnTrial, daysUntilExpiry } = useSubscription();

  // Support modal state
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [supportFormData, setSupportFormData] = useState({
    subject: "",
    message: "",
  });

  // Dropdown menu state
  const [openDropdowns, setOpenDropdowns] = useState({});

  const toggleDropdown = (name) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();

    if (!supportFormData.subject.trim() || !supportFormData.message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsSending(true);

      const emailData = {
        to: "staff@theinspac.com",
        subject: `Support Request: ${supportFormData.subject}`,
        message: supportFormData.message,
        fileUrl: "",
      };

      await api.survey.requestEmail(emailData);

      toast.success("Your message has been sent to our support team!");
      setSupportFormData({ subject: "", message: "" });
      setIsSupportOpen(false);
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSupportInputChange = (field, value) => {
    setSupportFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSidebarLogout = () => {
    handleLogout(); // This will update the context
    apiLogout(); // This will handle the redirect and storage cleanup
  };

  // Helper function to determine if user is an invited user
  const isInvitedUser = () => {
    if (!user) return false;
    // Check if user has the invited flag set to "true" (string) or true (boolean)
    return user.invited === "true" || user.invited === true;
  };

  // Navigation items - conditionally visible based on user type
  const navigationItems = [
    {
      name: "Home",
      href: "/dashboard",
      icon: Home,
      show: true,
    },
    {
      name: "Surveys",
      icon: Briefcase,
      show: true,
      isDropdown: true,
      children: [
        {
          name: "Surveys",
          href: "/surveys",
          icon: BarChart3,
          show: true,
        },
        {
          name: "Risk Based Process",
          href: "/risk-based-list",
          icon: Building2,
          show: true,
        },
        {
          name: "Plan of Correction",
          href: "/plan-of-correction",
          icon: FileText,
          show: true,
        },
      ],
    },
    {
      name: "Resources",
      icon: CheckSquare,
      show: true,
      isDropdown: true,
      children: [
        {
          name: "Resources Center",
          href: "/resource-center",
          icon: CheckSquare,
          show: true,
        },
        {
          name: "F-Tag Library",
          href: "/f-tag-library",
          icon: Tag,
          show: true,
        },
      ],
    },
    {
      name: "Facilities",
      icon: Building2,
      show: true,
      isDropdown: true,
      children: [
        {
          name: "My Facilities",
          href: "/facilities",
          icon: Users,
          show: true,
        },
        {
          name: "Multi-Facility",
          href: "/multi-facility",
          icon: Building2,
          show: true,
        },
      ],
    },
    {
      name: "Reports",
      href: "/reports",
      icon: Layers,
      show: true,
    },
  ];

  // Admin-only items
  const adminItems = [
    // User Management moved to main navigation for all users
  ];

  // Account management items - now as a dropdown
  const accountItems = [
    {
      name: "Account",
      icon: User,
      show: true,
      isDropdown: true,
      children: [
        {
          name: "Users",
          href: "/user-management",
          icon: Users,
          show: true,
        },
        {
          name: "Settings",
          href: "/profile",
          icon: Settings,
          show: true,
        },
      ],
    },
  ];

  const handleNavigation = (href) => {
    navigate(href);
    // Close mobile sidebar after navigation
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <div
      className={`bg-[#065B7D] flex flex-col h-full transition-all duration-300 ease-in-out ${
        collapsed && !isMobile ? "w-16" : "w-64"
      }`}
    >
      {/* Mobile Close Button */}
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden flex-shrink-0">
          <div className="flex items-center">
            <img src="/logo.png" alt="Survey365" className="h-12 w-auto" />
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-md p-1"
            onClick={onClose}
          >
            <span className="sr-only">Close sidebar</span>
            <X className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Desktop Header with Logo and Toggle */}
      {!isMobile && (
        <div
          className={`transition-all duration-300 ease-in-out flex-shrink-0 ${
            collapsed ? "p-2" : "p-4 sm:p-6"
          }`}
        >
          <div className="flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center">
                <img
                  src="/logo.png"
                  alt="Survey365"
                  className="h-12 sm:h-18 w-auto max-w-full"
                />
              </div>
            )}
            <button
              onClick={onToggleCollapse}
              className={`p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer ${
                collapsed ? "mx-auto" : ""
              }`}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeft className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Navigation Content */}
      <div
        className={`flex-1 flex flex-col overflow-y-auto min-h-0 transition-all duration-300 ease-in-out [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
          collapsed && !isMobile ? "px-2" : "px-4 sm:px-6"
        }`}
      >
        {/* Main Navigation */}
        <nav className="space-y-1 sm:space-y-2 mb-6">
          {navigationItems
            .filter(item => item.show)
            .map((item) => {
              const IconComponent = item.icon;
              
              // Check if this item or any of its children is active
              const isActive = item.href 
                ? (location.pathname === item.href || (item.href === "/dashboard" && location.pathname === "/"))
                : false;
              
              const hasActiveChild = item.children?.some(
                (child) => location.pathname === child.href
              );

              // If it's a dropdown item
              if (item.isDropdown) {
                // Only use manual toggle state, no auto-open
                const isOpen = openDropdowns[item.name] || false;
                
                return (
                  <div key={item.name}>
                    {/* Dropdown trigger */}
                    <button
                      onClick={() => (!collapsed || isMobile) && toggleDropdown(item.name)}
                      className={`w-full flex items-center justify-between transition-colors cursor-pointer rounded-lg ${
                        collapsed && !isMobile
                          ? "justify-center p-3"
                          : "px-2 sm:px-3 py-2 sm:py-2.5"
                      } ${
                        hasActiveChild
                          ? "bg-[#47C2FF]/20 text-white"
                          : "text-white hover:bg-white/10"
                      }`}
                      title={collapsed && !isMobile ? item.name : undefined}
                    >
                      <div className="flex items-center">
                        <IconComponent
                          className={`flex-shrink-0 ${
                            collapsed && !isMobile
                              ? "h-5 w-5"
                              : "h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3"
                          }`}
                        />
                        {(!collapsed || isMobile) && (
                          <span className="truncate text-sm sm:text-base font-medium">
                            {item.name}
                          </span>
                        )}
                      </div>
                      {(!collapsed || isMobile) && (
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </motion.div>
                      )}
                    </button>

                    {/* Dropdown children with animation */}
                    <AnimatePresence>
                      {(!collapsed || isMobile) && isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ 
                            duration: 0.3,
                            ease: [0.4, 0.0, 0.2, 1]
                          }}
                          className="overflow-hidden"
                        >
                          <div className="mt-1 ml-4 pl-2 border-l border-white/20 space-y-1">
                            {item.children
                              .filter((child) => child.show)
                              .map((child, index) => {
                                const ChildIcon = child.icon;
                                const isChildActive = location.pathname === child.href;
                                return (
                                  <motion.button
                                    key={child.name}
                                    initial={{ x: -10, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ 
                                      delay: index * 0.05,
                                      duration: 0.2
                                    }}
                                    onClick={() => handleNavigation(child.href)}
                                    className={`w-full flex items-center px-2 sm:px-3 py-2 sm:py-2.5 transition-colors cursor-pointer rounded-lg ${
                                      isChildActive
                                        ? "bg-[#47C2FF]/20 text-white"
                                        : "text-white/80 hover:bg-white/10 hover:text-white"
                                    }`}
                                  >
                                    <ChildIcon className="h-4 w-4 mr-2 sm:mr-3 flex-shrink-0" />
                                    <span className="truncate text-sm font-medium">
                                      {child.name}
                                    </span>
                                  </motion.button>
                                );
                              })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              // Regular navigation item (not dropdown)
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full flex items-center transition-colors cursor-pointer rounded-lg ${
                    collapsed && !isMobile
                      ? "justify-center p-3"
                      : "px-2 sm:px-3 py-2 sm:py-2.5"
                  } ${
                    isActive
                      ? "bg-[#47C2FF]/20 text-white"
                      : "text-white hover:bg-white/10"
                  }`}
                  title={collapsed && !isMobile ? item.name : undefined}
                >
                  <IconComponent
                    className={`flex-shrink-0 ${
                      collapsed && !isMobile
                        ? "h-5 w-5"
                        : "h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3"
                    }`}
                  />
                  {(!collapsed || isMobile) && (
                    <span
                      className={`truncate transition-opacity duration-300 ${
                        collapsed && !isMobile ? "opacity-0 w-0" : "opacity-100"
                      } text-sm sm:text-base font-medium`}
                    >
                      {item.name}
                    </span>
                  )}
                </button>
              );
            })}
        </nav>

        {/* Admin Navigation */}
        {adminItems.some(item => item.show) && (
          <nav className="space-y-1 sm:space-y-2 border-t border-white/10 pt-4">
            {(!collapsed || isMobile) && (
              <p className="px-2 text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">
                Administration
              </p>
            )}
            {adminItems
              .filter((item) => item.show)
              .map((item) => {
                const IconComponent = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full flex items-center transition-colors cursor-pointer rounded-lg ${
                      collapsed && !isMobile
                        ? "justify-center p-3"
                        : "px-2 sm:px-3 py-2 sm:py-2.5"
                    } ${
                      isActive
                        ? "bg-[#47C2FF]/20 text-white"
                        : "text-white hover:bg-white/10"
                    }`}
                    title={collapsed && !isMobile ? item.name : undefined}
                  >
                    <IconComponent
                      className={`flex-shrink-0 ${
                        collapsed && !isMobile
                          ? "h-5 w-5"
                          : "h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3"
                      }`}
                    />
                    {(!collapsed || isMobile) && (
                      <span
                        className={`truncate transition-opacity duration-300 ${
                          collapsed && !isMobile ? "opacity-0 w-0" : "opacity-100"
                        } text-sm sm:text-base font-medium`}
                      >
                        {item.name}
                      </span>
                    )}
                  </button>
                );
              })}
          </nav>
        )}

        {/* Account Navigation */}
        <nav className="space-y-1 sm:space-y-2 border-t border-white/10 pt-4">
          {accountItems
            .filter(item => item.show)
            .map((item) => {
              const IconComponent = item.icon;
              
              // Check if this item or any of its children is active
              const isActive = item.href 
                ? location.pathname === item.href
                : false;
              
              const hasActiveChild = item.children?.some(
                (child) => location.pathname === child.href
              );

              // If it's a dropdown item
              if (item.isDropdown) {
                // Only use manual toggle state, no auto-open
                const isOpen = openDropdowns[item.name] || false;
                
                return (
                  <div key={item.name}>
                    {/* Dropdown trigger */}
                    <button
                      onClick={() => (!collapsed || isMobile) && toggleDropdown(item.name)}
                      className={`w-full flex items-center justify-between transition-colors cursor-pointer rounded-lg ${
                        collapsed && !isMobile
                          ? "justify-center p-3"
                          : "px-2 sm:px-3 py-2 sm:py-2.5"
                      } ${
                        hasActiveChild
                          ? "bg-[#47C2FF]/20 text-white"
                          : "text-white hover:bg-white/10"
                      }`}
                      title={collapsed && !isMobile ? item.name : undefined}
                    >
                      <div className="flex items-center">
                        <IconComponent
                          className={`flex-shrink-0 ${
                            collapsed && !isMobile
                              ? "h-5 w-5"
                              : "h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3"
                          }`}
                        />
                        {(!collapsed || isMobile) && (
                          <span className="truncate text-sm sm:text-base font-medium">
                            {item.name}
                          </span>
                        )}
                      </div>
                      {(!collapsed || isMobile) && (
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </motion.div>
                      )}
                    </button>

                    {/* Dropdown children with animation */}
                    <AnimatePresence>
                      {(!collapsed || isMobile) && isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ 
                            duration: 0.3,
                            ease: [0.4, 0.0, 0.2, 1]
                          }}
                          className="overflow-hidden"
                        >
                          <div className="mt-1 ml-4 pl-2 border-l border-white/20 space-y-1">
                            {item.children
                              .filter((child) => child.show)
                              .map((child, index) => {
                                const ChildIcon = child.icon;
                                const isChildActive = location.pathname === child.href;
                                return (
                                  <motion.button
                                    key={child.name}
                                    initial={{ x: -10, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ 
                                      delay: index * 0.05,
                                      duration: 0.2
                                    }}
                                    onClick={() => handleNavigation(child.href)}
                                    className={`w-full flex items-center px-2 sm:px-3 py-2 sm:py-2.5 transition-colors cursor-pointer rounded-lg ${
                                      isChildActive
                                        ? "bg-[#47C2FF]/20 text-white"
                                        : "text-white/80 hover:bg-white/10 hover:text-white"
                                    }`}
                                  >
                                    <ChildIcon className="h-4 w-4 mr-2 sm:mr-3 flex-shrink-0" />
                                    <span className="truncate text-sm font-medium">
                                      {child.name}
                                    </span>
                                  </motion.button>
                                );
                              })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              // Regular navigation item (not dropdown)
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`w-full flex items-center transition-colors cursor-pointer rounded-lg ${
                    collapsed && !isMobile
                      ? "justify-center p-3"
                      : "px-2 sm:px-3 py-2 sm:py-2.5"
                  } ${
                    isActive
                      ? "bg-[#47C2FF]/20 text-white"
                      : "text-white hover:bg-white/10"
                  }`}
                  title={collapsed && !isMobile ? item.name : undefined}
                >
                  <IconComponent
                    className={`flex-shrink-0 ${
                      collapsed && !isMobile
                        ? "h-5 w-5"
                        : "h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3"
                    }`}
                  />
                  {(!collapsed || isMobile) && (
                    <span
                      className={`truncate transition-opacity duration-300 ${
                        collapsed && !isMobile ? "opacity-0 w-0" : "opacity-100"
                      } text-sm sm:text-base font-medium`}
                    >
                      {item.name}
                    </span>
                  )}
                </button>
              );
            })}
        </nav>

        {/* Support Button */}
        <div className="mt-4 border-t border-white/10 pt-4">
          <AlertDialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
            <button
              onClick={() => setIsSupportOpen(true)}
              className={`w-full flex items-center transition-colors cursor-pointer rounded-lg text-white hover:bg-white/10 ${
                collapsed && !isMobile
                  ? "justify-center p-3"
                  : "px-2 sm:px-3 py-2 sm:py-2.5"
              }`}
              title={collapsed && !isMobile ? "Support" : undefined}
            >
              <HelpCircle
                className={`flex-shrink-0 ${
                  collapsed && !isMobile
                    ? "h-5 w-5"
                    : "h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3"
                }`}
              />
              {(!collapsed || isMobile) && (
                <span
                  className={`truncate transition-opacity duration-300 ${
                    collapsed && !isMobile ? "opacity-0 w-0" : "opacity-100"
                  } text-sm sm:text-base font-medium`}
                >
                  Support
                </span>
              )}
            </button>

            <AlertDialogContent className="max-w-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>Contact Support</AlertDialogTitle>
                <AlertDialogDescription>
                  We'll respond as soon as possible
                </AlertDialogDescription>
              </AlertDialogHeader>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="support-subject"
                    className="text-sm font-medium text-gray-700 mb-2 block"
                  >
                    Subject <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="support-subject"
                    type="text"
                    placeholder="Brief description of your issue"
                    value={supportFormData.subject}
                    onChange={(e) => handleSupportInputChange("subject", e.target.value)}
                    className="w-full"
                    disabled={isSending}
                    required
                  />
                </div>

                <div>
                  <Label
                    htmlFor="support-message"
                    className="text-sm font-medium text-gray-700 mb-2 block"
                  >
                    Message <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="support-message"
                    placeholder="Please describe your issue in detail..."
                    value={supportFormData.message}
                    onChange={(e) => handleSupportInputChange("message", e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={isSending}
                    required
                  />
                </div>

                <div className="flex items-center justify-end pt-2">
                 
                  <div className="flex gap-2">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button
                      onClick={handleSupportSubmit}
                      disabled={isSending}
                      className="bg-[#075b7d] hover:bg-[#075b7d]/90 disabled:bg-gray-300"
                    >
                      {isSending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        "Send Message"
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-3 -mx-6 -mb-6 border-t border-gray-200 rounded-b-xl">
                <p className="text-xs text-gray-600 text-center">
                  For urgent issues, email{" "}
                  <a
                    href="mailto:staff@theinspac.com"
                    className="text-[#075b7d] hover:underline font-medium"
                  >
                    staff@theinspac.com
                  </a>
                </p> 
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Spacer to push footer down */}
        <div className="flex-1"></div>
      </div>

      {/* Footer */}
      <div
        className={`border-t border-white/10 flex-shrink-0 transition-all duration-300 ease-in-out ${
          collapsed && !isMobile ? "p-2" : "p-4 sm:p-6"
        }`}
      > 
        {collapsed && !isMobile ? (
          /* Collapsed user section - just avatar and subscription status */
          <div className="flex flex-col items-center space-y-2">
            {/* <SubscriptionStatusWidget variant="compact" showActions={false} /> */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
              title={`${user?.firstName} ${user?.lastName}`}
              onClick={() => handleNavigation("/profile")}
            >
              {user?.picture ? (
                <img 
                  src={user.picture} 
                  alt={`${user?.firstName || ''} ${user?.lastName || ''}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700">
                    {user?.firstName?.charAt(0)}
                    {user?.lastName?.charAt(0)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Full user section */
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden"
                onClick={() => handleNavigation("/profile")}
              >
                {user?.picture ? (
                  <img 
                    src={user.picture} 
                    alt={`${user?.firstName || ''} ${user?.lastName || ''}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">
                      {user?.firstName?.charAt(0)}
                      {user?.lastName?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              {(!collapsed && !isMobile) || isMobile ? (
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-white/60 truncate">
                    {user?.email}
                  </p>
                </div>
              ) : null} 
            </div>
            {(!collapsed && !isMobile) || isMobile ? (
              <button
                onClick={handleSidebarLogout}
                className="p-1.5 sm:p-2 text-white/60 hover:text-white transition-colors cursor-pointer flex-shrink-0 ml-2"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
