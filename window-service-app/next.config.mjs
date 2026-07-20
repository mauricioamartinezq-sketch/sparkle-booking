// GitHub Pages serves project sites at https://USERNAME.github.io/REPO_NAME/
// so the app needs to know its base path at build time. The deploy workflow
// sets NEXT_PUBLIC_BASE_PATH="/REPO_NAME" automatically — see
// .github/workflows/deploy.yml. Leave it unset for local dev (served at /).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",       // static export — no Node server, works on GitHub Pages
  trailingSlash: true,    // GitHub Pages serves /booking/index.html, not /booking
  basePath,
  images: {
    unoptimized: true,    // static export can't run the Next.js image optimizer
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
