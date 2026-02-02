import { useContext } from 'react';
import { ThemeContext } from '@/components/Heading';

export const useTheme = () => {
  const theme = useContext(ThemeContext);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);

    // Apply/remove dark class immediately for instant feedback
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Reload to update React state
    window.location.reload();
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    localStorage.setItem('theme', newTheme);

    // Apply/remove dark class immediately
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Reload to update React state
    window.location.reload();
  };

  return { theme, toggleTheme, setTheme };
};
