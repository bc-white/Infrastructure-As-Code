import { Outlet, useLocation } from "react-router-dom";
import {
  Heart,
  User,
  Compass,
  CreditCard,
  Trophy,
  Sun,
  Moon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { USER_ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";
import { useRef, useEffect } from "react";
import { useUIStore } from "@/store/uiStore";
import { useTheme } from "@/hooks/useTheme";

const UserLayout = () => {
  const { showBottomNav, setMainRef } = useUIStore();
  const mainRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMainRef(mainRef as React.RefObject<HTMLElement>);
  }, [setMainRef]);

  const navItems = [
    {
      id: "discover",
      label: "Discover",
      path: USER_ROUTES.DISCOVER,
      icon: Compass,
    },
    {
      id: "points",
      label: "Points",
      path: USER_ROUTES.POINTS,
      icon: Trophy,
    },
    {
      id: "card",
      label: "Card",
      path: USER_ROUTES.CARD,
      icon: CreditCard,
    },
    {
      id: "saved",
      label: "Saved",
      path: USER_ROUTES.SAVED,
      icon: Heart,
    },
    {
      id: "profile",
      label: "Profile",
      path: USER_ROUTES.PROFILE,
      icon: User,
    },
  ];

  const activeNavItem =
    navItems.find((item) => location.pathname === item.path)?.label ||
    navItems[0].label;

  const isMapView = location.pathname.includes("map-view");

  return (
    <div className="flex flex-col h-screen bg-bg-white-0">
      {/* Top Navigation - Tablet & Desktop Only */}
      <nav className="hidden lg:block sticky top-0 z-40 bg-bg-white-0 shadow">
        <div
          className={cn(
            "container max-w-screen-xl mx-auto px-4",
            isMapView && "max-w-full px-24"
          )}
        >
          <div className="flex items-center justify-between">
            {/* Logo */}
            <h1 className="text-2xl font-bold text-text-strong-950 font-brico py-4">
              Yayy
            </h1>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeNavItem === item.label;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200",
                        active
                          ? "bg-primary-base text-white shadow-sm"
                          : "text-text-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950"
                      )}
                    >
                      <Icon
                        className={cn("h-5 w-5", active && "stroke-[2.5]")}
                      />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-lg text-text-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950 transition-all duration-200"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main ref={mainRef} className="flex-1 overflow-y-auto pb-16 md:pb-4">
        <Outlet />
      </main>

      {/* Bottom Navigation - Mobile Only */}
      {showBottomNav && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-white-0 border-t border-stroke-soft-200 safe-area-inset-bottom">
          <div className="flex justify-center gap-8 items-center h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeNavItem === item.label;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center space-y-1 transition-colors ",
                    active
                      ? "text-primary-base"
                      : "text-text-soft-400 active:text-primary-base"
                  )}
                >
                  <Icon className={cn("h-6 w-6", active && "stroke-[2.5]")} />
                  <span className="text-xs ">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default UserLayout;
