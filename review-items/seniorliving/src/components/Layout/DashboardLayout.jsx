import { Outlet, useLocation } from "react-router-dom"
import { SidebarProvider, useSidebar } from "../../context/SidebarContext"
import Sidebar from "../Navigation/Sidebar"
import Header from "../Navigation/Header"
import Breadcrumbs from "../Navigation/Breadcrumbs"

function DashboardContent() {
  const { isCollapsed } = useSidebar()
  const location = useLocation()
  
  // Routes where sidebar should be hidden
  const hideSidebarRoutes = [
    "/facilities/new",
    "/facilities/edit",
    "/ask-mocky365"
  ]
  
  const shouldHideSidebar = hideSidebarRoutes.some(route => 
    location.pathname.startsWith(route)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {!shouldHideSidebar && <Sidebar />}
      
      {/* Main Content Area */}
      <div className={shouldHideSidebar ? "w-full" : (isCollapsed ? "lg:pl-16 transition-all duration-300" : "lg:pl-64 transition-all duration-300")}>
        {!shouldHideSidebar && <Header />}
        {!shouldHideSidebar && <Breadcrumbs />}
        
        {/* Page Content */}
        <main className={shouldHideSidebar ? "p-0" : "p-4 lg:p-6"}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <DashboardContent />
    </SidebarProvider>
  )
}
