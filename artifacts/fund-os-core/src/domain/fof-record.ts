import { listHinckleyModels, loadHinckleyModelByIdOrFilename } from "./xlsx-reader";

export interface SyntheticManager {
  id: string;
  name: string;
  fund: string;
  vint: number;
  strat: string;
  size: number;
  commit: number;
  called: number;
  paidIn: number;
  nav: number;
  dist: number;
  tvpiRep: number;
  tvpiComp: number;
  dpi: number;
  irr: number | null;
  gp: string;
  rep: { st: "received"; day: number } | { st: "overdue"; days: number; lpa: number } | { st: "expected"; due: string };
  flags: string[];
  note: string;
}

export const SYNTHETIC_MANAGERS: SyntheticManager[] = [
  { id: "m01", name: "Meridian Ridge Partners", fund: "Fund I", vint: 2022, strat: "Pre-seed and seed, B2B software, US", size: 45, commit: 4, called: 0.71, paidIn: 2.84, nav: 4.29, dist: 0.31, tvpiRep: 1.62, tvpiComp: 1.62, dpi: 0.11, irr: 21.4, gp: "Priya Natarajan", rep: { st: "received", day: 21 }, flags: [], note: "Fund II in diligence; $5m commitment asked; first close target March 2027; anchor LP $15m soft-circled" },
  { id: "m02", name: "Harbor Peak Ventures", fund: "Fund II", vint: 2021, strat: "Seed, fintech and infrastructure", size: 80, commit: 5, called: 0.84, paidIn: 4.2, nav: 5.29, dist: 0.76, tvpiRep: 1.52, tvpiComp: 1.44, dpi: 0.18, irr: 15.9, gp: "Marcus Oyelaran", rep: { st: "received", day: 28 }, flags: ["TVPI headline 1.52x vs components 1.44x (difference 0.08x above 0.03x threshold)"], note: "Fund III planned 2027; 3 chart-read values marked indicative (Gross IRR 18.3%, Fintech share 61%, Active companies 23)" },
  { id: "m03", name: "Coral Bend Capital", fund: "Fund I", vint: 2023, strat: "Consumer and marketplaces", size: 35, commit: 3, called: 0.52, paidIn: 1.56, nav: 1.68, dist: 0, tvpiRep: 1.08, tvpiComp: 1.08, dpi: 0, irr: 6.1, gp: "Elena Sorescu", rep: { st: "overdue", days: 3, lpa: 30 }, flags: ["Q3 report overdue 3 days (LPA: 30 days)", "No conversation since July"], note: "Write-off Tidepool Logistics $0.6m cost; new principal Sam Idris; Fund II first close H2 2027" },
  { id: "m04", name: "Northwind Seed", fund: "Fund III", vint: 2020, strat: "Pre-seed generalist", size: 70, commit: 6, called: 0.93, paidIn: 5.58, nav: 7.2, dist: 2.34, tvpiRep: 1.71, tvpiComp: 1.71, dpi: 0.42, irr: 19.8, gp: "Tom Achebe", rep: { st: "received", day: 25 }, flags: ["Capital call 6: 7 days notice vs 10 in LPA; $412k notice vs $400k expected"], note: "" },
  { id: "m05", name: "Granite Fork Ventures", fund: "Fund I", vint: 2024, strat: "Deep tech and industrial software", size: 40, commit: 3, called: 0.31, paidIn: 0.93, nav: 0.95, dist: 0, tvpiRep: 1.02, tvpiComp: 1.02, dpi: 0, irr: null, gp: "Hanna Lindqvist", rep: { st: "expected", due: "14 Nov" }, flags: [], note: "First reporting cycle" },
  { id: "m06", name: "Lantern Hill Partners", fund: "Fund II", vint: 2021, strat: "Healthcare and bio software", size: 60, commit: 4, called: 0.88, paidIn: 3.52, nav: 3.84, dist: 0.92, tvpiRep: 1.35, tvpiComp: 1.35, dpi: 0.26, irr: 11.2, gp: "Yusuf Demir", rep: { st: "received", day: 19 }, flags: ["Distribution notice $0.4m, cash not received (12 days)"], note: "" },
  { id: "m07", name: "Saltmarsh Capital", fund: "Fund I", vint: 2022, strat: "Climate and energy software", size: 50, commit: 3.5, called: 0.66, paidIn: 2.31, nav: 2.7, dist: 0.09, tvpiRep: 1.21, tvpiComp: 1.21, dpi: 0.04, irr: 9.7, gp: "Daniel Reyes-Kahn, Ana Ferreira", rep: { st: "received", day: 24 }, flags: ["Key person: GP stepping back (call note), not in the report"], note: "Reserves at 40%; Fund II conversations after Q1 2027" },
  { id: "m08", name: "Bluefern Ventures", fund: "Fund II", vint: 2022, strat: "Seed, AI infrastructure", size: 65, commit: 5, called: 0.74, paidIn: 3.7, nav: 6.62, dist: 0.33, tvpiRep: 1.88, tvpiComp: 1.88, dpi: 0.09, irr: 27.3, gp: "Grace Whitfield", rep: { st: "received", day: 17 }, flags: [], note: "Co-invest Nimbus Ledger Series B ($40m round, $1.5m allocation, deadline 20 November)" },
  { id: "m09", name: "Tidewater Labs Fund", fund: "Fund I", vint: 2023, strat: "Developer tools", size: 30, commit: 2.5, called: 0.58, paidIn: 1.45, nav: 2.09, dist: 0, tvpiRep: 1.44, tvpiComp: 1.44, dpi: 0, irr: 18.0, gp: "Kenji Mori", rep: { st: "received", day: 22 }, flags: ["Top position 38% of NAV (policy: 30%)"], note: "" },
  { id: "m10", name: "Kestrel Point", fund: "Fund III", vint: 2019, strat: "Seed, B2B software", size: 90, commit: 5, called: 1.0, paidIn: 5.0, nav: 6.65, dist: 3.55, tvpiRep: 2.04, tvpiComp: 2.04, dpi: 0.71, irr: 23.5, gp: "Laila Haddad", rep: { st: "received", day: 15 }, flags: [], note: "Fund IV conversations started" },
  { id: "m11", name: "Ironvale Collective", fund: "Fund I", vint: 2024, strat: "Operator-led seed", size: 20, commit: 2, called: 0.4, paidIn: 0.8, nav: 0.8, dist: 0, tvpiRep: 1.0, tvpiComp: 1.0, dpi: 0, irr: null, gp: "Samuel Osei", rep: { st: "expected", due: "14 Nov" }, flags: [], note: "First reporting cycle" },
  { id: "m12", name: "Pinecrest Early", fund: "Fund II", vint: 2023, strat: "Consumer health", size: 45, commit: 3, called: 0.49, paidIn: 1.47, nav: 1.65, dist: 0, tvpiRep: 1.12, tvpiComp: 1.12, dpi: 0, irr: 7.4, gp: "Mei Tanaka", rep: { st: "received", day: 27 }, flags: [], note: "" },
  { id: "m13", name: "Driftline Ventures", fund: "Fund I", vint: 2022, strat: "Vertical SaaS", size: 40, commit: 3, called: 0.69, paidIn: 2.07, nav: 2.57, dist: 0.1, tvpiRep: 1.29, tvpiComp: 1.29, dpi: 0.05, irr: 10.8, gp: "Noah Brightwater", rep: { st: "received", day: 26 }, flags: ["FY2025 audited accounts missing"], note: "" },
  { id: "m14", name: "Basalt Row Capital", fund: "Fund II", vint: 2020, strat: "Fintech", size: 75, commit: 4.5, called: 0.95, paidIn: 4.28, nav: 5.35, dist: 1.41, tvpiRep: 1.58, tvpiComp: 1.58, dpi: 0.33, irr: 14.6, gp: "Ines Carvalho", rep: { st: "received", day: 20 }, flags: [], note: "" },
];

export const SYNTHETIC_TOTALS = {
  managerCount: 14,
  companyCount: 8,
  flaggedFundCount: 7,
  nav: 51.78,
  navFormatted: "$51.8m",
  paidIn: 39.71,
  commit: 53,
  dist: 9.81,
  conversationsCaptured: 63,
  q3ReportsReceived: 11,
  q3ReportsTotal: 14,
  companyUpdates: 8,
};

export const SYNTHETIC_DILIGENCE = {
  manager: "Meridian Ridge Partners, Fund II",
  score: 100,
  bar: 80,
  criteriaVersion: "v1.0",
  contradictedClaimsCount: 3,
  fundInvestmentsCount: 14,
  claimedTvpi: "1.9x",
  recomputedGrossTvpi: "1.85x",
  recomputedNetTvpi: "1.62x",
  reportedNetTvpi: "1.62x",
  dpi: "0.11x",
  claimedGps: 3,
  ddqFullTimeGps: 2,
  anchorLp: "$15m",
  ask: "$5m",
  firstClose: "March 2027",
  terms: "2% management fee, 20% carry, 8% hurdle, 2% GP commitment",
};

export const SYNTHETIC_OPERATIONS = {
  northwindCall: {
    manager: "Northwind Seed",
    fund: "Fund III",
    call: "Call 6",
    expectedAmount: "$400k",
    noticeAmount: "$412k",
    lpaNoticeDays: 10,
    givenNoticeDays: 7,
  },
  openCoinvestDealsCount: 6,
  topCoinvest: {
    company: "Nimbus Ledger",
    round: "Series B, $40m",
    allocation: "$1.5m",
    score: 82,
    deadline: "20 Nov",
    via: "Bluefern Ventures",
  },
};

export const SYNTHETIC_LP_DATA = {
  raisingCount: 4,
  totalManagers: 14,
  raisingManagers: [
    { name: "Meridian Ridge Partners", fund: "Fund II, data room open", source: "Email 2 Nov; diligence" },
    { name: "Harbor Peak Ventures", fund: "Fund III planned 2027", source: "Call note 3 Oct" },
    { name: "Kestrel Point", fund: "Fund IV conversations started", source: "LP day 8 Oct" },
    { name: "Saltmarsh Capital", fund: "Fund II conversations after Q1 2027", source: "Call note 30 Oct, confirmed" },
  ],
  aiNativeExposure: {
    aiCompanies: 38,
    totalCompanies: 212,
    shareOfNav: "19%",
    reportingManagers: 11,
    missingManagers: 3,
  },
};

export const SYNTHETIC_GROWTH_DILIGENCE = {
  company: "Nimbus Ledger",
  round: "Series B, $40m ($30m primary, $10m secondary)",
  via: "Bluefern Ventures (Fund II)",
  allocation: "$1.5m",
  deadline: "20 Nov",
  arrWaterfall: {
    beginningArr: "$4,800k",
    newLogoArr: "$620k",
    upsellArr: "$740k",
    downsellArr: "-$190k",
    churnArr: "-$370k",
    endingArr: "$5,600k",
    netNewArrQuarter: "$800k",
  },
  cohortAndRetention: {
    nrr: "111.7%",
    grr: "88.3%",
    logoRetention: "86.0%",
    quickRatio: "2.43x",
    cacPaybackMonths: 19,
    ltvToCac: "3.4x",
    finding: "Strong enterprise upsell ($740k) masks 14.0% annualized logo churn and 88.3% GRR (below the 90% Growth Equity bar).",
  },
  billingsAndAccounting: {
    reportedQuarterlyBillings: "$1,950k",
    recognizedGaapRevenue: "$1,360k",
    deferredRevenueChange: "$590k",
    reportedAdjustedEbitdaMonthly: "-$40k",
    capitalizedSoftwareMonthly: "$240k",
    deferredCommissionsMonthly: "$140k",
    burdenedCashBurnMonthly: "$420k",
    burnMultiple: "1.58x",
    claimedRuleOf40: "54%",
    recomputedRuleOf40: "18%",
    finding: "24-month upfront billing rollover on 6 contracts inflated Q3 billings by $590k; capitalized software ($240k/mo) and deferred commissions ($140k/mo) mask true $420k/mo net cash burn.",
  },
  dealStructure: {
    preMoneyValuation: "$160m",
    postMoneyValuation: "$200m",
    entryArrMultiple: "28.6x",
    primaryProceeds: "$30m",
    secondaryProceeds: "$10m",
    optionPoolRefresh: "10% post-money (dilutes Series B from 7.50% to 6.75%)",
    liquidationPreference: "1.0x non-participating preferred",
  },
};

export const FOF_FUNCTION_DECLARATIONS = [
  {
    name: "get_portfolio_summary",
    description: "Returns portfolio totals (NAV, commitments, paid-in, distributions), counts of managers and flagged positions, and Monday brief summary figures.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "get_manager_record",
    description: "Returns the synthetic record for a specific fund manager (commitment, called %, NAV, TVPI reported vs components, DPI, IRR, report status, flags, and notes) or all managers if none is specified.",
    parameters: {
      type: "OBJECT",
      properties: {
        manager_query: {
          type: "STRING",
          description: "Name or ID of the manager (e.g. 'Meridian Ridge', 'Harbor Peak', 'Coral Bend', 'Northwind', 'Saltmarsh', 'm01').",
        },
      },
    },
  },
  {
    name: "get_overdue_and_missing_reports",
    description: "Returns managers that are overdue on their Q3 report or expected in the first reporting cycle, with LPA deadline days.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "get_diligence_and_prospects",
    description: "Returns manager pipeline scores against criteria v1.0 and Fund II diligence claims and TVPI recomputation for Meridian Ridge Partners.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "get_operations_and_coinvest",
    description: "Returns capital call checks (including Northwind Seed call 6) and open startup co-investment pipeline deals (including Nimbus Ledger).",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "get_lp_questions_and_raising",
    description: "Returns managers raising successor funds and LP question figures such as AI-native look-through exposure.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "get_growth_equity_diligence",
    description: "Returns Growth Equity SaaS diligence on Nimbus Ledger Series B co-investment: ARR waterfall (Beginning, New Logo, Upsell, Downsell, Churn, Ending ARR), NRR vs GRR cohorts, Billings vs GAAP revenue & deferred revenue, capitalized software / burdened EBITDA, burn multiple, Rule of 40, and pre/post-money option pool dilution.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "inspect_hinckley_excel_model",
    description: "Reads one of Mike Hinckley's 14 real Growth Equity Excel (.xlsx) models (e.g. 'growth-before-after-v6', 'saas-practice-2-solution', 'saas-practice-3-solution', 'saas-practice-1-solution', 'growth-practice-1-end', 'growth-practice-2-end', 'paper-lbo', 'saas-vfinal-headcount') and returns its parsed sheets, formulas count, and tabular numbers.",
    parameters: {
      type: "OBJECT",
      properties: {
        model_query: {
          type: "STRING",
          description: "Model ID, filename, or topic (e.g. 'saas-practice-2-solution', 'paper-lbo', 'cohort', 'cap table', 'valuation', 'headcount').",
        },
      },
    },
  },
] as const;

export type FofFunctionName = typeof FOF_FUNCTION_DECLARATIONS[number]["name"];

export function executeFofFunction(name: string, args: Record<string, unknown> = {}): Record<string, unknown> {
  switch (name) {
    case "get_portfolio_summary":
      return {
        totals: SYNTHETIC_TOTALS,
        flaggedManagers: SYNTHETIC_MANAGERS.filter(m => m.flags.length > 0).map(m => ({
          id: m.id,
          name: m.name,
          tvpiRep: `${m.tvpiRep.toFixed(2)}x`,
          tvpiComp: `${m.tvpiComp.toFixed(2)}x`,
          flags: m.flags,
        })),
        diligenceSummary: {
          manager: SYNTHETIC_DILIGENCE.manager,
          contradictedClaimsCount: SYNTHETIC_DILIGENCE.contradictedClaimsCount,
        },
        operationsSummary: SYNTHETIC_OPERATIONS.northwindCall,
      };
    case "get_manager_record": {
      const q = String(args.manager_query ?? "").toLowerCase().trim();
      const matched = q
        ? SYNTHETIC_MANAGERS.filter(m => m.id.toLowerCase() === q || m.name.toLowerCase().includes(q) || m.gp.toLowerCase().includes(q))
        : SYNTHETIC_MANAGERS;
      return {
        managers: (matched.length ? matched : SYNTHETIC_MANAGERS).map(m => ({
          ...m,
          commitFormatted: `$${m.commit}m`,
          calledPct: `${Math.round(m.called * 100)}%`,
          navFormatted: `$${m.nav.toFixed(2)}m`,
          tvpiRepFormatted: `${m.tvpiRep.toFixed(2)}x`,
          tvpiCompFormatted: `${m.tvpiComp.toFixed(2)}x`,
          dpiFormatted: `${m.dpi.toFixed(2)}x`,
        })),
      };
    }
    case "get_overdue_and_missing_reports":
      return {
        overdue: SYNTHETIC_MANAGERS.filter(m => m.rep.st === "overdue"),
        expectedFirstCycle: SYNTHETIC_MANAGERS.filter(m => m.rep.st === "expected"),
      };
    case "get_diligence_and_prospects":
      return {
        diligence: SYNTHETIC_DILIGENCE,
        prospectsCount: 6,
        aboveBarCount: 2,
        aboveBarManagers: ["Meridian Ridge Partners, Fund II", "Juniper Bay Capital, Fund III"],
      };
    case "get_operations_and_coinvest":
      return SYNTHETIC_OPERATIONS;
    case "get_lp_questions_and_raising":
      return SYNTHETIC_LP_DATA;
    case "get_growth_equity_diligence":
      return SYNTHETIC_GROWTH_DILIGENCE;
    case "inspect_hinckley_excel_model": {
      const q = String(args.model_query ?? "saas-practice-2-solution");
      const loaded = loadHinckleyModelByIdOrFilename(q);
      const catalog = listHinckleyModels();
      if (!loaded) {
        return { availableModels: catalog };
      }
      return {
        model: loaded.item,
        sheets: loaded.parsed.sheets.map(s => ({
          name: s.name,
          rowCount: s.rowCount,
          formulasCount: s.formulasCount,
          keyMetrics: s.keyMetrics.slice(0, 15),
          previewRows: s.previewRows.slice(0, 20),
        })),
        availableModelsCount: catalog.length,
      };
    }
    default:
      return {
        totals: SYNTHETIC_TOTALS,
        diligence: SYNTHETIC_DILIGENCE,
        operations: SYNTHETIC_OPERATIONS,
        lp: SYNTHETIC_LP_DATA,
      };
  }
}

export function selectFunctionsForQuestion(question: string): { name: FofFunctionName; args: Record<string, unknown> }[] {
  const q = question.toLowerCase();
  const calls: { name: FofFunctionName; args: Record<string, unknown> }[] = [];
  if (/meridian/.test(q)) calls.push({ name: "get_manager_record", args: { manager_query: "Meridian Ridge" } });
  if (/harbor|flagged/.test(q)) calls.push({ name: "get_manager_record", args: { manager_query: "Harbor Peak" } });
  if (/coral bend/.test(q)) calls.push({ name: "get_manager_record", args: { manager_query: "Coral Bend" } });
  if (/saltmarsh/.test(q)) calls.push({ name: "get_manager_record", args: { manager_query: "Saltmarsh" } });
  if (/overdue|report/.test(q)) calls.push({ name: "get_overdue_and_missing_reports", args: {} });
  if (/tvpi|contradicted|diligence|reference call|above the bar|score|criteria/.test(q)) calls.push({ name: "get_diligence_and_prospects", args: {} });
  if (/northwind|capital call|notice|co-invest|startup|pipeline|nimbus/.test(q)) calls.push({ name: "get_operations_and_coinvest", args: {} });
  if (/waterfall|cohort|nrr|grr|billings|deferred|capitalized|ebitda|rule of 40|burn multiple|option pool|growth equity|nimbus/.test(q)) {
    calls.push({ name: "get_growth_equity_diligence", args: {} });
  }
  if (/successor|raising|look-through|ai-native|lp/.test(q)) calls.push({ name: "get_lp_questions_and_raising", args: {} });
  if (/monday brief|brief|nav|what do we know|portfolio/.test(q) || calls.length === 0) {
    calls.push({ name: "get_portfolio_summary", args: {} });
  }
  return calls;
}
