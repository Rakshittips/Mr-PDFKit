import type {NextConfig} from 'next';

const repoName = process.env.GITHUB_REPOSITORY
  ? process.env.GITHUB_REPOSITORY.split('/')[1]
  : '';
const isUserPage = repoName.toLowerCase().endsWith('.github.io');
const autoBasePath =
  process.env.GITHUB_ACTIONS && repoName && !isUserPage ? `/${repoName}` : '';
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || autoBasePath || '';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  // Allow access to remote image placeholder.
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  output: 'export',
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify - file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
