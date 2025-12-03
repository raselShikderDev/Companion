export interface ForgotPasswordInput {
  email: string;
}

export interface VerifyOtpInput {
  email: string;
  otp: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}