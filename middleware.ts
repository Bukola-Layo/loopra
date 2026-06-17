import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const { pathname } = req.nextUrl;

      if (pathname.startsWith("/api/auth")) return true;
      if (pathname.startsWith("/api/webhooks")) return true;
      if (pathname.startsWith("/api/embed")) return true;
      if (pathname.match(/^\/api\/forms\/[\w-]+\/submit$/)) return true;
      if (pathname.startsWith("/dashboard") && !token) return false;
      if (pathname.startsWith("/onboarding") && !token) return false;
      if (pathname.startsWith("/api") && !token) return false;

      return true;
    },
  },
});

export const config = {
  matcher: ["/f/:path*", "/dashboard/:path*", "/api/:path*", "/onboarding"],
};
 