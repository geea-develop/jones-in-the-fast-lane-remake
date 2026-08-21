/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  transpilePackages: ["@jones/shared"],
};

module.exports = nextConfig;
