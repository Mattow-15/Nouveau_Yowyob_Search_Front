/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Redirige les appels backend vers le gateway Next.js (qui ajoute les auth headers).
  // Permet au frontend local de taper sur le backend déployé sans exposer les clés API.
  async rewrites() {
    return [
      { source: '/api/search/:path*', destination: '/api/gateway/api/search/:path*' },
      { source: '/api/users/:path*',  destination: '/api/gateway/api/users/:path*' },
      { source: '/api/index/:path*',  destination: '/api/gateway/api/index/:path*' },
    ];
  },
  
  // Images
  images: {
    domains: [
      'localhost',
      'api-services.yowyob.com',
      'maps.googleapis.com',
      'lh3.googleusercontent.com',
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Variables d'environnement
  env: {
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },

  // Webpack config (pour DuckDB)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;