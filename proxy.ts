import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Next.js 16 route protection (replaces middleware.ts).
// Refreshes the Supabase session on every request (required so server
// components downstream get a valid, non-expired auth cookie) and enforces
// the ADMIN/CUSTOMER route boundary.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: getUser() (not getSession()) — it revalidates against the
  // Supabase Auth server instead of trusting the local cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: "ADMIN" | "CUSTOMER" | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? null;
  }

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === "/login";
  const isAdmin = pathname.startsWith("/admin");
  const isCustomer = pathname.startsWith("/customer");

  if (pathname === "/") {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.redirect(
      new URL(role === "ADMIN" ? "/admin/dashboard" : "/customer/dashboard", request.url),
    );
  }

  if (isAuthPage) {
    if (user) {
      return NextResponse.redirect(
        new URL(role === "ADMIN" ? "/admin/dashboard" : "/customer/dashboard", request.url),
      );
    }
    return response;
  }

  if (isAdmin) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/customer/dashboard", request.url));
    }
    return response;
  }

  if (isCustomer) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role !== "CUSTOMER") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return response;
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
