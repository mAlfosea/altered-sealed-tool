/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  webpack: (config, { defaultLoaders }) => {
    const root = path.resolve(__dirname);
    const srcDir = path.join(root, "src");

    // Alias @ vers src (fallback si resolve.modules insuffisant)
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": srcDir,
    };

    // Résolution depuis src/ en priorité (fonctionne en Docker / build Git)
    config.resolve.modules = [
      srcDir,
      "node_modules",
      ...(config.resolve.modules || []),
    ];

    return config;
  },
};

module.exports = nextConfig;