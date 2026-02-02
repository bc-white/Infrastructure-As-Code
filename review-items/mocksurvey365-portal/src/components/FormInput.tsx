import React, { useState, useEffect, useContext } from "react";
import { Eye, EyeOff } from "lucide-react"; // Make sure to install lucide-react
import Required from "./Required";
import { tokens } from "@/styles/theme";
import { ThemeContext } from "./Heading";
import { resolveToken } from "@/utils/resolveToken";

interface FormInputProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: "text" | "email" | "number" | "date" | "password" | "tel";
  error?: string;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  className?: string;
  description?: string;
}

export const FormInput = ({
  id,
  name,
  label,
  value,
  className,
  onChange,
  placeholder,
  type = "text",
  error,
  required = false,
  optional = true,
  disabled = false,
  description,
}: FormInputProps) => {
  const [internalError, setInternalError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const theme = useContext(ThemeContext);



  const radiusTokenRaw = theme === 'dark'
    ? tokens.Dark.Radius['Radius-md']
    : tokens.Light.Radius['Radius-md'];
  const radiusToken = resolveToken(radiusTokenRaw);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateNumber = (val: string) => /^\d*$/.test(val);

  useEffect(() => {
    if (type === "email" && value && !validateEmail(value)) {
      setInternalError("Please enter a valid email.");
    } else if (type === "number" && value && !validateNumber(value)) {
      setInternalError("Only non-negative numbers are allowed."); 
    } else {
      setInternalError(null);
    }
  }, [value, type]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (type === "number" && !validateNumber(e.target.value)) return;
    onChange(e);
  };

  const inputClass = `
    border-0 w-full pl-3 py-2 pr-10 outline-none transition-colors ${className}
  `;

  const isPassword = type === "password";

  return (
    <div className="flex flex-col gap-1 relative">
      <label 
        htmlFor={id} 
        className="text-sm font-medium mb-1"
        style={{ color: resolveToken(theme === 'dark' ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}
      >
        <span>{label}</span>{" "}
        {required && <Required />}{" "} 
        {optional && (
          <span style={{ color: resolveToken(theme === 'dark' ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}>
            (Optional)
          </span>
        )}
      </label>

      <div 
        className="relative"
        style={{
          borderRadius: radiusToken
        }}
      >
        <input
          id={id}
          name={name}
          type={isPassword && showPassword ? "text" : type}
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          disabled={disabled}
          className={inputClass}
          style={{
            background: resolveToken(theme === 'dark' ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground),
            color: resolveToken(theme === 'dark' ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading),
            borderRadius: radiusToken
          }}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error || internalError ? (
        <span 
          className="text-sm mt-1"
          style={{ color: resolveToken(theme === 'dark' ? tokens.Dark.Typography.Error : tokens.Light.Typography.Error) }}
        >
          {error || internalError}
        </span>
      ) : description ? (
        <span 
          className="text-sm mt-1"
          style={{ color: resolveToken(theme === 'dark' ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}
        >
          {description}
        </span>
      ) : null}
    </div>
  );
};
