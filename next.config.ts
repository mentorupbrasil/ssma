import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/empresas", destination: "/blog", permanent: true },
      { source: "/empresas/:path*", destination: "/blog", permanent: true },
      { source: "/atualizacoes", destination: "/blog", permanent: true },
      { source: "/atualizacoes/:slug", destination: "/blog/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
