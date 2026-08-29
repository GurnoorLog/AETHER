const ADMIN_EMAILS: string[] = [];
const rawAdmins = (process.env.ADMIN_EMAILS || "").split(",");
for (const piece of rawAdmins) {
  const trimmed = piece.trim().toLowerCase();
  if (trimmed) ADMIN_EMAILS.push(trimmed);
}

const PUBLIC_ADMIN_EMAILS: string[] = [];
const rawPublic = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",");
for (const piece of rawPublic) {
  const trimmed = piece.trim().toLowerCase();
  if (trimmed) PUBLIC_ADMIN_EMAILS.push(trimmed);
}

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

export function isPublicAdminEmail(email?: string | null): boolean {
  return !!email && PUBLIC_ADMIN_EMAILS.includes(email.toLowerCase());
}
