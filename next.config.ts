import type { NextConfig } from "next";
import { BACKEND_VERSION } from "./src/lib/versions";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "X-App-Version", value: BACKEND_VERSION }],
      },
    ];
  },
};

export default nextConfig;
