/** @type {import('next').NextConfig} */
const nextConfig = {
  // The env block below was causing issues with parsing the service account key.
  // Next.js automatically loads variables from .env.local for server-side use,
  // so this block is not necessary and was removed.
}

module.exports = nextConfig