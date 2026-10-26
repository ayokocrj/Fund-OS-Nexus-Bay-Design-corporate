import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "prisma/migrations/20261026230327_core_integrity");
await mkdir(output, { recursive: true });
await copyFile(path.join(root, "prisma/migrations/20261026230326_agent_core/guards.sql"), path.join(output, "migration.sql"));
console.log("Generated integrity migration from reviewed SQL source.");
