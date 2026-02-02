import MockSurvey365Logo from "@/assets/logo.png";
import { Input } from "@/components/ui/input";
import { useId, useState } from "react";

import { LabelSmall } from "@/components/texts/label-small";
import { PrimaryBtn } from "./ui/primary-btn";
import { useSignIn } from "@/api/services/auth";
import { toast } from "sonner";
import { XCircleIcon } from "lucide-react";

export const EmailForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [loading, setLoading] = useState(false);
  const { mutate: signIn } = useSignIn();
  const id = useId();
  const [email, setEmail] = useState("");
  const placeholder = "e.g. admin@omcura.com";
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    e.preventDefault();
    signIn(email, {
      onSuccess: () => {
        setLoading(false);
        onSuccess();
      },
      onError: () => {
        setLoading(false);
        toast.error("Invalid email", {
          position: "top-center",
          icon: <XCircleIcon className="w-4 h-4 text-red-500 mr-2 " />,
        });
      },
    });
  };
  return (
    <form
      className="flex flex-col items-start w-[300px]"
      onSubmit={handleSubmit}>
      <img
        src={MockSurvey365Logo}
        alt="MockSurvey365 Logo"
        className="w-16 sm:w-20 xl:w-16 mb-8"
      />
      <div className="flex flex-col items-start gap-2 mb-4 w-full">
        <LabelSmall title={id} className="text-strong-950">
          Enter your email to continue
        </LabelSmall>
        <Input
          id={id}
          className="w-full  rounded-[10px] placeholder:text-soft-400 font-inter"
          placeholder={placeholder}
          type="email"
          value={email}
          aria-invalid
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <p
          className="peer-aria-invalid:text-destructive  peer-aria-invalid:block hidden "
          role="alert"
          aria-live="polite">
          Email is invalid
        </p>
      </div>
      <PrimaryBtn disabled={!email} type="submit" loading={loading}>
        Continue
      </PrimaryBtn>
    </form>
  );
};
