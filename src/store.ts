import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Target } from "./types.js";
import { err, ok, type Result } from "./result.js";

export type StoreFile = {
  version: 1;
  targets: Target[];
};

export class TargetStore {
  private memory = new Map<string, Target>();
  private loaded = false;

  constructor(private readonly filePath?: string) {}

  get path(): string | undefined {
    return this.filePath;
  }

  async ensureLoaded(): Promise<Result<void>> {
    if (this.loaded) return ok(undefined);
    this.loaded = true;
    if (!this.filePath) return ok(undefined);
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as StoreFile;
      if (parsed && Array.isArray(parsed.targets)) {
        for (const target of parsed.targets) {
          this.memory.set(target.id, target);
        }
      }
      return ok(undefined);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT") return ok(undefined);
      return err("STORE_ERROR", `Could not read store at ${this.filePath}`, String(error));
    }
  }

  async persist(): Promise<Result<void>> {
    if (!this.filePath) return ok(undefined);
    try {
      await mkdir(path.dirname(this.filePath), { recursive: true });
      const body: StoreFile = { version: 1, targets: this.listSync() };
      await writeFile(this.filePath, `${JSON.stringify(body, null, 2)}\n`, "utf8");
      return ok(undefined);
    } catch (error) {
      return err("STORE_ERROR", `Could not write store at ${this.filePath}`, String(error));
    }
  }

  upsertSync(targets: Target[]): Target[] {
    for (const target of targets) {
      this.memory.set(target.id, target);
    }
    return targets;
  }

  listSync(): Target[] {
    return [...this.memory.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  getSync(id: string): Target | undefined {
    return this.memory.get(id);
  }
}

const cache = new Map<string, TargetStore>();

export function getStore(storePath?: string): TargetStore {
  const key = storePath ?? ":memory:";
  const existing = cache.get(key);
  if (existing) return existing;
  const store = new TargetStore(storePath);
  cache.set(key, store);
  return store;
}

export function resetStoreCache(): void {
  cache.clear();
}
