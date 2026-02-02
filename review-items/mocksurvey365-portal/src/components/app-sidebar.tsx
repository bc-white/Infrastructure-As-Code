import * as React from "react"
import {
  LayoutDashboard,
  HeadphonesIcon,
  Settings,
  MessageSquare,
  LogOut,
  Tag,
  TrendingUp,
} from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

import MockSurvey365Logo from "@/assets/logo.png";
import { useAuthStore } from "@/store/auth";
import { resolveToken } from "@/utils/resolveToken";
import { tokens } from "@/styles/theme";
import { getTheme } from "@/styles/getTheme";

const theme = getTheme();

// Merchant Navigation
const merchantGroups = [
  {
    title: "Dashboard",
    items: [
      {
        title: "Overview",
        url: "/dashboard/merchant",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Discount",
    items: [
      {
        title: "Manage Discounts",
        url: "/dashboard/merchant/discounts",
        icon: Tag,
      },
    ],
  },
  {
    title: "Analytics",
    items: [
      {
        title: "Analytics Dashboard",
        url: "/dashboard/merchant/analytics",
        icon: TrendingUp,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "Account",
        url: "/dashboard/merchant/account",
        icon: Settings,
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        title: "Help Center",
        url: "/support",
        icon: HeadphonesIcon,
      },
      {
        title: "Contact Support",
        url: "/support/contact",
        icon: MessageSquare,
      },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, state } = useSidebar();
  
  const user = useAuthStore((state) => state.user);
  const { logout } = useAuthStore();

  const data = {
    user: {
      name: user?.name || 'User',
      email: user?.email || '',
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    },
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    localStorage.removeItem('auth');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Get user from localStorage auth
  const authData = localStorage.getItem('auth');
  const currentUser = authData ? JSON.parse(authData)?.state?.user : null;

  // Select navigation based on user role
  const getSidebarGroups = () => {
    if (currentUser?.role === 'merchant') {
      return merchantGroups;
    } else {
      // Default to merchant groups for now
      return merchantGroups;
    }
  };
  
  const sidebarGroups = getSidebarGroups();

  return (
    <Sidebar
      collapsible={isMobile ? "offcanvas" : "icon"}
      className="transition-[width] md:h-[100dvh]"
      {...props}
      style={{
        background: resolveToken(
          theme === "dark"
            ? tokens.Dark.Surface.Primary
            : tokens.Light.Surface.Primary
        ),
      }}
    >
      <SidebarRail className="hidden md:flex" />
      <SidebarHeader className="border-sidebar-border/0">
        <SidebarMenu>
          <SidebarMenuItem className="mx-4">
            <SidebarMenuButton className="px-2 py-8 ">
              <img src={MockSurvey365Logo} alt="MockSurvey365 Logo" className="h-10 w-auto" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          {sidebarGroups.map((group, idx) => (
            <React.Fragment key={group.title}>
              {state !== "collapsed" && (
                <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider" style={{
                  color: resolveToken(theme === 'dark' ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext)
                }}>
                  {group.title}
                </div>
              )}
              {group.items.map((item) => (
                <SidebarMenuItem key={item.url || item.title}>
                  <SidebarMenuButton
                    asChild={true}
                    isActive={item.url ? location.pathname.startsWith(item.url) : false}
                    tooltip={item.title}
                    size={isMobile ? "lg" : "default"}
                    className="pl-6"
                  >
                    <Link 
                    
                    to={item.url!}
                    style={{
                      borderRadius: '6px',
                      color: item.url ? location.pathname.startsWith(item.url)
                          ? resolveToken(theme === 'dark' ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading)
                          : resolveToken(theme === 'dark' ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext)
                        : resolveToken(theme === 'dark' ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext),
                      background: item.url ? location.pathname.startsWith(item.url)
                          ? resolveToken(theme === 'dark' ? tokens.Dark.Highlight['HIghhlight Gray'][50] : tokens.Light.Highlight['HIghhlight Gray'][50])
                          : 'transparent'
                        : 'transparent'
                    }}
                    >
                      <item.icon className="h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {idx < sidebarGroups.length - 1 && state !== "collapsed" && <div className="mb-4" />}
            </React.Fragment>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarFooter className="border-sidebar-border/0">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={data.user.avatar}
              alt={data.user.name}
              className="h-9 w-9 rounded-full object-cover bg-gray-200"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.name)}&background=random`;
              }}
            />
            {state !== "collapsed" && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{data.user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{data.user.email}</p>
              </div>
            )}
          </div>
          
          {/* Logout Button */}
          <SidebarMenuButton
            onClick={handleLogout}
            size={isMobile ? "lg" : "default"}
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            tooltip="Logout"
          >
            <LogOut className="h-4 w-4" />
            {state !== "collapsed" && <span>Logout</span>}
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}