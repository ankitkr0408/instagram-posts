import { defineConfig } from "@playwright/test";

const port = 3200;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  workers: 1,
  use: { baseURL: `http://localhost:${port}`, trace: "retain-on-failure" },
  webServer: {
    command: "npx tsx scripts/e2e-server.ts",
    url: `http://localhost:${port}/api/health`,
    timeout: 120_000,
    reuseExistingServer: false,
    env: { E2E_PORT: String(port) },
  },
});
