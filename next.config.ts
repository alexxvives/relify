import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  agentRules: false,
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async redirects() {
    return [
      { source: "/inversor/procesos", destination: "/procesos", permanent: false },
      { source: "/login", destination: "/entrar", permanent: false },
      { source: "/asesor", destination: "/asesores", permanent: false },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
      allowedOrigins: ["itsrelify.com", "www.itsrelify.com"],
    },
  },
};

export default nextConfig;
