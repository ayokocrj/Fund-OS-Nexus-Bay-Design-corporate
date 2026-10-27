import { createServer } from "node:http";
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const rootDir = fileURLToPath(new URL("../", import.meta.url));
const coreSrcDir = path.join(rootDir, "artifacts/fund-os-core/src");

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const target = path.join(coreSrcDir, specifier.slice(2));
      for (const ext of ["", ".ts", ".tsx", "/index.ts"]) {
        if (existsSync(target + ext)) {
          return nextResolve(pathToFileURL(target + ext).href, context);
        }
      }
    }
    if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
      const parentPath = fileURLToPath(context.parentURL);
      const base = path.resolve(path.dirname(parentPath), specifier);
      for (const ext of ["", ".ts", ".tsx", "/index.ts"]) {
        if (existsSync(base + ext) && !base.endsWith(".js")) {
          const candidate = base + ext;
          if (existsSync(candidate)) {
            return nextResolve(pathToFileURL(candidate).href, context);
          }
        }
      }
    }
    return nextResolve(specifier, context);
  },
});

const { handleReadRequest, handleAskRequest } = await import("../artifacts/fund-os-core/src/domain/http-routes.ts");
const { getMemoryRuns } = await import("../artifacts/fund-os-core/src/domain/ledger.ts");
const { geminiApiKey, geminiModel, setRuntimeGeminiApiKey } = await import("../artifacts/fund-os-core/src/platform/secrets.ts");
const { listHinckleyModels } = await import("../artifacts/fund-os-core/src/domain/xlsx-reader.ts");

const port = Number(process.env.CORE_PORT ?? 24294);

const server = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Rate-Limit-Key, X-Gemini-Api-Key");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
  const pathname = url.pathname.replace(/^\/fof-os/, "");

  if (req.method === "GET" && (pathname === "/healthz" || pathname === "/api/core/ledger")) {
    const runs = getMemoryRuns();
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        mode: geminiApiKey() ? "live" : "local",
        model: geminiApiKey() ? geminiModel() : "mock-v2",
        hasApiKey: Boolean(geminiApiKey()),
        runsCount: runs.length,
        runs: runs.slice(-20),
      }),
    );
    return;
  }

  if (req.method === "GET" && pathname === "/growth-models") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ models: listHinckleyModels() }));
    return;
  }

  if (req.method === "POST" && pathname === "/api-key") {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    const key = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    setRuntimeGeminiApiKey(key || null);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        hasApiKey: Boolean(geminiApiKey()),
        mode: geminiApiKey() ? "live" : "local",
        model: geminiApiKey() ? geminiModel() : "mock-v2",
      }),
    );
    return;
  }

  if (req.method === "POST" && (pathname === "/read" || pathname === "/api/read" || pathname === "/api/core/read" || pathname === "/ask" || pathname === "/api/ask" || pathname === "/api/core/ask")) {
    try {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const bodyBuffer = Buffer.concat(chunks);
      const headers = new Headers();
      if (typeof req.headers["content-type"] === "string") {
        headers.set("content-type", req.headers["content-type"]);
      }
      if (typeof req.headers["x-rate-limit-key"] === "string") {
        headers.set("x-rate-limit-key", req.headers["x-rate-limit-key"]);
      }
      if (typeof req.headers["x-gemini-api-key"] === "string") {
        headers.set("x-gemini-api-key", req.headers["x-gemini-api-key"]);
      }
      const webReq = new Request(url.toString(), {
        method: "POST",
        headers,
        body: bodyBuffer,
      });

      const isRead = pathname.endsWith("/read");
      const webRes = isRead ? await handleReadRequest(webReq) : await handleAskRequest(webReq);
      const resText = await webRes.text();
      res.writeHead(webRes.status, {
        "content-type": webRes.headers.get("content-type") ?? "application/json",
      });
      res.end(resText);
    } catch (err) {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : "INTERNAL_ERROR" }));
    }
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "NOT_FOUND", path: pathname }));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Fund OS ModelGateway server listening on http://127.0.0.1:${port} (mode: ${geminiApiKey() ? `live · ${geminiModel()}` : "local · deterministic mock-v2"})`);
});
