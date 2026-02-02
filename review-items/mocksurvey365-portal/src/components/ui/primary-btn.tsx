import { LoaderCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LabelSmall } from "@/components/texts/label-small";

interface ButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function PrimaryBtn({
  children,
  loading,
  type,
  className,
  ...props
}: ButtonProps & { children: React.ReactNode }) {
  return (
    <Button
      type={type}
      {...props}
      disabled={loading || props.disabled}
      className={`flex justify-center items-center p-[10px] w-full align-self-stretch bg-primary-base-💙-blue rounded-[10px] hover:bg-primary-base-💙-blue/90 ${className}`}>
      {loading && (
        <LoaderCircleIcon
          className="-ms-1 animate-spin"
          size={16}
          aria-hidden="true"
        />
      )}
      <LabelSmall className="text-white-0-light">{children}</LabelSmall>
    </Button>
  );
}
