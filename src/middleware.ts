import { NextResponse, type NextRequest } from "next/server";
import { wwwRedirectTarget } from "@/lib/www-redirect";

export function middleware(request: NextRequest) {
  const int = process.env["INT_ENVIRONMENT"] === "true";
  const target = wwwRedirectTarget(
    int,
    request.headers.get("host"),
    request.nextUrl.pathname,
    request.nextUrl.search,
  );
  if (target === null) {
    return NextResponse.next();
  }

  return NextResponse.redirect(target, 301);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|og.jpg).*)"],
};
