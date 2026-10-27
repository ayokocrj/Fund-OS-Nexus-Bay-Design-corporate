import { inflateRawSync } from "node:zlib";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export interface XlsxSheetSummary {
  name: string;
  rowCount: number;
  colCount: number;
  previewRows: string[][];
  formulasCount: number;
  keyMetrics: Array<{ label: string; values: string[]; sheet: string; rowRef: string }>;
}

export interface ParsedXlsxModel {
  filename: string;
  sheets: XlsxSheetSummary[];
  markdownSummary: string;
  plainText: string;
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(Number.parseInt(h, 16)));
}

function unzipEntries(buffer: Buffer): Map<string, string> {
  const entries = new Map<string, string>();
  let offset = 0;
  while (offset + 30 <= buffer.length) {
    const sig = buffer.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;
    const compression = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLen = buffer.readUInt16LE(offset + 26);
    const extraLen = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const nameEnd = nameStart + fileNameLen;
    const fileName = buffer.subarray(nameStart, nameEnd).toString("utf8");
    const dataStart = nameEnd + extraLen;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > buffer.length) break;

    if (fileName.endsWith(".xml") || fileName.endsWith(".rels")) {
      try {
        const slice = buffer.subarray(dataStart, dataEnd);
        const raw =
          compression === 0
            ? slice.toString("utf8")
            : compression === 8
              ? inflateRawSync(slice).toString("utf8")
              : "";
        if (raw) entries.set(fileName, raw);
      } catch {
        // skip unreadable zip entry
      }
    }
    offset = dataEnd;
  }
  return entries;
}

function colLettersToIndex(letters: string): number {
  let idx = 0;
  for (let i = 0; i < letters.length; i++) {
    idx = idx * 26 + (letters.charCodeAt(i) - 64);
  }
  return Math.max(0, idx - 1);
}

function formatCellNumber(raw: string): string {
  const n = Number(raw);
  if (Number.isNaN(n)) return raw;
  if (Number.isInteger(n)) return String(n);
  if (Math.abs(n) >= 100) return n.toFixed(1);
  if (Math.abs(n) >= 1) return Number(n.toFixed(2)).toString();
  return Number(n.toFixed(4)).toString();
}

export function parseXlsxBuffer(buffer: Buffer, filename = "model.xlsx"): ParsedXlsxModel {
  const entries = unzipEntries(buffer);

  // 1. Shared strings
  const sharedStrings: string[] = [];
  const ssXml = entries.get("xl/sharedStrings.xml") ?? "";
  if (ssXml) {
    const siRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
    let m: RegExpExecArray | null;
    while ((m = siRegex.exec(ssXml)) !== null) {
      const inner = m[1];
      const tRegex = /<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/g;
      const parts: string[] = [];
      let tm: RegExpExecArray | null;
      while ((tm = tRegex.exec(inner)) !== null) {
        parts.push(decodeXmlEntities(tm[1]));
      }
      sharedStrings.push(parts.join(""));
    }
  }

  // 2. Workbook sheet names & rId mapping
  const relsXml = entries.get("xl/_rels/workbook.xml.rels") ?? "";
  const relMap = new Map<string, string>();
  const relRegex = /<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*\/?>/g;
  let rm: RegExpExecArray | null;
  while ((rm = relRegex.exec(relsXml)) !== null) {
    const id = rm[1];
    const target = rm[2].replace(/^\/+/, "");
    relMap.set(id, target.startsWith("xl/") ? target : `xl/${target}`);
  }

  const wbXml = entries.get("xl/workbook.xml") ?? "";
  const sheetDefs: Array<{ name: string; path: string }> = [];
  const sheetRegex = /<sheet\b[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"[^>]*\/?>/g;
  let sm: RegExpExecArray | null;
  while ((sm = sheetRegex.exec(wbXml)) !== null) {
    const name = decodeXmlEntities(sm[1]);
    const rId = sm[2];
    const path = relMap.get(rId) ?? `xl/worksheets/sheet${sheetDefs.length + 1}.xml`;
    sheetDefs.push({ name, path });
  }

  if (sheetDefs.length === 0) {
    for (const key of entries.keys()) {
      if (key.startsWith("xl/worksheets/sheet") && key.endsWith(".xml")) {
        sheetDefs.push({ name: key.replace("xl/worksheets/", "").replace(".xml", ""), path: key });
      }
    }
  }

  const sheets: XlsxSheetSummary[] = [];
  const mdLines: string[] = [`# Excel Financial Model: ${filename}`];

  for (const def of sheetDefs) {
    const xml = entries.get(def.path) ?? "";
    if (!xml) continue;

    const rows: string[][] = [];
    let maxCol = 0;
    let formulasCount = 0;
    const keyMetrics: Array<{ label: string; values: string[]; sheet: string; rowRef: string }> = [];

    const rowRegex = /<row\b[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = rowRegex.exec(xml)) !== null) {
      const rowNum = rowMatch[1];
      const rowXml = rowMatch[2];
      const rowCells: string[] = [];

      const cellRegex = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
      let cellMatch: RegExpExecArray | null;
      while ((cellMatch = cellRegex.exec(rowXml)) !== null) {
        const attrs = cellMatch[1];
        const inner = cellMatch[2];
        const refMatch = /\br="([A-Z]+)\d+"/.exec(attrs);
        const typeMatch = /\bt="([^"]+)"/.exec(attrs);
        const colIdx = refMatch ? colLettersToIndex(refMatch[1]) : rowCells.length;
        const cellType = typeMatch ? typeMatch[1] : "";

        if (/<f\b/.test(inner)) formulasCount++;

        let val = "";
        if (cellType === "inlineStr") {
          const tMatch = /<t(?:\s+[^>]*)?>([\s\S]*?)<\/t>/.exec(inner);
          val = tMatch ? decodeXmlEntities(tMatch[1]) : "";
        } else {
          const vMatch = /<v>([\s\S]*?)<\/v>/.exec(inner);
          const rawV = vMatch ? decodeXmlEntities(vMatch[1]) : "";
          if (cellType === "s") {
            const idx = Number.parseInt(rawV, 10);
            val = !Number.isNaN(idx) && sharedStrings[idx] !== undefined ? sharedStrings[idx] : rawV;
          } else if (cellType === "str" || cellType === "b") {
            val = rawV;
          } else if (rawV !== "") {
            val = formatCellNumber(rawV);
          }
        }

        while (rowCells.length <= colIdx) rowCells.push("");
        rowCells[colIdx] = val.trim();
        if (colIdx + 1 > maxCol) maxCol = colIdx + 1;
      }

      const nonEmpty = rowCells.filter(Boolean);
      if (nonEmpty.length > 0) {
        rows.push(rowCells);
        const firstNonEmptyIdx = rowCells.findIndex(Boolean);
        const label = rowCells[firstNonEmptyIdx] ?? "";
        const restValues = rowCells.slice(firstNonEmptyIdx + 1).filter(Boolean);
        if (
          label &&
          /[A-Za-z]/.test(label) &&
          restValues.length > 0 &&
          restValues.some(v => /\d/.test(v)) &&
          keyMetrics.length < 35
        ) {
          keyMetrics.push({
            label,
            values: restValues.slice(0, 10),
            sheet: def.name,
            rowRef: `${def.name}!R${rowNum}`,
          });
        }
      }
    }

    if (rows.length === 0) continue;

    // Skip huge raw data dumps (>500 rows) in full preview; summarize their key metrics + first 15 rows instead
    const maxPreviewRows = rows.length > 300 ? 12 : 28;
    const previewRows = rows.slice(0, maxPreviewRows).map(r => r.slice(0, 10));
    sheets.push({
      name: def.name,
      rowCount: rows.length,
      colCount: maxCol,
      previewRows,
      formulasCount,
      keyMetrics,
    });

    mdLines.push(`\n## Sheet: ${def.name} (${rows.length} active rows, ${formulasCount} formulas)`);
    for (const r of previewRows) {
      const compact = r
        .map(c => c.replace(/\s+/g, " ").trim())
        .filter(Boolean);
      if (compact.length > 0) {
        mdLines.push(`| ${compact.slice(0, 9).join(" | ")} |`);
      }
    }
  }

  const markdownSummary = mdLines.join("\n").slice(0, 14000);
  return {
    filename,
    sheets,
    markdownSummary,
    plainText: markdownSummary,
  };
}

export interface HinckleyModelCatalogItem {
  id: string;
  filename: string;
  moduleCode: string;
  title: string;
  category: string;
  useCaseHook: string;
}

export const HINCKLEY_MODELS_DIR = existsSync(resolve(process.cwd(), "Growth Equty Guide - Copie"))
  ? resolve(process.cwd(), "Growth Equty Guide - Copie")
  : resolve(process.cwd(), "artifacts/fund-os-core/data/growth-equity-models");

const MODEL_META_BY_FILE: Record<string, { id: string; category: string; title: string; hook: string }> = {
  "Financial-modeling-Growth-Before-After-v6.xlsx": {
    id: "growth-before-after-v6",
    category: "Cap Table, Pre-Money Options & Valuation",
    title: "Growth Equity Master Model (Before/After + Pre-Money Options + Cohorts + Valuation)",
    hook: "Compare Post-Money vs Pre-Money Option Pool dilution, Cohort Retention (End), IRR/MOIC Sensitivities, and Valuation multiples.",
  },
  "Financial-modeling-SaaS-practice-2-SOLUTION-v2.xlsx": {
    id: "saas-practice-2-solution",
    category: "SaaS Complete Diligence (Billings, Capitalizations, Cohorts, ARR)",
    title: "SaaS Practice 2 Solution (Transaction, Billing Waterfall, R&D Capitalizations, SaaS Metrics, Cohorts, ARR Waterfall)",
    hook: "Audit Billing Waterfall vs GAAP Revenue, Capitalized Software R&D impact on EBITDA, SaaS Magic Number, and Cohort NRR/GRR.",
  },
  "Financial-modeling-SaaS-practice-3-SOLUTION-v3-1.xlsx": {
    id: "saas-practice-3-solution",
    category: "SaaS Complete Diligence v3 (Transaction + QoE + ARR Bridge)",
    title: "SaaS Practice 3 Solution (Transaction, Model, Billing Waterfall, Capitalizations, SaaS Metrics, Cohorts, ARR Waterfall)",
    hook: "Deep-dive Series B/C SaaS transaction model: reconcile Raw Customer ARR (197 customers) to ARR Waterfall, Billings, and Burdened EBITDA.",
  },
  "Financial-modeling-SaaS-practice-1-SOLUTION.xlsx": {
    id: "saas-practice-1-solution",
    category: "Customer Cohort & ARR Bridge (4,995 rows)",
    title: "SaaS Practice 1 Solution (ARR Waterfall, Cohort Retention Matrix & 4,995 Customer ARR Rows)",
    hook: "Stress-test Beginning ARR + New + Expansion - Churn = Ending ARR and detect logo churn vs net dollar retention across customer cohorts.",
  },
  "Financial-Modeling-Growth-Practice-1-End-v2.xlsx": {
    id: "growth-practice-1-end",
    category: "3-Statement & Revenue Build (Growth Practice 1)",
    title: "Growth Modeling Practice 1 Solution (Model - End + Revenue Build - End)",
    hook: "Evaluate 3-statement operating model (203 rows, 717 formulas) and bottom-up Revenue Build assumptions.",
  },
  "Financial-Modeling-Growth-Practice-2-End-v3.xlsx": {
    id: "growth-practice-2-end",
    category: "Operating Model & Revenue Build (Growth Practice 2)",
    title: "Growth Modeling Practice 2 Solution (Model - End + Multi-Segment Revenue Build)",
    hook: "Challenge management's revenue build (46 rows, 225 formulas) and operating margin expansion trajectory.",
  },
  "Financial-modeling-Paper-LBO-BEFORE.xlsx": {
    id: "paper-lbo",
    category: "Paper LBO & Growth Buyout Returns",
    title: "Paper LBO Model (Guided & Blank Templates)",
    hook: "Run a rapid IC Paper LBO test: entry valuation, debt paydown, EBITDA growth, exit multiple, MOIC, and IRR.",
  },
  "Financial-modeling-SaaS-vFinal-Start (1).xlsx": {
    id: "saas-vfinal-headcount",
    category: "SaaS Financials, Headcount & Expenses",
    title: "SaaS vFinal Operating Model (Raw Customer ARR, Financials, Headcount Ramp, Expenses)",
    hook: "Analyze headcount hiring plan (30 rows, 215 formulas), departmental OpEx burn, and sales capacity vs ARR growth.",
  },
  "Financial-Modeling-Growth-Practice-1-Start-3.xlsx": {
    id: "growth-practice-1-start",
    category: "Template (Start)",
    title: "Growth Modeling Practice 1 (Start Template)",
    hook: "Base case starting template before growth equity adjustments.",
  },
  "Financial-Modeling-Growth-Practice-2-Start.xlsx": {
    id: "growth-practice-2-start",
    category: "Template (Start)",
    title: "Growth Modeling Practice 2 (Start Template)",
    hook: "Starting operating model and revenue build before diligence stress-testing.",
  },
  "Financial-modeling-SaaS-practice-1-START.xlsx": {
    id: "saas-practice-1-start",
    category: "Raw Data Room Export",
    title: "SaaS Practice 1 (Raw Customer ARR Export - 4,995 rows)",
    hook: "Raw customer-level ARR data dump before cohort and waterfall structuring.",
  },
  "Financial-modeling-SaaS-practice-2-START.xlsx": {
    id: "saas-practice-2-start",
    category: "Raw Data Room Export",
    title: "SaaS Practice 2 (Primary Assumptions & Raw Customer ARR)",
    hook: "Unadjusted company model and raw customer ARR table from the data room.",
  },
  "Financial-modeling-SaaS-practice-3-START-1.xlsx": {
    id: "saas-practice-3-start",
    category: "Raw Data Room Export",
    title: "SaaS Practice 3 (Raw Data Room Model & Customer ARR)",
    hook: "Initial management model and raw customer ARR before QoE and billing waterfall adjustments.",
  },
  "Financial-modeling-SaaS-vFinal-Start (2).xlsx": {
    id: "saas-vfinal-start-2",
    category: "Template (Start)",
    title: "SaaS vFinal Operating Model (Copy 2)",
    hook: "Full SaaS financials, headcount, and expense build template.",
  },
};

export function listHinckleyModels(dirPath = HINCKLEY_MODELS_DIR): HinckleyModelCatalogItem[] {
  if (!existsSync(dirPath)) return [];
  const files = readdirSync(dirPath)
    .filter(f => f.toLowerCase().endsWith(".xlsx") && !f.startsWith("~$"));

  // Sort solution/end models first so the most useful models appear at the top
  files.sort((a, b) => {
    const aScore = /Before-After|SOLUTION|End|Paper-LBO|vFinal-Start \(1\)/i.test(a) ? 0 : 1;
    const bScore = /Before-After|SOLUTION|End|Paper-LBO|vFinal-Start \(1\)/i.test(b) ? 0 : 1;
    if (aScore !== bScore) return aScore - bScore;
    return a.localeCompare(b);
  });

  return files.map((filename, idx) => {
    const meta = MODEL_META_BY_FILE[filename];
    return {
      id: meta?.id ?? `model-${idx + 1}`,
      filename,
      moduleCode: meta?.id ?? `M${idx + 1}`,
      title: meta?.title ?? filename.replace(/\.xlsx$/i, "").replace(/-/g, " "),
      category: meta?.category ?? "Growth Equity Excel Model",
      useCaseHook: meta?.hook ?? "Analyze Excel sheets, formulas, and growth equity diligence metrics.",
    };
  });
}

export function loadHinckleyModelByIdOrFilename(
  idOrName: string,
  dirPath = HINCKLEY_MODELS_DIR,
): { item: HinckleyModelCatalogItem; buffer: Buffer; parsed: ParsedXlsxModel } | null {
  const catalog = listHinckleyModels(dirPath);
  const needle = idOrName.trim().toLowerCase();
  const item =
    catalog.find(
      c =>
        c.id.toLowerCase() === needle ||
        c.filename.toLowerCase() === needle ||
        c.filename.toLowerCase().includes(needle) ||
        c.title.toLowerCase().includes(needle) ||
        c.category.toLowerCase().includes(needle),
    ) ?? catalog[0];
  if (!item) return null;
  const fullPath = join(dirPath, item.filename);
  if (!existsSync(fullPath)) return null;
  const buffer = readFileSync(fullPath);
  const parsed = parseXlsxBuffer(buffer, item.filename);
  return { item, buffer, parsed };
}
