import type { NextConfig } from "next";

// When building for GitHub Pages we produce a fully static export.
// Local/dev and full-stack builds keep the API rewrite proxy.
const isPages = process.env.GITHUB_PAGES === "true";
const repo = "amit33-design"; // project repo → served at /<repo>/

const nextConfig: NextConfig = isPages
  ? {
      output: "export",
      basePath: `/${repo}`,
      assetPrefix: `/${repo}/`,
      images: { unoptimized: true },
      trailingSlash: true,
    }
  : {
      async rewrites() {
        return [
          {
            source: "/api/v1/:path*",
            destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/:path*`,
          },
        ];
      },
    };

export default nextConfig;
