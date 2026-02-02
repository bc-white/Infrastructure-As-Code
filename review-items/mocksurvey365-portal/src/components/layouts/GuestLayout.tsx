
import { useContext } from "react";
import { tokens } from "@/styles/theme";
import { ThemeContext } from "@/components/Heading";
import { Outlet } from "react-router-dom";
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


const GuestLayout = () => {
  const theme = useContext(ThemeContext);
  const surfaceToken = theme === 'dark'
    ? tokens.Dark.Surface.Primary
    : tokens.Light.Surface.Primary;
  const bgColor = resolveToken(surfaceToken);
  return (
    <div
      className="min-h-screen font-brico w-full"
      style={{ background: bgColor }}
    >
      <div className="w-full">
        <Outlet />
      </div>
    </div>
  );
};

export default GuestLayout;
