import apiClient from "../client";

export function signIn(email: string) {
  return apiClient.post("/user/login", { email });
}

export function verifyOTP(email: string, otp: string) {
  return apiClient.post("/otp/verify", { email, otp });
}

export function signUp(name: string, email: string, password: string, userType?: string) {
  return apiClient.post("/auth/register", { name, email, password, password_confirmation: password, userType });
}

export function login(email: string, password: string) {
  return apiClient.post("/auth/login", { email, password });
}

export function verifySignUpOTP(email: string, otp: string) {
  return apiClient.post("/auth/otp/verify", { email, otp });
}

export function verifyLoginOTP(otp: string) {
  return apiClient.post("/user/verifyOtp", { otp });
}

export function resendOTP(email: string) {
  return apiClient.post("/user/resendOtp", { email });
}

export function logOut() {
  return apiClient.post("/auth/logout");
}
