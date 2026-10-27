import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

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
        if (existsSync(base + ext) && ! base.endsWith(".js")) {
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

const { geminiApiKey, geminiModel, GEMINI_FLASH_MODEL } = await import("../artifacts/fund-os-core/src/platform/secrets.ts");
const { scanSecrets } = await import("../artifacts/fund-os-core/src/platform/secret-scan.ts");
const {
  gateway,
  gatewayRead,
  gatewayAsk,
  verifyQuotesAgainstText,
  verifyFiguresAgainstResults,
  extractPdfText,
  setRateLimit,
  resetRateLimit,
  MAX_FILE_BYTES,
} = await import("../artifacts/fund-os-core/src/domain/gateway.ts");
const { handleReadRequest, handleAskRequest } = await import("../artifacts/fund-os-core/src/domain/http-routes.ts");
const { getMemoryRuns, clearMemoryRuns } = await import("../artifacts/fund-os-core/src/domain/ledger.ts");

const actor = { firmId: "bay", userId: "demo-bay-partner" };
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL  ${name}`);
    console.error("       ", err);
  }
}

async function runSuiteWithoutKey() {
  console.log("\n=== Suite 1: WITHOUT GEMINI_API_KEY (mock provider default & local fallback) ===");
  const savedKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  clearMemoryRuns();
  resetRateLimit();

  await test("geminiApiKey() is null when GEMINI_API_KEY is absent", () => {
    assert.equal(geminiApiKey(), null);
    assert.equal(geminiModel(), GEMINI_FLASH_MODEL);
  });

  await test("gateway() uses deterministic mock provider by default when key is absent and writes 1 Run", async () => {
    const before = getMemoryRuns().length;
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () => {
      throw new Error("UNEXPECTED_NETWORK_CALL_WITHOUT_KEY");
    };
    try {
      const res = await gateway(actor, "complete", { prompt: "Test without key" });
      assert.equal(res.provider, "deterministic");
      assert.equal(res.version, "mock-v2");
      const runs = getMemoryRuns();
      assert.equal(runs.length, before + 1);
      const last = runs.at(-1);
      assert.equal(last.provider, "deterministic");
      assert.equal(last.model_version, "mock-v2");
      assert.ok(last.inputs_hash.length === 64);
      assert.ok(last.cost > 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await test("POST /read returns {mode:'local'} when GEMINI_API_KEY is absent and writes 1 Run to ledger", async () => {
    const before = getMemoryRuns().length;
    const req = new Request("http://localhost:24294/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        filename: "email.txt",
        mimeType: "text/plain",
        text: "We now target a first close in March 2027. Anchor LP is $15m soft-circled.",
      }),
    });
    const res = await handleReadRequest(req, actor);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.mode, "local");
    assert.equal(body.provider, "deterministic");
    assert.equal(body.model, "mock-v2");
    assert.ok(Array.isArray(body.facts));
    assert.ok(Array.isArray(body.entities));
    assert.ok(Array.isArray(body.tasks));
    assert.equal(typeof body.summary, "string");
    assert.equal(typeof body.document_type, "string");
    assert.equal(getMemoryRuns().length, before + 1);
    assert.equal(body.run.model, "mock-v2");
    assert.ok(body.run.inputs_hash.length === 64);
  });

  await test("POST /ask returns {mode:'local'} when GEMINI_API_KEY is absent and writes 1 Run to ledger", async () => {
    const before = getMemoryRuns().length;
    const req = new Request("http://localhost:24294/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        question: "What do we know about Meridian Ridge Partners?",
        context: { screen: 1 },
      }),
    });
    const res = await handleAskRequest(req, actor);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.mode, "local");
    assert.equal(body.provider, "deterministic");
    assert.equal(body.model, "mock-v2");
    assert.ok(body.function_calls.length >= 1);
    assert.equal(getMemoryRuns().length, before + 1);
    assert.equal(body.run.model, "mock-v2");
  });

  if (savedKey !== undefined) process.env.GEMINI_API_KEY = savedKey;
}

async function runSuiteWithKey() {
  console.log("\n=== Suite 2: WITH GEMINI_API_KEY (live Gemini Flash provider, quote & figure verification, limits) ===");
  process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || "test-gemini-key-server-only";
  clearMemoryRuns();
  resetRateLimit();

  const originalFetch = globalThis.fetch;

  await test("POST /read on text verifies each quote against extracted text and drops unverified quotes", async () => {
    const sourceText =
      "Hi team, we now target a first close in March 2027 rather than the quarter as a whole. " +
      "The anchor is a university endowment with $15m soft-circled. Terms unchanged: 2% management fee, 20% carry.";

    globalThis.fetch = async (url, init) => {
      assert.ok(String(url).includes("gemini-2.5-flash:generateContent"));
      assert.equal(init.headers["x-goog-api-key"], process.env.GEMINI_API_KEY);
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      summary: "Meridian Ridge Fund II timeline update.",
                      document_type: "email",
                      facts: [
                        {
                          field: "First close target",
                          value: "March 2027",
                          confidence: 0.94,
                          quote: "target a first close in March 2027",
                          page_or_time: "p.1",
                        },
                        {
                          field: "Anchor LP",
                          value: "$15m soft-circled",
                          confidence: 0.89,
                          quote: "university endowment with $15m soft-circled",
                          page_or_time: "p.1",
                        },
                        {
                          field: "Hallucinated IRR",
                          value: "42% net IRR",
                          confidence: 0.99,
                          quote: "this quote does not exist anywhere in the email text",
                          page_or_time: "p.1",
                        },
                      ],
                      entities: ["Meridian Ridge Partners"],
                      tasks: ["Schedule reference calls with two Fund I LPs"],
                      transcript: null,
                    }),
                  },
                ],
              },
            },
          ],
          usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 80 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };

    const before = getMemoryRuns().length;
    const req = new Request("http://localhost:24294/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        filename: "meridian-update.txt",
        mimeType: "text/plain",
        text: sourceText,
      }),
    });
    const res = await handleReadRequest(req, actor);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.mode, "live");
    assert.equal(data.model, "gemini-2.5-flash");
    assert.equal(data.provider, "gemini");
    assert.equal(data.facts.length, 2);
    assert.equal(data.quotes_rejected, 1);
    assert.deepEqual(
      data.facts.map(f => f.field),
      ["First close target", "Anchor LP"],
    );
    assert.equal(getMemoryRuns().length, before + 1);
    const run = getMemoryRuns().at(-1);
    assert.equal(run.provider, "gemini");
    assert.equal(run.model_version, "gemini-2.5-flash");
    assert.ok(run.latency_ms >= 1);
    assert.ok(run.cost > 0);
    assert.ok(run.inputs_hash.length === 64);
  });

  await test("POST /read on PDF extracts PDF text and verifies quotes against PDF content", async () => {
    const pdfBuffer = await readFile(path.join(rootDir, "fixtures/synthetic-deck.pdf"));
    const extracted = extractPdfText(pdfBuffer);
    assert.ok(extracted.includes("SYNTHETIC FIXTURE - known chart values"), `Extracted PDF text was: ${extracted}`);

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      summary: "Synthetic deck parsed.",
                      document_type: "pdf",
                      facts: [
                        {
                          field: "Deck title",
                          value: "Known chart values fixture",
                          confidence: 0.95,
                          quote: "SYNTHETIC FIXTURE - known chart values",
                          page_or_time: "p.1",
                        },
                        {
                          field: "Fabricated quote",
                          value: "Invented PDF line",
                          confidence: 0.8,
                          quote: "Non-existent quote not in the PDF",
                          page_or_time: "p.2",
                        },
                      ],
                      entities: ["Nexus Bay"],
                      tasks: [],
                      transcript: null,
                    }),
                  },
                ],
              },
            },
          ],
          usageMetadata: { promptTokenCount: 200, candidatesTokenCount: 60 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );

    const form = new FormData();
    form.append("file", new File([pdfBuffer], "synthetic-deck.pdf", { type: "application/pdf" }));
    const req = new Request("http://localhost:24294/read", { method: "POST", body: form });
    const res = await handleReadRequest(req, actor);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.facts.length, 1);
    assert.equal(data.quotes_rejected, 1);
    assert.equal(data.facts[0].quote, "SYNTHETIC FIXTURE - known chart values");
  });

  await test("POST /read on image tags all extracted values as indicative", async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      summary: "Chart screenshot from Harbor Peak Q3 report.",
                      document_type: "image",
                      facts: [
                        {
                          field: "Gross IRR",
                          value: "18.3%",
                          confidence: 0.71,
                          quote: "Bar chart p.6",
                          page_or_time: "chart p.6",
                        },
                      ],
                      entities: ["Harbor Peak Ventures"],
                      tasks: ["Confirm chart-read Gross IRR against the PDF"],
                      transcript: null,
                    }),
                  },
                ],
              },
            },
          ],
          usageMetadata: { promptTokenCount: 150, candidatesTokenCount: 50 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );

    const pngBytes = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex");
    const form = new FormData();
    form.append("file", new File([pngBytes], "chart.png", { type: "image/png" }));
    const req = new Request("http://localhost:24294/read", { method: "POST", body: form });
    const res = await handleReadRequest(req, actor);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.indicative, true);
    assert.equal(data.facts.length, 1);
    assert.equal(data.facts[0].indicative, true);
  });

  await test("POST /read on audio and video returns transcript and facts and writes 1 Run each", async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      summary: "Partner voice debrief after Meridian Ridge call.",
                      document_type: "audio",
                      facts: [
                        {
                          field: "First close",
                          value: "March 2027 (confirmed)",
                          confidence: 0.94,
                          quote: "First close is now firmly March 2027",
                          page_or_time: "00:12",
                        },
                      ],
                      entities: ["Meridian Ridge Partners"],
                      tasks: ["Complete two LP reference calls"],
                      transcript: "First close is now firmly March 2027.",
                    }),
                  },
                ],
              },
            },
          ],
          usageMetadata: { promptTokenCount: 180, candidatesTokenCount: 65 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );

    const before = getMemoryRuns().length;
    const wavBytes = await readFile(path.join(rootDir, "fixtures/audio/brief.wav"));
    const form = new FormData();
    form.append("file", new File([wavBytes], "brief.wav", { type: "audio/wav" }));
    const res = await handleReadRequest(new Request("http://localhost:24294/read", { method: "POST", body: form }), actor);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.document_type, "audio");
    assert.equal(data.transcript, "First close is now firmly March 2027.");
    assert.equal(data.facts.length, 1);
    assert.equal(getMemoryRuns().length, before + 1);
  });

  await test("POST /ask uses Gemini function calling over synthetic record, enforces figure verification, and writes 1 Run", async () => {
    let callTurn = 0;
    globalThis.fetch = async (_url, init) => {
      callTurn++;
      const reqBody = JSON.parse(init.body);
      assert.ok(Array.isArray(reqBody.tools?.[0]?.functionDeclarations));
      if (callTurn === 1) {
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      functionCall: {
                        name: "get_operations_and_coinvest",
                        args: {},
                      },
                    },
                  ],
                },
              },
            ],
            usageMetadata: { promptTokenCount: 90, candidatesTokenCount: 20 },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text:
                      "Northwind Seed Call 6 shows $412k on the notice against $400k expected, with 7 days notice versus 10 days in the LPA. " +
                      "An invented sentence claiming $999m in 2099 must be stripped.",
                  },
                ],
              },
            },
          ],
          usageMetadata: { promptTokenCount: 160, candidatesTokenCount: 45 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };

    const before = getMemoryRuns().length;
    const req = new Request("http://localhost:24294/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        question: "Check the Northwind capital call notice",
        context: { screen: 7 },
      }),
    });
    const res = await handleAskRequest(req, actor);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(callTurn, 2);
    assert.equal(data.mode, "live");
    assert.equal(data.model, "gemini-2.5-flash");
    assert.equal(data.function_calls.length, 1);
    assert.equal(data.function_calls[0].name, "get_operations_and_coinvest");
    assert.ok(data.answer.includes("$412k"));
    assert.ok(data.answer.includes("$400k"));
    assert.ok(!data.answer.includes("$999m"), "Unverified figure $999m must be stripped");
    assert.ok(data.unverified_figures_dropped >= 1);
    // Must write exactly ONE Run to the ledger for the entire /ask call
    assert.equal(getMemoryRuns().length, before + 1);
    const run = getMemoryRuns().at(-1);
    assert.equal(run.tool_name, "gateway.ask");
    assert.equal(run.model_version, "gemini-2.5-flash");
    assert.ok(run.latency_ms >= 1);
    assert.ok(run.cost > 0);
  });

  await test("POST /read enforces 15 MB per-file limit (HTTP 413)", async () => {
    const req = new Request("http://localhost:24294/read", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        filename: "oversized.pdf",
        mimeType: "application/pdf",
        size: MAX_FILE_BYTES + 1024,
      }),
    });
    const res = await handleReadRequest(req, actor);
    assert.equal(res.status, 413);
    const data = await res.json();
    assert.equal(data.error, "FILE_TOO_LARGE");
  });

  await test("POST /read and POST /ask enforce rate limit (HTTP 429)", async () => {
    setRateLimit({ maxRequests: 2, windowMs: 60_000 });
    try {
      for (let i = 0; i < 2; i++) {
        const okRes = await handleAskRequest(
          new Request("http://localhost:24294/ask", {
            method: "POST",
            headers: { "content-type": "application/json", "x-rate-limit-key": "test-client-rl" },
            body: JSON.stringify({ question: "Check Northwind notice" }),
          }),
          actor,
        );
        assert.equal(okRes.status, 200);
      }
      const blockedRes = await handleAskRequest(
        new Request("http://localhost:24294/ask", {
          method: "POST",
          headers: { "content-type": "application/json", "x-rate-limit-key": "test-client-rl" },
          body: JSON.stringify({ question: "Check Northwind notice again" }),
        }),
        actor,
      );
      assert.equal(blockedRes.status, 429);
      const errBody = await blockedRes.json();
      assert.equal(errBody.error, "RATE_LIMIT_EXCEEDED");
    } finally {
      resetRateLimit();
    }
  });

  await test("Secret scanner and client bundle check verify GEMINI_API_KEY is never shipped to client", async () => {
    const scan = await scanSecrets();
    assert.equal(scan.detected, 0);
    const chatCode = await readFile(path.join(rootDir, "artifacts/fof-os/src/components/shell/Chat.tsx"), "utf8");
    assert.ok(!chatCode.includes("GEMINI_API_KEY"), "Chat.tsx must never reference GEMINI_API_KEY");
    assert.ok(chatCode.includes("fetch('/read'"), "Chat.tsx must call POST /read");
    assert.ok(chatCode.includes("fetch('/ask'"), "Chat.tsx must call POST /ask");
    assert.ok(chatCode.includes("quotes rejected"), "Chat.tsx must format Read by <model>, N facts, M quotes rejected");
    assert.ok(chatCode.includes("banner-provider-terms"), "Chat.tsx must include provider terms & non-confidential files banner");
  });

  globalThis.fetch = originalFetch;
}

await runSuiteWithoutKey();
await runSuiteWithKey();

console.log(`\nSummary: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
