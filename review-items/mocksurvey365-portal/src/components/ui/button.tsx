import * as React from "react";
import { useContext } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot as SlotPrimitive } from "@radix-ui/react-slot";
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

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-normal transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:h-4 [&_svg]:w-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-green-600 text-white hover:bg-green-700",
        warning: "bg-amber-600 text-white hover:bg-amber-700",
        primary: "bg-blue-100 text-blue-600 hover:bg-blue-200",
        primaryLink: "bg-blue-100 text-blue-600 hover:bg-blue-200",
        secondaryLink:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-4",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
      styleType: {
        default: "default",
        stroke: "stroke",
        ghost: "ghost",
        link: "link",
        primary: "primary",
        primaryLink: "primaryLink",
      },
      text: {
        default: "text-primary",
        secondary: "text-secondary",
        success: "text-green-600",
        warning: "text-amber-600",
        primary: "text-blue-600",
        secondaryLink: "text-secondary-foreground",
      },
      font: {
        default: "font-normal",
        bold: "font-bold",
        light: "font-light",
        thin: "font-thin",
        normal: "font-normal",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// Types for Button variants
export type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link"
  | "success"
  | "warning"
  | "primary"
  | "primaryLink"
  | "secondaryLink";

export type ButtonSize = "default" | "sm" | "lg" | "icon";
export type ButtonStyleType =
  | "default"
  | "stroke"
  | "ghost"
  | "link"
  | "primary"
  | "primaryLink";
export type ButtonText =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "primary"
  | "secondaryLink";
export type ButtonFont = "default" | "bold" | "light" | "thin" | "normal";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      styleType,
      text,
      font,
      asChild = false,
      leadingIcon,
      trailingIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? SlotPrimitive : "button";
    const theme = useContext(ThemeContext);
    let style: React.CSSProperties = {};
    // Use tokens for border radius, background, and text color for primary variant
    if (variant === "primary") {
      // Border radius
      const radiusToken =
        theme === "dark"
          ? tokens.Dark.Radius["Radius-md"]
          : tokens.Light.Radius["Radius-md"];
      // Button/Primary background
      const bgToken =
        theme === "dark"
          ? tokens.Dark.Button.Primary
          : tokens.Light.Button.Primary;
      // Button/Primary Text
      const textToken =
        theme === "dark"
          ? tokens.Dark.Button["Primary Text"]
          : tokens.Light.Button["Primary Text"];
      style = {
        borderRadius: resolveToken(radiusToken),
        background: resolveToken(bgToken),
        color: resolveToken(textToken),
        ...(props.style || {}),
      };
      // Disabled text color
      if (disabled) {
        const disabledTextToken =
          theme === "dark"
            ? tokens.Dark.Button["Primary Disabled Text"]
            : tokens.Light.Button["Primary Disabled Text"];
        style.color = resolveToken(disabledTextToken);
      }
    } else if (props.style) {
      style = props.style;
    }
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, styleType, text, font, className }),
          "rounded-[6px]",
        )}
        ref={ref}
        disabled={disabled}
        style={style}
        {...props}
      >
        {leadingIcon && <span className="shrink-0">{leadingIcon}</span>}
        {children}
        {trailingIcon && <span className="shrink-0">{trailingIcon}</span>}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
