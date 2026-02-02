import { useState, useRef, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import { useUser } from "../../context/UserContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Bell, LogOut, User, Settings, Search } from "lucide-react"
import { useNavigate } from "react-router-dom"

export default function Header() {
  const { user, logout } = useAuth()
  const { facility, role } = useUser()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const userMenuRef = useRef(null)
  const notificationsRef = useRef(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const getInitials = (name) => {
    if (!name) return "U"
    const words = name.trim().split(" ")
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase()
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
  }

  const getAvatarUrl = (name, email) => {
    const displayName = name || email || "User"
    // Using UI Avatars - free avatar service
    const encodedName = encodeURIComponent(displayName)
    return `https://ui-avatars.com/api/?name=${encodedName}&background=random&color=fff&size=128&bold=true`
  }

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-white">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left side - Facility name (optional) */}
        <div className="flex-1">
          {facility && (
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{facility.name}</p>
              <p className="text-xs text-gray-500">{facility.city}, {facility.state}</p>
            </div>
          )}
        </div>

        {/* Right side - Search, Notifications, User Menu */}
        <div className="flex items-center gap-4">
          {/* Search (optional, can be added later) */}
          {/* <Button variant="ghost" size="icon" className="hidden md:flex">
            <Search className="h-5 w-5" />
          </Button> */}

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {/* Notification badge can be added here */}
              {/* <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" /> */}
            </Button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="p-4">
                  <h3 className="text-sm font-semibold mb-2">Notifications</h3>
                  <p className="text-sm text-muted-foreground">No new notifications</p>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={getAvatarUrl(user?.name, user?.email)} 
                  alt={user?.name || user?.email} 
                />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || user?.email}
                </p>
                {role && (
                  <p className="text-xs text-gray-500">{role.name}</p>
                )}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.name || user?.email}
                    </p>
                    {role && (
                      <p className="text-xs text-gray-500 mt-1">{role.name}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      navigate("/settings")
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      navigate("/settings")
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

