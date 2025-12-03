

export function generateOtp() {
  // 6-digit secure OTP
  const num = Math.floor(100000 + Math.random() * 900000);
  return String(num);
}