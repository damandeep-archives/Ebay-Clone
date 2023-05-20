/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
      },
      reactStrictMode:false,
      images:{
        domains:['links.papareact.com']
      }
}

module.exports = nextConfig
