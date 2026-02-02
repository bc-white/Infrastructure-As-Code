import { useMutation } from "@tanstack/react-query";
import { signIn, verifyOTP, signUp, login, verifySignUpOTP, verifyLoginOTP, resendOTP, logOut } from "../queries/auth";
import { useAuthStore } from "@/store/auth";
import { useNavigate } from "react-router";

export function useSignIn() {
  // For OTP login, this just triggers OTP send; no login on success
  return useMutation({
    mutationFn: signIn,
  });
}

export function useVerifyOTP() {
  const { login } = useAuthStore();
  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      verifyOTP(email, otp),
    onSuccess: (data) => {
      // Extract user and token from API response
      const userData = data?.data?.data?.user || data?.data?.user;
      const authToken = data?.data?.data?.token || data?.data?.token || data?.data?.access_token;
      
      if (userData) {
        login(userData, authToken ?? null);
        if (authToken) {
          localStorage.setItem('token', authToken);
        }
      }
    },
  });
}

export function useSignUp() {
  return useMutation({
    mutationFn: ({ name, email, password, userType }: { name: string; email: string; password: string; userType?: string }) =>
      signUp(name, email, password, userType),
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
  });
}

export function useVerifySignUpOTP() {
  const { login } = useAuthStore();
  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      verifySignUpOTP(email, otp),
    onSuccess: (data) => {
      // Store user data and token permanently
      // API response: { data: { status, message, data: { user: {...}, token: "..." } } }
      const userData = data?.data?.data?.user;
      const authToken = data?.data?.data?.token || data?.data?.data?.access_token;
      
      if (userData) {
        login(userData, authToken);
        
        // Store token in localStorage for API client
        if (authToken) {
          localStorage.setItem('token', authToken);
        }
      } else {
        console.error('No user data found in response');
      }
    },
    onError: (error: any) => {
      //console.error('OTP verification failed:', error);
      return error;
    },
  });
}

export function useVerifyLoginOTP() {
  return useMutation({
    mutationFn: ({ otp }: { otp: string }) => verifyLoginOTP(otp),
    onError: (error: any) => {
      
      return error;
    },
  });
}

export function useResendOTP() {
  return useMutation({
    mutationFn: ({ email }: { email: string }) => resendOTP(email),
  });
}

export function useLogOut() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: logOut,
    onSuccess: () => {
      logout();
      localStorage.removeItem('token');
      navigate('/login');
    }, 
  });
}


