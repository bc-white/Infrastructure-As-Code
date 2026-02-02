import MockSurvey365Logo from "@/assets/logo.png";
import { TitleH6 } from "@/components/texts/title-h6";
import { ParagraphMed } from "@/components/texts/paragraph-med";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { PrimaryBtn } from "@/components/ui/primary-btn";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router";

export const WelcomeBoard = () => {
  const navigate = useNavigate();
  const initialProgress = 50 + Math.floor(Math.random() * 25);
  const [progress, setProgress] = useState(initialProgress);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 100) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setIsSuccess(true);
          toast.success("You are all set up!", {
            id: "welcome-board",
            position: "top-center",
            icon: <CheckCircle className="text-green-500 mr-2 w-5 h-5" />,
          });
          return prev;
        }
      });
    }, 500);
    return () => clearInterval(interval);
  });

  return (
    <div className="flex flex-col items-center ">
      <div className="flex flex-col items-center gap-9 mb-14">
        <TitleH6 className="text-strong-950">Welcome Aboard!</TitleH6>
        <img
            src={MockSurvey365Logo}
            alt="MockSurvey365 Logo"
            className="w-16 sm:w-20 xl:w-16"
        />
      </div>
      <div className="flex justify-start items-center gap-6 w-full mb-4">
        <div className="flex-1 h-3 bg-weak-25 rounded-[32px] flex items-center px-1">
          <Progress
            value={progress}
            className="flex-1 bg-transparent rounded-[32px] h-2 w-full"
          />
        </div>
        <span className="font-inter font-medium text-clamp-18 text-sub-600">
          {" "}
          {progress}%
        </span>
      </div>
      <ParagraphMed className="text-center text-soft-400">
        You’ll be up and running in minutes, let’s get you set up.
      </ParagraphMed>
      <div className="mt-8 max-w-[126px]">
        <PrimaryBtn
          onClick={() => {
            navigate("/");
          }}
          className="px-8 py-[10px] rounded-[10px] w-full"
          disabled={!isSuccess}>
          Let’s Go
        </PrimaryBtn>
      </div>
    </div>
  );
};
