/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  webpack: (config) => {
    const root = path.resolve(process.cwd());
    const srcDir = path.join(root, "src");

    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": srcDir,
      "lib": path.join(srcDir, "lib"),
    };

    return config;
  },
};

module.exports = nextConfig;