const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@menuos/db", "@menuos/shared"],
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  serverExternalPackages: ["sharp", "pdf-parse"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Next.js bundles polyfill-module unconditionally (~12 KiB Array.at, Object.hasOwn, etc.).
  // MenuOS targets modern mobile browsers only — see browserslist in package.json.
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "../build/polyfills/polyfill-module": false,
        "next/dist/build/polyfills/polyfill-module": false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
