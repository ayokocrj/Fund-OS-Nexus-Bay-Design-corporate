import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
const root = fileURLToPath(new URL("../", import.meta.url));
const output = `${root}/generated-artifacts/export`;
await mkdir(output, { recursive: true });
// Portable source bundle. Docker image building is an external CI step, not
// attempted inside Replit's non-container workspace.
const files = ["Dockerfile", ".dockerignore", "package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "tsconfig.base.json", "tsconfig.json", "artifacts/fund-os-core", "lib", "scripts", "prisma", "fixtures", "docs"];
const result = spawnSync("tar", ["--exclude=node_modules", "--exclude=.next", "--exclude=dist", "--exclude=.tsbuildinfo", "-czf", `${output}/fund-os-phase0.tar.gz`, ...files], { cwd: root, encoding: "utf8" });
if (result.status !== 0) throw new Error(result.stderr);
const bytes = await readFile(`${output}/fund-os-phase0.tar.gz`);
const manifest = { artifact: "fund-os-phase0.tar.gz", sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length, synthetic: true, containerBuiltInWorkspace: false };
await writeFile(`${output}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));
