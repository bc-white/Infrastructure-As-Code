import { http, HttpResponse } from "msw";

function generateOTP(length = 4): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

export const handlers = [
  http.post(new RegExp("/api/sign-in"), async ({ request }) => {
    const body = (await request.json()) as { email: string };
    const { email } = body;

    await new Promise((res) => setTimeout(res, 1000));
    const isSuccess = Math.random() < 0.8;

    if (isSuccess) {
      const otp = generateOTP();
      sessionStorage.setItem(`otp-${email}`, otp);
      await navigator.clipboard.writeText(otp);
      return HttpResponse.json({ email, otp }, { status: 200 });
    }

    return HttpResponse.json({ error: "Email not found" }, { status: 401 });
  }),

  http.post(new RegExp("/api/verify-otp"), async ({ request }) => {
    const body = (await request.json()) as { email: string; otp: string };
    const { email, otp } = body;

    await new Promise((res) => setTimeout(res, 1000));
    const storedOTP = sessionStorage.getItem(`otp-${email}`);

    if (storedOTP === otp) {
      return HttpResponse.json({ email, token: "1234567890" }, { status: 200 });
    }

    return HttpResponse.json({ error: "Invalid OTP" }, { status: 401 });
  }),
];
