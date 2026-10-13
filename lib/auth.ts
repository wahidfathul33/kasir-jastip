// Dipakai di proxy (Edge) dan server actions: hanya Web Crypto.
export const COOKIE = "jastip_session";

export async function sessionToken(): Promise<string> {
  const password = process.env.APP_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (!password || !secret) throw new Error("APP_PASSWORD / AUTH_SECRET belum di-set");
  const data = new TextEncoder().encode(`${secret}:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
