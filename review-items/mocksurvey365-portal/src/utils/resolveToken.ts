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
