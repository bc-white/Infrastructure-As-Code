import { tokens } from "@/styles/theme";

// Utility to resolve token references (e.g., "{Neutral.900}") to actual color values

export function resolveToken(token: string): string {
  if (!token || typeof token !== "string") return token;
  if (!token.startsWith("{")) return token;
  const path = token.replace(/[{}]/g, "").split(".");
  let value: any = tokens;
  let chain = [token];
  for (const key of path) {
    // Try Alias first
    if (value[key] === undefined && tokens.Alias && tokens.Alias[key]) {
      value = tokens.Alias[key];
      chain.push(value);
      continue;
    }
    // Try Brand if Alias fails
    if (value[key] === undefined && tokens.Brand && tokens.Brand[key]) {
      value = tokens.Brand[key];
      chain.push(value);
      continue;
    }
    value = value[key];
    chain.push(value);
    if (!value) {
    
      return token;
    }
  }
  if (typeof value === "string" && value.startsWith("{")) {
    chain.push(value);

    return resolveToken(value);
  }

  return value;
}






import React, { useContext } from "react";
import type { ReactNode, HTMLAttributes } from "react";

// Optional: Theme context for global theme switching

// Safe default: always 'light' or 'dark', never null
// Do NOT use localStorage directly here to avoid SSR issues
const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
  }
  return 'light';
};

const ThemeContext = React.createContext<'light' | 'dark'>(getInitialTheme());

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  theme?: 'light' | 'dark'; // Optional override
}

export const Heading = ({ children, theme, ...props }: HeadingProps) => {
  // Use prop, context, or default to 'light'
  const contextTheme = useContext(ThemeContext);
  const activeTheme = theme || contextTheme || 'light';
  const colorToken =
    activeTheme === 'dark'
      ? tokens.Dark.Typography.Heading
      : tokens.Light.Typography.Heading;

     

  return (
    <h1 style={{ color: resolveToken(colorToken) }} {...props}>
      {children}
    </h1>
  );
};

// Export ThemeContext for use in app root
export { ThemeContext };
