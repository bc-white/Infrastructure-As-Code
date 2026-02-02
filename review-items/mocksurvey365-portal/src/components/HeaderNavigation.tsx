import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Sun, Moon, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { resolveToken } from "@/utils/resolveToken";
import { tokens } from "@/styles/theme";
import { getTheme } from "@/styles/getTheme";
import MockSurvey365Logo from "@/assets/logo.png";

interface NavigationItem {
  id: string;
  label: string;
  url?: string;
  onClick?: () => void;
  submenu?: NavigationItem[];
}

interface HeaderNavigationProps {
  navigationItems?: NavigationItem[];
  activeNavItem?: string;
  onNavItemClick?: (item: NavigationItem) => void;
  showLogo?: boolean;
  showUserDropdown?: boolean;
  className?: string;
}

const HeaderNavigation = ({
  navigationItems = [],
  activeNavItem = '',
  onNavItemClick,
  showLogo = true,
  showUserDropdown = true,
  className = ''
}: HeaderNavigationProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showUserDropdownState, setShowUserDropdownState] = useState(false);
  const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const submenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const theme = getTheme();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdownState(false);
      }
      
      // Close submenus when clicking outside
      if (openSubmenuId) {
        const submenuRef = submenuRefs.current[openSubmenuId];
        if (submenuRef && !submenuRef.contains(event.target as Node)) {
          setOpenSubmenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openSubmenuId]);

  // Theme switch logic
  const handleThemeSwitch = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    window.location.reload();
  };

  // Handle logout
  const handleLogout = () => {
    // Clear auth-related data but preserve theme
    localStorage.removeItem('auth');
    localStorage.removeItem('token');
    localStorage.removeItem('orgOnboarded');
    logout();
    navigate('/login');
  };

  // Token resolution
  const borderTokenRaw = theme === 'dark'
    ? tokens.Dark.Stroke['Stroke-02']
    : tokens.Light.Stroke['Stroke-02'];
  const borderToken = resolveToken(borderTokenRaw);
  const radiusTokenRaw = theme === 'dark'
    ? tokens.Dark.Radius['Radius-md']
    : tokens.Light.Radius['Radius-md'];
  const radiusToken = resolveToken(radiusTokenRaw);

  // Handle navigation item click
  const handleNavItemClick = (item: NavigationItem) => {
    if (onNavItemClick) {
      onNavItemClick(item);
    } else if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <div 
      className={`w-full h-16 flex items-center justify-between px-24 md:px-28 px-5 fixed top-0 left-0 right-0 z-50 ${className}`}
      style={{
        border : `1px solid ${resolveToken(theme === 'dark' ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground)}`
      }}
    >
      {/* Logo */}
      {showLogo && (
        <div className="flex items-center">
          <img
            src={MockSurvey365Logo}
            alt="MockSurvey365 Logo"
            className="h-16 sm:w-20 xl:w-16"
          />
        </div>
      )}

        {/* Navigation Items */}
        {navigationItems.length > 0 && (
          <div className="flex items-center space-x-2">
            {navigationItems.map((item) => (
              <div key={item.id} className="relative">
                {item.submenu && item.submenu.length > 0 ? (
                  <>
                    <button
                      onClick={() => setOpenSubmenuId(openSubmenuId === item.id ? null : item.id)}
                      onMouseEnter={() => setOpenSubmenuId(item.id)}
                      className="text-sm font-medium transition-colors px-3 py-2 flex items-center gap-1"
                      style={{
                        borderRadius: '32px',
                        color: activeNavItem === item.label || openSubmenuId === item.id
                          ? resolveToken(theme === 'dark' ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading)
                          : resolveToken(theme === 'dark' ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext),
                        background: activeNavItem === item.label || openSubmenuId === item.id
                          ? resolveToken(theme === 'dark' ? tokens.Dark.Highlight['HIghhlight Gray'][50] : tokens.Light.Highlight['HIghhlight Gray'][50])
                          : 'transparent'
                      }}
                      onMouseLeave={(e) => {
                        if (activeNavItem !== item.label && openSubmenuId !== item.id) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      {item.label}
                      <ChevronDown 
                        size={14} 
                        style={{
                          transform: openSubmenuId === item.id ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }}
                      />
                    </button>
                    {openSubmenuId === item.id && (
                      <div
                        ref={(el) => { submenuRefs.current[item.id] = el; }}
                        className="absolute top-full left-0 mt-2 min-w-[200px] rounded-lg shadow-lg border z-30"
                        style={{
                          background: resolveToken(theme === 'dark' ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground),
                          borderColor: borderToken,
                          borderRadius: radiusToken,
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        }}
                        onMouseEnter={() => setOpenSubmenuId(item.id)}
                        onMouseLeave={() => setOpenSubmenuId(null)}
                      >
                        <div className="py-2">
                          {item.submenu.map((subItem) => (
                            <button
                              key={subItem.id}
                              onClick={() => {
                                handleNavItemClick(subItem);
                                setOpenSubmenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm transition-colors"
                              style={{
                                color: activeNavItem === subItem.label
                                  ? resolveToken(theme === 'dark' ? tokens.Dark.Button.Primary : tokens.Light.Button.Primary)
                                  : resolveToken(theme === 'dark' ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading)
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = resolveToken(theme === 'dark' ? tokens.Dark.Highlight['HIghhlight Gray'][50] : tokens.Light.Highlight['HIghhlight Gray'][50]);
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              {subItem.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => handleNavItemClick(item)}
                    className="text-sm font-medium transition-colors px-3 py-2"
                    style={{
                      borderRadius: '32px',
                      color: activeNavItem === item.label
                        ? resolveToken(theme === 'dark' ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading)
                        : resolveToken(theme === 'dark' ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext),
                      background: activeNavItem === item.label
                        ? resolveToken(theme === 'dark' ? tokens.Dark.Highlight['HIghhlight Gray'][50] : tokens.Light.Highlight['HIghhlight Gray'][50])
                        : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (activeNavItem !== item.label) {
                        e.currentTarget.style.background = resolveToken(theme === 'dark' ? tokens.Dark.Highlight['HIghhlight Gray'][50] : tokens.Light.Highlight['HIghhlight Gray'][50]);
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeNavItem !== item.label) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {item.label}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

      {/* User Avatar with Dropdown */}
      {showUserDropdown && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowUserDropdownState(!showUserDropdownState)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
            style={{
              background: showUserDropdownState 
                ? resolveToken(theme === 'dark' ? tokens.Dark.Surface.Secondary : tokens.Light.Surface.Secondary)
                : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!showUserDropdownState) {
                e.currentTarget.style.background = resolveToken(theme === 'dark' ? tokens.Dark.Surface.Secondary : tokens.Light.Surface.Secondary);
              }
            }}
            onMouseLeave={(e) => {
              if (!showUserDropdownState) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          > 
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{
                background: resolveToken(theme === 'dark' ? tokens.Dark.Button.Primary : tokens.Light.Button.Primary),
                color: resolveToken(theme === 'dark' ? tokens.Dark.Button['Primary Text'] : tokens.Light.Button['Primary Text'])
              }}
            >
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
            </div>
            <span 
              className="text-sm font-medium"
              style={{ color: resolveToken(theme === 'dark' ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}
            >
              {user?.name?.split(' ')[0] || 'User'}
            </span>
            <ChevronDown 
              size={16}
              style={{ color: resolveToken(theme === 'dark' ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}
            />
          </button>

          {/* Dropdown Menu */}
          {showUserDropdownState && (
            <div 
              className="absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg border z-30"
              style={{
                background: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                borderColor: borderToken,
                borderRadius: radiusToken,
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                backdropFilter: 'blur(8px)'
              }}
            >
              <div className="py-2">
                <div 
                  className="px-4 py-2 text-sm"
                  style={{ color: resolveToken(theme === 'dark' ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}
                >
                  {user?.name || 'User Name'}
                </div>
                <div 
                  className="px-4 py-1 text-xs"
                  style={{ color: resolveToken(theme === 'dark' ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}
                >
                  {user?.email || 'user@example.com'}
                </div>
                <hr 
                  className="my-2"
                  style={{ borderColor: borderToken }}
                />
                <button
                  onClick={() => {
                    setShowUserDropdownState(false);
                    handleThemeSwitch();
                  }}
                  className="w-full px-4 py-2 text-left text-sm transition-colors"
                  style={{ 
                    color: resolveToken(theme === 'dark' ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading)
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme === 'dark' ? '#2a2a2a' : '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {theme === 'dark' ? <Sun size={16} className="inline mr-2" /> : <Moon size={16} className="inline mr-2" />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button
                  onClick={() => {
                    setShowUserDropdownState(false);
                    handleLogout();
                  }}
                  className="w-full px-4 py-2 text-left text-sm transition-colors"
                  style={{ 
                    color: resolveToken(theme === 'dark' ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading)
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme === 'dark' ? '#2a2a2a' : '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <LogOut size={16} className="inline mr-2" />
                  Sign Out
                </button> 
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HeaderNavigation;