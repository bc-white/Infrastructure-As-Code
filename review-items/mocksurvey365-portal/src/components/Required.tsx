import { resolveToken } from "@/utils/resolveToken";
import { tokens } from "@/styles/theme";
import { ThemeContext } from "./Heading";
import { useContext } from "react";

export default function Required() {
    const theme = useContext(ThemeContext);
    return <span style={{ color: resolveToken(theme === 'dark' ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }} className="text-primary-dark-💙-blue">*</span>;
}