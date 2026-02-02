import type { TextProps } from "@/types/text";

export const ParagraphMed = ({ children, className, title }: TextProps) => {
  return (
    <div
      className={`font-inter text-clamp-16 leading-5 tracking-wide ${className}`}
      title={title}>
      {children}
    </div>
  );
};
