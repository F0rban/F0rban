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
    // Every route becomes `x/index.html` + `x/index.txt`, which is what a
    // directory-serving host expects. Without it the client asks for
    // `/F0rban.txt` for the root route (a 404 on every page load) and a folder
    // of dynamic pages such as `duels/` can shadow its sibling `duels.html`.
    trailingSlash: true,
  }),
};

export default nextConfig;
