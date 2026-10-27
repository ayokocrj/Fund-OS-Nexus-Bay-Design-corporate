import { db } from "../domain/db";
import type { Settings } from "../domain/config";
export class BudgetStop extends Error {
  constructor() { super("BUDGET_EXHAUSTED"); }
}
export async function checkBudget(firmId: string, episodeCost: number, projectedCost: number, config: Settings) {
  const start = new Date(); start.setUTCDate(1); start.setUTCHours(0, 0, 0, 0);
  const monthly = await db.run.aggregate({ where: { firm_id: firmId, started_at: { gte: start } }, _sum: { cost: true } });
  if (episodeCost + projectedCost > config.budgets.episode || Number(monthly._sum.cost ?? 0) + projectedCost > config.budgets.monthly) throw new BudgetStop();
}
