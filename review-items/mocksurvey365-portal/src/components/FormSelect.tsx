import Required from "./Required";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContext } from "react";
import { tokens } from "@/styles/theme";
import { ThemeContext } from "./Heading";
import { resolveToken } from "@/utils/resolveToken";

interface FormSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface FormSelectProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  className?: string;
  description?: string;
  options: FormSelectOption[];
}

export const FormSelect = ({
  id,
  label,
  value,
  className,
  onChange,
  placeholder = "Select an option",
  error,
  required = false,
  optional = true,
  disabled = false,
  description,
  options,
}: FormSelectProps) => {
  const theme = useContext(ThemeContext);

  // Token resolution

  const radiusTokenRaw = theme === 'dark'
    ? tokens.Dark.Radius['Radius-md']
    : tokens.Light.Radius['Radius-md'];
  const radiusToken = resolveToken(radiusTokenRaw);

  const selectTriggerClass = `
    border-0 w-full px-3 py-2 outline-none transition-colors ${className}
  `;

  return (
    <div className="flex flex-col gap-1 relative">
      <label 
        htmlFor={id} 
        className="text-sm font-medium"
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
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger 
            className={selectTriggerClass} 
            id={id}
            style={{
              background: resolveToken(theme === 'dark' ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground),
              color: resolveToken(theme === 'dark' ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading),
              borderRadius: radiusToken
            }}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value} 
                className="py-2 min-h-[auto] items-start"
              >
                <div className="flex flex-col gap-1 w-full">
                  <span className="font-medium text-sm leading-none">
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="text-xs text-muted-foreground leading-tight">
                      {option.description}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <span 
          className="text-sm mt-1"
          style={{ color: resolveToken(theme === 'dark' ? tokens.Dark.Typography.Error : tokens.Light.Typography.Error) }}
        >
          {error}
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
