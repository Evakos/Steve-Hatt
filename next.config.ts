import type { NextConfig } from "next";

// Product images come from the WooCommerce media library. Derived from WOOCOMMERCE_URL rather
// than hardcoded, since that host isn't finalised yet (fresh WordPress instance still being
// provisioned - see the master plan, Phase A).
const wooHostname = process.env.WOOCOMMERCE_URL ? new URL(process.env.WOOCOMMERCE_URL).hostname : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: wooHostname
      ? [{ protocol: "https", hostname: wooHostname, pathname: "/wp-content/uploads/**" }]
      : [],
  },
  // Convenience shortcut to the real WordPress/WooCommerce backend's admin - the frontend and
  // backend are on separate domains, this just saves remembering/typing the backend's URL.
  async redirects() {
    if (!wooHostname) return [];
    return [
      {
        source: "/wp-admin",
        destination: `https://${wooHostname}/wp-admin`,
        permanent: false,
      },
      {
        source: "/wp-admin/:path*",
        destination: `https://${wooHostname}/wp-admin/:path*`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
