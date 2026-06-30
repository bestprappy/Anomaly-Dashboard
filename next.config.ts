import type { NextConfig } from "next";

const repo = "Anomaly-Dashboard";
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // Static HTML export so the site can be served from GitHub Pages.
  output: "export",
  // GitHub Pages serves the project site under /<repo>/.
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
