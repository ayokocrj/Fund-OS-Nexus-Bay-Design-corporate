import { spawn } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { scanSecrets } from "../artifacts/fund-os-core/src/platform/secret-scan";
const root = fileURLToPath(new URL("../", import.meta.url));
const cwd = `${root}/artifacts/fund-os-core`;
const outputDir = `${root}/generated-artifacts/phase0`;
let output = "Fund OS Agent Edition | Phase 0 complete test output\n";
let failed = false;
async function run(command: string, args: string[]) {
  const title = `\n$ ${command} ${args.join(" ")}\n`;
  output += title; process.stdout.write(title);
  const code = await new Promise<number>(resolve => {
    const child = spawn(command, args, { cwd, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
    for (const stream of [child.stdout, child.stderr]) stream.on("data", chunk => { output += String(chunk); process.stdout.write(chunk); });
    child.on("error", error => { output += error.message; resolve(1); });
    child.on("close", code => resolve(code ?? 1));
  });
  if (code !== 0) failed = true;
}
try {
  const scan = await scanSecrets(); output += `Secret scan: ${scan.scanned} candidate files, 0 detected.\n`;
  console.log(`Secret scan: ${scan.scanned} candidate files, 0 detected.`);
} catch (error) { output += String(error) + "\n"; failed = true; }
await run("pnpm", ["exec", "tsc", "-p", "tsconfig.test.json", "--noEmit"]);
await run("pnpm", ["exec", "vitest", "run", "--config", "vitest.config.ts"]);
await run("pnpm", ["exec", "playwright", "test", "--config", "playwright.config.ts"]);
output += `\nPhase 0 result: ${failed ? "FAILED" : "PASSED"}\n`;
console.log(`\nPhase 0 result: ${failed ? "FAILED" : "PASSED"}`);
await mkdir(outputDir, { recursive: true });
await writeFile(`${outputDir}/test-output.txt`, output);
process.exitCode = failed ? 1 : 0;
