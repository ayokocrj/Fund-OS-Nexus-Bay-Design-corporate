import { test, expect } from "@playwright/test";
test("Episode trace is persisted and shows critic, zero cost and all seven steps", async ({ page }) => {
  await page.goto("/builder/episodes");
  await expect(page.getByText("SYNTHETIC DATA ONLY", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /episode trace/i }).first()).toBeVisible();
  await expect(page.getByText(/Meridian Ridge/).first()).toBeVisible();
  await expect(page.getByText(/passed/).first()).toBeVisible();
  const episode = page.locator('[data-testid^="row-episode-"]').filter({ hasText: "Meridian Ridge" }).first();
  await expect(episode).toContainText("cost 0");
  await episode.locator('[data-testid^="button-toggle-"]').click();
  await expect(episode.locator('[data-testid^="row-step-"]')).toHaveCount(7);
});
test("Review inbox and outbox use server records after navigation and reload", async ({ page }) => {
  await page.goto("/analyst/review");
  await expect(page.getByRole("heading", { name: /review/i }).first()).toBeVisible();
  await expect(page.getByText(/September 2025/).first()).toBeVisible();
  await page.reload();
  await expect(page.getByText(/September 2025/).first()).toBeVisible();
  await page.goto("/analyst/outbox");
  await expect(page.getByRole("heading", { name: /outbox/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /send|apply/i })).toHaveCount(0);
});
test("API uses signed demo session, enforces tenant scope and auditor write refusal", async ({ request }) => {
  const session = await request.get("/api/core/session");
  expect(session.status()).toBe(200);
  const origin = new URL(session.url()).origin;
  const denied = await request.get("/api/core/sources/north-obs-1");
  expect(denied.status()).toBe(404);
  const switched = await request.post("/api/core/session", { headers: { origin }, data: { userId: "demo-bay-auditor" } });
  expect(switched.status()).toBe(200);
  const mutation = await request.post("/api/core/episodes", { headers: { origin }, data: { orgId: "bay-org-001" } });
  expect(mutation.status()).toBe(403);
  const forged = await request.post("/api/core/episodes", { headers: { origin, "x-user-role": "partner" }, data: { orgId: "bay-org-001" } });
  expect(forged.status()).toBe(403);
});
