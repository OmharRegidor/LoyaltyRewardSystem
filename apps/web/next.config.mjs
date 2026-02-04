/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.noxaloyalty.com' }],
        destination: 'https://noxaloyalty.com/:path*',
        permanent: true,
      },
    ];
  },
}

export default nextConfig
