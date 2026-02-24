/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  webpack: (config) => {
    const src = path.join(__dirname, "src");
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": src,
      "lib": path.join(src, "lib"),
      "store": path.join(src, "store"),
      "components": path.join(src, "components"),
    };
    return config;
  },
};

module.exports = nextConfig;
