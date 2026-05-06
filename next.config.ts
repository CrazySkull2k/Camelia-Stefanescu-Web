import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const remotePatterns: NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> = [];

if (supabaseUrl) {
  const url = new URL(supabaseUrl);
  const protocol = url.protocol.replace(":", "");

  if (protocol === "http" || protocol === "https") {
    remotePatterns.push({
      protocol,
      hostname: url.hostname,
      port: url.port || "",
      pathname: "/storage/v1/object/public/**",
    });
  }
}

remotePatterns.push({
  protocol: "https",
  hostname: "lh3.googleusercontent.com",
  pathname: "/**",
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    sri: {
      algorithm: "sha256",
    },
  },
  images: {
    remotePatterns,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          destination: "/servicii-nutritie",
          source: "/serviciunutritie",
        },
      ],
    };
  },
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/about.html", destination: "/about", permanent: true },
      { source: "/contact.html", destination: "/contact", permanent: true },
      { source: "/preturi.html", destination: "/preturi", permanent: true },
      { source: "/serviciinutritie.html", destination: "/serviciinutritie", permanent: true },
      { source: "/stopdieta.html", destination: "/stopdieta", permanent: true },
      { source: "/detox.html", destination: "/detox", permanent: true },
      {
        source: "/tshockwave.html",
        destination: "/terapie-shockwave/ce-este-terapia-shockwave",
        permanent: true,
      },
      {
        source: "/tratamentshockwave.html",
        destination: "/terapie-shockwave/ce-putem-trata",
        permanent: true,
      },
      {
        source: "/modtratament.html",
        destination: "/terapie-shockwave/mod-tratament",
        permanent: true,
      },
      { source: "/diagnozacel.html", destination: "/diagnozacel", permanent: true },
      { source: "/termeni.html", destination: "/termeni", permanent: true },
      { source: "/blog.php", destination: "/blog", permanent: true },
      {
        source: "/blog_details.php",
        has: [{ type: "query", key: "slug" }],
        destination: "/blog/:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
