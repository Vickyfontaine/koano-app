/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Cluster 1 restructure: Homeowners → Community
      { source: '/for/homeowners', destination: '/for/community', permanent: true },
      // The standalone /community page merged into /for/community
      { source: '/community', destination: '/for/community', permanent: true },
      // Request-access waitlist retired → self-serve Clerk signup
      { source: '/early-access', destination: '/signup', permanent: true },
    ];
  },
  transpilePackages: [
    "three",
    "@react-three/fiber",
    "@react-three/drei",
    "@react-three/postprocessing",
    "postprocessing",
  ],
};

export default nextConfig;
