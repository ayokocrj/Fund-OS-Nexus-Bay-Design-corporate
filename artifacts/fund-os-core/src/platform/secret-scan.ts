import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

async function listCandidateFiles(root: string): Promise<string[]> {
  try {
    return execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
      cwd: root,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .split("\0")
      .filter(Boolean);
  } catch {
    const entries = await readdir(root, { recursive: true, withFileTypes: true });
    return entries
      .filter(entry => entry.isFile())
      .map(entry => path.relative(root, path.join(entry.parentPath ?? root, entry.name)).replace(/\\/g, "/"))
      .filter(rel => !rel.startsWith("node_modules/") && !rel.includes("/node_modules/") && !rel.startsWith(".git/") && !rel.includes("/.next/") && !rel.includes("/dist/"));
  }
}

export async function scanSecrets() {
  const root = fileURLToPath(new URL("../../../../", import.meta.url));
  const files = await listCandidateFiles(root);
  const patterns = [/sk-[a-zA-Z0-9]{24,}/, /AIza[0-9A-Za-z\-_]{35}/, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, /AKIA[A-Z0-9]{16}/, /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/];
  const failures: string[] = [];
  for (const file of files) {
    if (!/\.(?:ts|tsx|js|mjs|json|ya?ml|md|txt|prisma|sql|toml|env)$/.test(file) || file.startsWith(".local/")) continue;
    const content = await readFile(path.join(root, file), "utf8").catch(() => "");
    if (patterns.some(pattern => pattern.test(content))) failures.push(file);
  }
  if (failures.length) throw new Error(`SECRET_PATTERN_DETECTED in: ${failures.join(", ")} (values redacted)`);
  return { scanned: files.length, detected: 0 };
}
