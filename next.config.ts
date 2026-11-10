import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async redirects() {
    return [
      { source: "/inversor/procesos", destination: "/procesos", permanent: false },
      { source: "/login", destination: "/entrar", permanent: false },
      { source: "/asesor", destination: "/asesores", permanent: false },
      { source: "/archivo", destination: "/", statusCode: 301 },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
