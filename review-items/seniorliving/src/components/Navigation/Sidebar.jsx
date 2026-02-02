import { NavLink } from "react-router-dom"
import { useUser } from "../../context/UserContext"
import { useSidebar } from "../../context/SidebarContext"
import { USER_ROLES } from "../../utils/constants"
import {
  LayoutDashboard,
  Home,
  FileText,
  ClipboardList,
  AlertCircle,
  FileCheck,
  Folder,
  BookOpen,
  Building2,
  Network,
  Settings,
  MessageCircle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  UserPlus,
  MoreVertical,
  Inbox,
  Wrench,
  List,
  PlusCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

export default function Sidebar() {
  const { user, hasRole, hasAnyRole } = useUser()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isCollapsed, setIsCollapsed } = useSidebar()
  const [expandedSections, setExpandedSections] = useState({
    "survey-builder": false,
    resources: true,
    libraries: true,
    facilities: true
  })

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Define menu items with sections and role requirements
  const menuSections = [
    {
      id: "apps",
      label: "Menu Items",
      items: [
        {
          id: "home",
          label: "Home",
          icon: Home,
          path: "/dashboard",
          roles: "all",
        },
        {
          id: "reports",
          label: "Reports",
          icon: ClipboardList,
          path: "/reports",
          roles: "all",
        },
        {
          id: "survey-builder",
          label: "Survey Builder",
          icon: FileText,
          path: "/surveys",
          roles: "all",
          expandable: true,
          subItems: [
            {
              id: "survey-list",
              label: "All Surveys",
              path: "/surveys",
              roles: "all",
            },
            {
              id: "create-survey",
              label: "Create New Survey",
              path: "/surveys/builder",
              roles: "all",
            },
          ],
        },
        {
          id: "resources",
          label: "Resources",
          icon: Folder,
          path: "/resources",
          roles: "all",
          expandable: true,
          subItems: [
            {
              id: "resource-list",
              label: "All Resources",
              path: "/resources",
              roles: "all",
            },
          ],
        },
        {
          id: "libraries",
          label: "Libraries",
          icon: BookOpen,
          path: "/libraries",
          roles: "all",
          expandable: true,
          subItems: [
            {
              id: "library-list",
              label: "All Libraries",
              path: "/libraries",
              roles: "all",
            },
          ],
        },
        {
          id: "facilities",
          label: "Facilities",
          icon: Building2,
          path: "/facilities",
          roles: "all",
          expandable: true,
          subItems: [
            {
              id: "add-facility",
              label: "Add facility",
              path: "/facilities/new",
              roles: "all",
            },
            {
              id: "list-facilities",
              label: "List of facilities",
              path: "/facilities",
              roles: "all",
            },
          ],
        },
        {
          id: "multi-facility",
          label: "Multi-facility",
          icon: Network,
          path: "/multi-facility",
          roles: "all",
        },
        {
          id: "plan-of-correction",
          label: "Plan of Correction",
          icon: FileCheck,
          path: "/plan-of-correction",
          roles: "all",
        },
      ],
    },
    {
      id: "explore",
      label: "Additional Items",
      items: [
        {
          id: "ask-mocky365",
          label: "Ask mocky365",
          icon: MessageCircle,
          path: "/ask-mocky365",
          roles: "all",
        },
      ],
    },
  ]

  // Check if user can access menu item
  const canAccess = (item) => {
    if (item.roles === "all") return true
    if (Array.isArray(item.roles)) {
      return hasAnyRole(item.roles)
    }
    return hasRole(item.roles)
  }

  // Filter sections and items based on user role
  const visibleSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item => canAccess(item))
  })).filter(section => section.items.length > 0)

  const getInitials = (name) => {
    if (!name) return "U"
    const words = name.trim().split(" ")
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase()
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-primary text-primary-foreground"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-sky-800 text-white transition-all duration-300 ease-in-out border-r border-gray-800",
          "lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Toggle Button */}
          <div className={cn(
            "flex items-center h-16 border-b border-sky-900/50",
            isCollapsed ? "justify-center px-2" : "justify-between px-4"
          )}>
            {!isCollapsed && (
              <h1 className="text-xl font-bold whitespace-nowrap">MS365</h1>
            )}
            <button
              onClick={toggleSidebar}
              className={cn(
                "p-1.5 rounded-md hover:bg-sky-900/50 transition-colors",
                isCollapsed ? "" : "ml-auto lg:ml-0"
              )}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            {visibleSections.map((section) => (
              <div key={section.id} className={cn("mb-6", isCollapsed && "mb-4")}>
                {/* Section Header */}
                {!isCollapsed && (
                  <div className="px-3 mb-2">
                    <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                      {section.label}
                    </h3>
                  </div>
                )}

                {/* Section Items */}
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const isExpandable = item.expandable && item.subItems
                    const isExpanded = expandedSections[item.id] && !isCollapsed

                    return (
                      <li key={item.id}>
                        <NavLink
                          to={item.path}
                          end={!isExpandable}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                              "justify-center lg:justify-start",
                              isActive
                                ? "bg-sky-700 text-white"
                                : "text-white/90 hover:bg-sky-900/50 hover:text-white"
                            )
                          }
                          onClick={(e) => {
                            setIsMobileMenuOpen(false)
                            // If it's expandable and not collapsed, toggle section but don't navigate
                            if (isExpandable && !isCollapsed) {
                              e.preventDefault()
                              toggleSection(item.id)
                            }
                          }}
                          title={isCollapsed ? item.label : undefined}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          {!isCollapsed && (
                            <>
                              <span className="flex-1 whitespace-nowrap">{item.label}</span>
                              {isExpandable && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    toggleSection(item.id)
                                  }}
                                  className="p-0.5 hover:bg-sky-900/50 rounded"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                            </>
                          )}
                        </NavLink>
                        {isExpandable && !isCollapsed && item.subItems && (
                          <div
                            className={cn(
                              "overflow-hidden transition-all duration-300 ease-in-out",
                              isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                            )}
                          >
                            <ul className="mt-1 ml-8 space-y-1">
                              {item.subItems
                                .filter((subItem) => canAccess(subItem))
                                .map((subItem) => (
                                  <li key={subItem.id}>
                                    <NavLink
                                      to={subItem.path}
                                      className={({ isActive }) =>
                                        cn(
                                          "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                                          isActive
                                            ? "bg-sky-700/50 text-white"
                                            : "text-white/80 hover:bg-sky-900/50 hover:text-white"
                                        )
                                      }
                                      onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                      {subItem.label}
                                    </NavLink>
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Bottom Section - Invite & User Profile */}
          <div className="border-t border-sky-900/50 px-2 py-3 space-y-2">
            {!isCollapsed && (
              <NavLink
                to="/invite-users"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-white/90 hover:bg-sky-900/50 hover:text-white transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                <span>Invite people</span>
              </NavLink>
            )}

        
          </div>
        </div>

        {/* Overlay for mobile */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </aside>
    </>
  )
}

