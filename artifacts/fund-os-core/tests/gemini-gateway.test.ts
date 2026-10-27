import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { geminiApiKey, geminiModel, GEMINI_FLASH_MODEL } from "../src/platform/secrets";
import { scanSecrets } from "../src/platform/secret-scan";
import {
  gateway,
  extractPdfText,
  setRateLimit,
  resetRateLimit,
  MAX_FILE_BYTES,
} from "../src/domain/gateway";
import { handleReadRequest, handleAskRequest } from "../src/domain/http-routes";
import { getMemoryRuns, clearMemoryRuns } from "../src/domain/ledger";
import { fixturesRoot } from "../src/platform/fixtures";

const actor = { firmId: "bay", userId: "demo-bay-partner" };

describe("Gemini Flash ModelGateway, POST /read and POST /ask", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    clearMemoryRuns();
    resetRateLimit();
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    globalThis.fetch = originalFetch;
    resetRateLimit();
  });

  it("defaults to mock provider when GEMINI_API_KEY is absent and returns {mode:'local'} on /read and /ask", async () => {
    delete process.env.GEMINI_API_KEY;
    expect(geminiApiKey()).toBeNull();
    expect(geminiModel()).toBe(GEMINI_FLASH_MODEL);

    const readRes = await handleReadRequest(
      new Request("http://localhost:24294/read", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          filename: "note.txt",
          mimeType: "text/plain",
          text: "First close target is March 2027.",
        }),
      }),
      actor,
    );
    expect(readRes.status).toBe(200);
    const readData = await readRes.json();
    expect(readData.mode).toBe("local");
    expect(readData.provider).toBe("deterministic");

    const askRes = await handleAskRequest(
      new Request("http://localhost:24294/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: "What do we know about Meridian Ridge?" }),
      }),
      actor,
    );
    expect(askRes.status).toBe(200);
    const askData = await askRes.json();
    expect(askData.mode).toBe("local");
    expect(askData.provider).toBe("deterministic");
    expect(getMemoryRuns()).toHaveLength(2);
  });

  it("POST /read with GEMINI_API_KEY verifies text & PDF quotes, drops unverified quotes, tags image values indicative, and records 1 Run per call", async () => {
    process.env.GEMINI_API_KEY = "test-live-gemini-key";
    const sourceText = "We now target a first close in March 2027. Anchor is $15m soft-circled.";

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      summary: "Meridian Ridge update",
                      document_type: "email",
                      facts: [
                        {
                          field: "First close",
                          value: "March 2027",
                          confidence: 0.92,
                          quote: "target a first close in March 2027",
                          page_or_time: "p.1",
                        },
                        {
                          field: "Unverified claim",
                          value: "3.0x DPI",
                          confidence: 0.99,
                          quote: "quote not present in extracted text",
                          page_or_time: "p.1",
                        },
                      ],
                      entities: ["Meridian Ridge Partners"],
                      tasks: ["Book reference calls"],
                      transcript: null,
                    }),
                  },
                ],
              },
            },
          ],
          usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 50 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );

    const before = getMemoryRuns().length;
    const res = await handleReadRequest(
      new Request("http://localhost:24294/read", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename: "email.txt", mimeType: "text/plain", text: sourceText }),
      }),
      actor,
    );
    const data = await res.json();
    expect(data.mode).toBe("live");
    expect(data.model).toBe("gemini-2.5-flash");
    expect(data.facts).toHaveLength(1);
    expect(data.quotes_rejected).toBe(1);
    expect(getMemoryRuns()).toHaveLength(before + 1);

    const pdfBytes = await readFile(path.join(fixturesRoot, "synthetic-deck.pdf"));
    expect(extractPdfText(pdfBytes)).toContain("SYNTHETIC FIXTURE - known chart values");
  });

  it("POST /ask with GEMINI_API_KEY uses function calling over synthetic record, strips unverified figures, and writes 1 Run", async () => {
    process.env.GEMINI_API_KEY = "test-live-gemini-key";
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      if (calls === 1) {
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ functionCall: { name: "get_operations_and_coinvest", args: {} } }],
                },
              },
            ],
            usageMetadata: { promptTokenCount: 80, candidatesTokenCount: 20 },
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
                    text: "Northwind Call 6 shows $412k against $400k expected with 7 days notice vs 10. Hallucinated $888m figure is dropped.",
                  },
                ],
              },
            },
          ],
          usageMetadata: { promptTokenCount: 140, candidatesTokenCount: 40 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };

    const before = getMemoryRuns().length;
    const res = await handleAskRequest(
      new Request("http://localhost:24294/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: "Check the Northwind capital call notice" }),
      }),
      actor,
    );
    const data = await res.json();
    expect(data.mode).toBe("live");
    expect(data.answer).toContain("$412k");
    expect(data.answer).not.toContain("$888m");
    expect(data.unverified_figures_dropped).toBeGreaterThanOrEqual(1);
    expect(getMemoryRuns()).toHaveLength(before + 1);
  });

  it("enforces 15 MB per file and rate limiting, and never ships GEMINI_API_KEY to the client", async () => {
    const bigRes = await handleReadRequest(
      new Request("http://localhost:24294/read", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename: "huge.pdf", size: MAX_FILE_BYTES + 1 }),
      }),
      actor,
    );
    expect(bigRes.status).toBe(413);

    setRateLimit({ maxRequests: 1, windowMs: 60_000 });
    const first = await handleAskRequest(
      new Request("http://localhost:24294/ask", {
        method: "POST",
        headers: { "content-type": "application/json", "x-rate-limit-key": "vitest-rl" },
        body: JSON.stringify({ question: "Monday brief" }),
      }),
      actor,
    );
    expect(first.status).toBe(200);
    const second = await handleAskRequest(
      new Request("http://localhost:24294/ask", {
        method: "POST",
        headers: { "content-type": "application/json", "x-rate-limit-key": "vitest-rl" },
        body: JSON.stringify({ question: "Monday brief" }),
      }),
      actor,
    );
    expect(second.status).toBe(429);

    const scan = await scanSecrets();
    expect(scan.detected).toBe(0);
  });
});
