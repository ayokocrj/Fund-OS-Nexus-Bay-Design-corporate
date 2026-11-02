import { handleGrowthModelsRequest } from "@/domain/http-routes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return handleGrowthModelsRequest();
}
