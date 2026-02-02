import type { TextProps } from "@/types/text";

export const TitleH4 = ({ children }: TextProps) => {
  return (
    <div className="text-center font-brico text-clamp-32 font-medium leading-10 tracking-wide">
      {children}
    </div>
  );
};
