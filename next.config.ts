import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/s3/:path*',
        destination: `${process.env.S3_ENDPOINT || 'http://minio:9000'}/:path*`,
      },
    ]
  },
};

export default nextConfig;
