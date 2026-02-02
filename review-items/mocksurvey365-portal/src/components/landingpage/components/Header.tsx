import React, { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  CircleDot,
  LayoutDashboard,
  DollarSign,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router";
import { ThemeContext, resolveToken } from "@/components/Heading";
import { tokens } from "@/styles/theme";

const Header = () => {
  const [activePage, setActivePage] = useState("discover");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useContext(ThemeContext);
  const [isDarkMode, setIsDarkMode] = useState(theme === "dark"); // initialize from ThemeContext
  const surfaceToken =
    theme === "dark"
      ? tokens.Dark.Surface.Primary
      : tokens.Light.Surface.Primary;
  const headingToken =
    theme === "dark"
      ? tokens.Dark.Typography.Heading
      : tokens.Light.Typography.Heading;
  useEffect(() => {
    // Apply the theme to the document when it changes
    if (isDarkMode) {
      document.documentElement.classList.remove("light-mode");
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
      document.documentElement.classList.add("light-mode");
    }
  }, [isDarkMode]);

  const handleNavClick = (page: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setActivePage(page);
    const element = document.getElementById(page);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleTheme = () => {
    // Toggle theme value, persist to localStorage and reload so App-level provider picks it up.
    const newTheme = isDarkMode ? "light" : "dark";
    try {
      localStorage.setItem("theme", newTheme);
    } catch (e) {
      // ignore storage errors
    }
    // Update local state so this component reflects the change immediately and then reload
    setIsDarkMode(!isDarkMode);
    // Reload to let the App ThemeContext provider re-read the stored theme (keeps behaviour consistent with other places)
    window.location.reload();
  };

  return (
    <div
      className="sticky top-0 z-50 pt-8 px-4"
      style={{ background: resolveToken(surfaceToken) }}
    >
      <header
        style={{ color: resolveToken(headingToken) }}
        className="w-full max-w-7xl mx-auto py-3 px-6 md:px-8 flex items-center justify-between"
      >
        <div className="p-3">
           <img
            src={theme === 'dark' ? "https://veritypc.com/wp-content/uploads/2015/01/logo_placeholder.png" : "https://veritypc.com/wp-content/uploads/2015/01/logo_placeholder.png"}
            alt="Omcura Logo"
            className="h-8 w-auto"
          />
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-3 rounded-2xl text-muted-foreground hover:text-foreground"
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center absolute left-1/2 transform -translate-x-1/2">
          <div
            style={{
              background: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Surface.Foreground
                  : tokens.Light.Surface.Foreground
              ),
            }}
            className="rounded-full px-1 py-1 backdrop-blur-md bg-background/80 shadow-lg"
          >
            <ToggleGroup
              type="single"
              value={activePage}
              onValueChange={(value) => value && setActivePage(value)}
            >
              <ToggleGroupItem
                value="discover"
                className={cn(
                  "px-4 py-2 rounded-full transition-colors relative"
                )}
                style={{
                  borderRadius: "32px",
                  color:
                    activePage === "discover"
                      ? resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        )
                      : resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Subtext
                            : tokens.Light.Typography.Subtext
                        ),
                  background:
                    activePage === "discover"
                      ? resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Highlight["HIghhlight Gray"][50]
                            : tokens.Light.Highlight["HIghhlight Gray"][50]
                        )
                      : "transparent",
                }}
                onClick={handleNavClick("features")}
              >
                <CircleDot size={16} className="inline-block mr-1.5" /> Discover
              </ToggleGroupItem>
              <ToggleGroupItem
                value="merchants"
                className={cn(
                  "px-4 py-2 rounded-full transition-colors relative"
                )}
                style={{
                  borderRadius: "32px",
                  color:
                    activePage === "merchants"
                      ? resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        )
                      : resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Subtext
                            : tokens.Light.Typography.Subtext
                        ),
                  background:
                    activePage === "merchants"
                      ? resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Highlight["HIghhlight Gray"][50]
                            : tokens.Light.Highlight["HIghhlight Gray"][50]
                        )
                      : "transparent",
                }}
                onClick={handleNavClick("merchants")}
              >
                <DollarSign size={16} className="inline-block mr-1.5" />{" "}
                Merchants
              </ToggleGroupItem>
              <ToggleGroupItem
                value="dashboard"
                className={cn(
                  "px-4 py-2 rounded-full transition-colors relative"
                )}
                style={{
                  borderRadius: "32px",
                  color:
                    activePage === "dashboard"
                      ? resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        )
                      : resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Subtext
                            : tokens.Light.Typography.Subtext
                        ),
                  background:
                    activePage === "dashboard"
                      ? resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Highlight["HIghhlight Gray"][50]
                            : tokens.Light.Highlight["HIghhlight Gray"][50]
                        )
                      : "transparent",
                }}
                onClick={handleNavClick("dashboard")}
              >
                <LayoutDashboard size={16} className="inline-block mr-1.5" />{" "}
                Dashboard
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </nav>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-4 right-4 bg-background/95 backdrop-blur-md py-4 px-6 border border-border rounded-2xl shadow-lg z-50">
            <div className="flex flex-col gap-4">
              <a
                href="#features"
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  activePage === "discover"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                onClick={handleNavClick("features")}
              >
                <CircleDot size={16} className="inline-block mr-1.5" /> Discover
              </a>
              <a
                href="#merchants"
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  activePage === "merchants"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                onClick={handleNavClick("merchants")}
              >
                <DollarSign size={16} className="inline-block mr-1.5" />{" "}
                Merchants
              </a>
              <a
                href="#dashboard"
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  activePage === "dashboard"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                onClick={handleNavClick("dashboard")}
              >
                <DollarSign size={16} className="inline-block mr-1.5" />{" "}
                Dashboard
              </a>

              {/* Add theme toggle for mobile */}
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-muted-foreground">Theme</span>
                <div className="flex items-center gap-2">
                  <Moon
                    size={16}
                    className={`${
                      isDarkMode ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <Switch
                    checked={!isDarkMode}
                    onCheckedChange={toggleTheme}
                    className="data-[state=checked]:bg-primary"
                  />
                  <Sun
                    size={16}
                    className={`${
                      !isDarkMode ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="hidden md:flex items-center gap-4">
          {/* Theme toggle for desktop */}
          <div className="flex items-center gap-2 rounded-full px-3 py-2">
            <Moon
              size={18}
              className={`${
                isDarkMode ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <Switch
              checked={!isDarkMode}
              onCheckedChange={toggleTheme}
              className="data-[state=checked]:bg-primary"
            />
            <Sun
              size={18}
              className={`${
                !isDarkMode ? "text-primary" : "text-muted-foreground"
              }`}
            />
          </div>
          <div className="rounded-2xl">
            <Button
              onClick={() => navigate("/login")}
              variant="ghost"
              className=" hover:text-foreground hover:bg-muted"
              style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Surface.Secondary
                    : tokens.Light.Surface.Secondary
                ),
              }}
            >
              Log in
            </Button>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
