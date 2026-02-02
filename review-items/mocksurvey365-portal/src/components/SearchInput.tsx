import React, { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { motion, type MotionValue } from "motion/react";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  containerClassName?: string;
  scrollY?: number;
  // Animation props
  animatedWidth?: MotionValue<string>;
  inputOpacity?: MotionValue<number>;
  iconScale?: MotionValue<number>;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      leadingIcon,
      trailingIcon,
      containerClassName = "",
      className = "",
      onClick,
      animatedWidth,
      inputOpacity,
      iconScale,
      ...props
    },
    ref
  ) => {
    const inputPaddingClasses = [
      leadingIcon ? "pl-2" : "pl-4",
      trailingIcon ? "pr-2" : "pr-4",
    ].join(" ");

    // Build the style object for motion.div
    const containerStyle: any = {};
    if (animatedWidth) {
      containerStyle.width = animatedWidth;
    }

    const iconWrapperStyle: any = {};
    if (iconScale) {
      iconWrapperStyle.scale = iconScale;
    }

    const inputStyle: any = {};
    if (inputOpacity) {
      inputStyle.opacity = inputOpacity;
    }

    return (
      <motion.div
        className={cn(
          `relative flex items-center rounded-full border bg-white
        focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20
        transition-colors duration-200 cursor-pointer`,
          containerClassName
        )}
        onClick={onClick}
        style={containerStyle}
      >
        {leadingIcon && (
          <motion.span
            className="pl-3 text-gray-400 flex items-center flex-shrink-0"
            style={iconWrapperStyle}
          >
            {leadingIcon}
          </motion.span>
        )}

        <motion.div className="flex-1" style={inputStyle}>
          <input
            ref={ref}
            type="text"
            className={cn(
              "w-full py-2 bg-transparent placeholder:text-gray-400 outline-none",
              inputPaddingClasses,
              className
            )}
            {...props}
          />
        </motion.div>

        {trailingIcon && (
          <motion.span
            className="pr-3 text-gray-400 flex items-center flex-shrink-0"
            style={iconWrapperStyle}
          >
            {trailingIcon}
          </motion.span>
        )}
      </motion.div>
    );
  }
);

SearchInput.displayName = "SearchInput";

export default SearchInput;
