import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
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
