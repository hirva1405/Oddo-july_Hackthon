/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
    serverActions: { bodySizeLimit: "8mb" },
  },
};
