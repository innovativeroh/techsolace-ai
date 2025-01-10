/** @type {import('next').NextConfig} */
const nextConfig = {
    // Rewrites to handle CORS by proxying through Next.js
    async rewrites() {
      return [
        {
          source: '/api/:path*', // Local route on your Next.js app
          destination: 'https://api.langflow.astra.datastax.com/:path*', // External API
        },
      ];
    },
  
    // Headers to add additional configurations (e.g., Authorization)
    async headers() {
      return [
        {
          source: '/api/:path*',
          headers: [
            { key: 'Authorization', value: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}` },
            { key: 'Content-Type', value: 'application/json' },
          ],
        },
      ];
    },
  };
  
  export default nextConfig;
  