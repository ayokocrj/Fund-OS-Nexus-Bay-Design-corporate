import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
export interface ObjectStore {
  putImmutable(bytes: Uint8Array): Promise<{ ref: string; hash: string }>;
  read(ref: string): Promise<Uint8Array>;
}
// Demo storage adapter only. No list/delete API or public upload surface.
export class FixtureObjectStore implements ObjectStore {
  constructor(private root = path.resolve(process.cwd(), "../../fixtures/vault")) {}
  async putImmutable(bytes: Uint8Array) {
    const hash = createHash("sha256").update(bytes).digest("hex");
    await mkdir(this.root, { recursive: true });
    const file = path.join(this.root, hash);
    try { await writeFile(file, bytes, { flag: "wx" }); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
    return { ref: `fixture:${hash}`, hash };
  }
  async read(ref: string) {
    if (!/^fixture:[a-f0-9]{64}$/.test(ref)) throw new Error("INVALID_OBJECT_REFERENCE");
    const bytes = await readFile(path.join(this.root, ref.slice(8)));
    if (createHash("sha256").update(bytes).digest("hex") !== ref.slice(8)) throw new Error("OBJECT_INTEGRITY_FAILURE");
    return bytes;
  }
}
