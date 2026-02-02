import Index from "@/routes";
import { Toaster } from "@/components/ui/toaster";
import { ThemeContext } from "@/components/Heading";
import { useEffect, useState } from "react";

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
  }
  return 'light';
}

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme());

  // Apply dark class to HTML element when theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Keep theme in sync with localStorage in case other parts update it
  useEffect(() => {
    const handleStorage = () => {
      const t = localStorage.getItem('theme');
      if (t === 'dark' || t === 'light') setTheme(t);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      <div> 
        <Index />
      </div>
      <Toaster />
    </ThemeContext.Provider>
  );
}

export default App;
