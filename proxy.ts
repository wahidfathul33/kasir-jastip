import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, safeEqual, sessionToken } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/login") return NextResponse.next();

  const cookie = req.cookies.get(COOKIE)?.value;
  if (cookie && safeEqual(cookie, await sessionToken())) return NextResponse.next();

  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
