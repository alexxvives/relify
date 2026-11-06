import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  async redirects() {
    return [
      { source: "/inversor/procesos", destination: "/procesos", permanent: false },
      { source: "/login", destination: "/entrar", permanent: false },
      { source: "/asesor", destination: "/asesores", permanent: false },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
