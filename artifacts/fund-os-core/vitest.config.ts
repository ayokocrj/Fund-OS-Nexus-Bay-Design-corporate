import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { include: ["tests/core.test.ts"], fileParallelism: false, testTimeout: 30000, hookTimeout: 30000, reporters: ["verbose"] },
});
