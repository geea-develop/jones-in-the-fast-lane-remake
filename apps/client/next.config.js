/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  transpilePackages: ["@jones/shared"],
  agentRules: false,
};

module.exports = nextConfig;
