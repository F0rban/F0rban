import type { NextConfig } from "next";

// Set only for the static preview build (GitHub Pages has no Node runtime,
// so that build exports plain HTML instead of the normal hybrid output).
// Unset — the default — this is identical to before; nothing about how the
// app runs, builds, or is served elsewhere changes.
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
    ],
  },
  ...(staticExport && {
    output: "export",
    basePath: "/F0rban",
    images: { unoptimized: true },
  }),
};

export default nextConfig;
