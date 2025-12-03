export function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  const visible = Math.min(2, Math.max(1, Math.floor(user.length / 3)));
  return `${user.slice(0, visible)}***@${domain}`;
}
