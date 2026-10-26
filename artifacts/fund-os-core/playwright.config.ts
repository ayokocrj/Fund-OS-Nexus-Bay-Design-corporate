import { defineConfig } from "@playwright/test";
import { execFileSync } from "node:child_process";
const systemChromium = execFileSync("sh", ["-c", "command -v chromium || true"], { encoding: "utf8" }).trim();
export default defineConfig({
  testDir: "./tests/e2e", workers: 1, retries: 0,
  reporter: [["list"]],
  outputDir: "../../generated-artifacts/phase0/browser",
  use: {
    baseURL: process.env.PHASE0_TEST_URL ?? "http://127.0.0.1:24294", headless: true,
    launchOptions: systemChromium ? { executablePath: systemChromium, args: ["--no-sandbox"] } : {},
  },
});
