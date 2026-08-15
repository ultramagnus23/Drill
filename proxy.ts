import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Proxy runs on the Node.js runtime by default as of Next 16, so this can
// genuinely validate the session against the database rather than just
// checking whether a cookie is present.
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "drill_session";
const PUBLIC_PATHS = ["/login", "/signup"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_PATHS.includes(pathname)
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token
    ? await prisma.authSession.findUnique({ where: { token } }).catch(() => null)
    : null;

  if (!session || session.expiresAt < new Date()) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|topics.json).*)"],
};
