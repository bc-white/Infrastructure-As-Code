
import { useContext } from "react";
import { cn } from "@/lib/utils";
import { tokens } from "@/styles/theme";
import { ThemeContext } from "@/components/Heading";
// Reuse the resolveToken utility from Heading
function resolveToken(token: string): string {
  if (!token.startsWith("{")) return token;
  const path = token.replace(/[{}]/g, "").split(".");
  let value: any = tokens;
  for (const key of path) {
    if (value[key] === undefined && tokens.Alias && tokens.Alias[key]) {
      value = tokens.Alias[key];
      continue;
    }
    if (value[key] === undefined && tokens.Brand && tokens.Brand[key]) {
      value = tokens.Brand[key];
      continue;
    }
    value = value[key];
    if (!value) return token;
  }
  if (typeof value === "string" && value.startsWith("{")) {
    return resolveToken(value);
  }
  return value;
}


function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  const theme = useContext(ThemeContext);
  // Surface/Foreground for background
  const surfaceToken = theme === 'dark'
    ? tokens.Dark.Surface.Foreground
    : tokens.Light.Surface.Foreground;
  const bgColor = resolveToken(surfaceToken);
  // Radius/Radius-sm for border radius
  const radiusToken = theme === 'dark'
    ? tokens.Dark.Radius['Radius-sm']
    : tokens.Light.Radius['Radius-sm'];
  const borderRadius = resolveToken(radiusToken);
  // Button/Primary Disabled Text for selection color
  const selectionToken = theme === 'dark'
    ? tokens.Dark.Button['Primary Disabled Text']
    : tokens.Light.Button['Primary Disabled Text'];
  const selectionColor = resolveToken(selectionToken);
  return (
    <input
      type={type}
      data-slot="input"
      style={{ background: bgColor, borderRadius, color: selectionColor }}
      className={cn(
        // removed border and set text color via style
        "file:text-foreground placeholder:text-muted-foreground/70 flex h-9 w-full min-w-0 px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        type === "search" &&
          "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
        type === "file" &&
          "text-muted-foreground/70 file:border-input file:text-foreground p-0 pr-3 italic file:me-3 file:h-full file:border-0 file:border-r file:border-solid file:bg-transparent file:px-3 file:text-sm file:font-medium file:not-italic",
        className
      )}
      onFocus={(e: any) => {
        const input = e.target;
        if (!input._selectionStyle) {
          const style = document.createElement('style');
          style.innerHTML = `input[data-slot=\"input\"]::selection { background: ${selectionColor} !important; }`;
          document.head.appendChild(style);
          input._selectionStyle = style;
        }
      }}
      onBlur={(e: any) => {
        const input = e.target;
        if (input._selectionStyle) {
          input._selectionStyle.remove();
          input._selectionStyle = null;
        }
      }}
      {...props}
    />
  )
}

export { Input }
