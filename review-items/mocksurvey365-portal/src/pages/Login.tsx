import { AuthForm } from "@/components/AuthForm";
import { AnimatePresence, motion } from "motion/react";
import useLoginStore from "@/store/track-login";
import { useAuthStore } from "@/store/auth";
 
import { useEffect } from "react";
import { useNavigate } from "react-router";

export const Login = () => {
  const { setMode } = useLoginStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Set mode to login when component mounts
  useEffect(() => {
    setMode("login");
  }, [setMode]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleAuthSuccess = () => {
    navigate("/dashboard");
  };

  // OTP handling is now inside AuthForm

  return (
    <div className="font-brico">
      <AnimatePresence mode="wait">
        {
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}>
            <AuthForm
              mode="login"
              onSuccess={handleAuthSuccess}
            />
           
          </motion.div>
        }
      </AnimatePresence>
    </div>
  );
};

export default Login;

