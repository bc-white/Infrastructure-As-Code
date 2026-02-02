import type { TextProps } from "@/types/text";

export const LabelSmall = ({ children }: TextProps) => {
  return (
    <label className="text-clamp-14 font-medium font-inter  leading-5">
      {children}
    </label>
  );
};
