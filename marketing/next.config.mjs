import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withSentryConfig(nextConfig, {
  org: "bishbosh-ventures-ltd",
  project: "beach",
  silent: !process.env.CI,
});
