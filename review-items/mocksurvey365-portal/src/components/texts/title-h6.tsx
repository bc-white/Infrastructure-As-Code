import type { TextProps } from "@/types/text";

export const TitleH6 = ({ children, className }: TextProps) => {
  return (
    <div
      className={`font-medium leading-7 text-clamp-24 font-brico ${className}`}>
      {children}
    </div>
  );
};
