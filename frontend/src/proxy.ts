import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "hf_session";

/** Routes that require a signed-in user. The API re-checks every request; this is an optimistic gate. */
const protectedPrefixes = ["/generate", "/edit", "/history", "/projects", "/settings"];
const authPages = ["/login", "/signup"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (authPages.includes(pathname) && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/generate/image";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Router prefetches are excluded via `missing`: a redirected segment prefetch surfaces
// as a console 404, and RequireAuth already guards the page client-side.
// (The matcher must be statically analysable, hence the repetition.)
export const config = {
  matcher: [
    { source: "/generate/:path*", missing: [{ type: "header", key: "next-router-prefetch" }] },
    { source: "/edit/:path*", missing: [{ type: "header", key: "next-router-prefetch" }] },
    { source: "/history/:path*", missing: [{ type: "header", key: "next-router-prefetch" }] },
    { source: "/projects/:path*", missing: [{ type: "header", key: "next-router-prefetch" }] },
    { source: "/settings/:path*", missing: [{ type: "header", key: "next-router-prefetch" }] },
    { source: "/login", missing: [{ type: "header", key: "next-router-prefetch" }] },
    { source: "/signup", missing: [{ type: "header", key: "next-router-prefetch" }] },
  ],
};
