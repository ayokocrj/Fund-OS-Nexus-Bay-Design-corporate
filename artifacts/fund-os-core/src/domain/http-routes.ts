import type { Actor } from "./db";
import {
  gatewayRead,
  gatewayAsk,
  GatewayFileTooLargeError,
  GatewayRateLimitError,
  MAX_FILE_BYTES,
} from "./gateway";
import { loadHinckleyModelByIdOrFilename } from "./xlsx-reader";
import { setRuntimeGeminiApiKey } from "../platform/secrets";

const DEFAULT_ACTOR: Actor = { firmId: "bay", userId: "demo-bay-partner" };

function getClientKey(request: Request): string {
  return (
    request.headers.get("x-rate-limit-key") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "default"
  );
}

function getHeaderApiKey(request: Request): string | undefined {
  const key = request.headers.get("x-gemini-api-key")?.trim();
  if (key) {
    setRuntimeGeminiApiKey(key);
    return key;
  }
  return undefined;
}

export async function handleReadRequest(request: Request, actor: Actor = DEFAULT_ACTOR): Promise<Response> {
  try {
    const clientKey = getClientKey(request);
    let apiKey = getHeaderApiKey(request);
    const contentType = (request.headers.get("content-type") ?? "").toLowerCase();

    let filename = "document.txt";
    let mimeType = "text/plain";
    let buffer: Buffer | undefined;
    let text: string | undefined;
    let transcript: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const fileEntry = form.get("file");
      const textEntry = form.get("text");
      const transcriptEntry = form.get("transcript");
      const keyEntry = form.get("apiKey");
      if (typeof textEntry === "string") text = textEntry;
      if (typeof transcriptEntry === "string") transcript = transcriptEntry;
      if (typeof keyEntry === "string" && keyEntry.trim()) {
        apiKey = keyEntry.trim();
        setRuntimeGeminiApiKey(apiKey);
      }

      if (fileEntry && typeof fileEntry === "object" && "arrayBuffer" in fileEntry) {
        const blob = fileEntry as File;
        if (blob.size > MAX_FILE_BYTES) {
          throw new GatewayFileTooLargeError(blob.size);
        }
        filename = blob.name || "upload";
        mimeType = blob.type || "application/octet-stream";
        buffer = Buffer.from(await blob.arrayBuffer());
      }
    } else {
      const rawBody = await request.text();
      if (Buffer.byteLength(rawBody, "utf8") > MAX_FILE_BYTES * 1.4) {
        throw new GatewayFileTooLargeError(Buffer.byteLength(rawBody, "utf8"));
      }
      const body = (rawBody ? JSON.parse(rawBody) : {}) as Record<string, unknown>;
      if (typeof body.apiKey === "string" && body.apiKey.trim()) {
        apiKey = body.apiKey.trim();
        setRuntimeGeminiApiKey(apiKey);
      }

      if (typeof body.hinckleyModelId === "string" && body.hinckleyModelId.trim()) {
        const loaded = loadHinckleyModelByIdOrFilename(body.hinckleyModelId.trim());
        if (loaded) {
          filename = loaded.item.filename;
          mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
          buffer = loaded.buffer;
        }
      }

      const nestedFile = (body.file && typeof body.file === "object" ? body.file : {}) as Record<string, unknown>;

      const declaredSize = Number(nestedFile.size ?? body.size ?? 0);
      if (declaredSize > MAX_FILE_BYTES) {
        throw new GatewayFileTooLargeError(declaredSize);
      }

      if (!buffer) {
        filename = String(nestedFile.name ?? nestedFile.filename ?? body.filename ?? body.name ?? (body.transcript ? "transcript.txt" : "document.txt"));
        mimeType = String(nestedFile.type ?? nestedFile.mimeType ?? body.mimeType ?? body.type ?? "text/plain");
      }
      if (typeof body.text === "string") text = body.text;
      else if (typeof nestedFile.text === "string") text = nestedFile.text;
      if (typeof body.transcript === "string") transcript = body.transcript;

      const b64 = nestedFile.data ?? nestedFile.contentBase64 ?? body.contentBase64 ?? body.data;
      if (!buffer && typeof b64 === "string" && b64.length > 0) {
        const cleanB64 = b64.includes(",") ? b64.slice(b64.indexOf(",") + 1) : b64;
        buffer = Buffer.from(cleanB64, "base64");
        if (buffer.byteLength > MAX_FILE_BYTES) {
          throw new GatewayFileTooLargeError(buffer.byteLength);
        }
      }
    }

    const result = await gatewayRead(
      actor,
      { filename, mimeType, buffer, text, transcript, apiKey },
      clientKey,
    );
    return Response.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof GatewayFileTooLargeError) {
      return Response.json(
        { error: "FILE_TOO_LARGE", message: error.message, maxBytes: MAX_FILE_BYTES },
        { status: 413 },
      );
    }
    if (error instanceof GatewayRateLimitError) {
      return Response.json(
        { error: "RATE_LIMIT_EXCEEDED", message: error.message, retryAfterMs: error.retryAfterMs },
        { status: 429 },
      );
    }
    const message = error instanceof Error ? error.message : "READ_FAILED";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function handleAskRequest(request: Request, actor: Actor = DEFAULT_ACTOR): Promise<Response> {
  try {
    const clientKey = getClientKey(request);
    let apiKey = getHeaderApiKey(request);
    const body = (await request.json().catch(() => ({}))) as {
      question?: string;
      context?: unknown;
      level?: number;
      apiKey?: string;
    };
    if (typeof body.apiKey === "string" && body.apiKey.trim()) {
      apiKey = body.apiKey.trim();
      setRuntimeGeminiApiKey(apiKey);
    }
    const question = String(body.question ?? "").trim();
    if (!question) {
      return Response.json({ error: "QUESTION_REQUIRED" }, { status: 400 });
    }
    const result = await gatewayAsk(
      actor,
      { question, context: body.context, level: body.level, apiKey },
      clientKey,
    );
    return Response.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof GatewayRateLimitError) {
      return Response.json(
        { error: "RATE_LIMIT_EXCEEDED", message: error.message, retryAfterMs: error.retryAfterMs },
        { status: 429 },
      );
    }
    const message = error instanceof Error ? error.message : "ASK_FAILED";
    return Response.json({ error: message }, { status: 400 });
  }
}
