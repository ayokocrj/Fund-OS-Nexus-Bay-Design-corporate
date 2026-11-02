import { NextRequest } from "next/server";
import { handleSetApiKeyRequest } from "@/domain/http-routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return handleSetApiKeyRequest(request);
}
