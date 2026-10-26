import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
export async function scanSecrets() {
  const root = fileURLToPath(new URL("../../../../", import.meta.url));
  const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: root }).toString().split("\0").filter(Boolean);
  const patterns = [/sk-[a-zA-Z0-9]{24,}/, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, /AKIA[A-Z0-9]{16}/, /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/];
  const failures: string[] = [];
  for (const file of files) {
    if (!/\.(?:ts|tsx|js|mjs|json|ya?ml|md|txt|prisma|sql|toml|env)$/.test(file) || file.startsWith(".local/")) continue;
    const content = await readFile(path.join(root, file), "utf8").catch(() => "");
    if (patterns.some(pattern => pattern.test(content))) failures.push(file);
  }
  if (failures.length) throw new Error(`SECRET_PATTERN_DETECTED in: ${failures.join(", ")} (values redacted)`);
  return { scanned: files.length, detected: 0 };
}
