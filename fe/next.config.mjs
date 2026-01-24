/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ypp.co.id',
      },
      {
        protocol: 'https',
        hostname: 'img.jakpost.net',
      },
      {
        protocol: 'https',
        hostname: 'cdn.antaranews.com',
      },
      {
        protocol: 'https',
        hostname: 'waterwellsforafrica.org',
      },
      {
        protocol: 'https',
        hostname: 'images.hindustantimes.com',
      },
      {
        protocol: 'https',
        hostname: 'orphanlifefoundation.org',
      },
      {
        protocol: 'https',
        hostname: 'www.globalgiving.org',
      },
      {
        protocol: 'https',
        hostname: 'widophfoundation.org',
      },
      {
        protocol: 'https',
        hostname: 'iwifoundation.org',
      },
      {
        protocol: 'https',
        hostname: 'ychef.files.bbci.co.uk',
      },
    ],
  },
}

export default nextConfig
