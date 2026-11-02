/**
 * Lightweight browser-native .xlsx (ZIP + XML) parser using Web DecompressionStream('deflate-raw').
 * Enables full Excel parsing in 100% static web deployments (Replit Static, Vercel, Netlify)
 * when the Node backend /read endpoint is not reachable.
 */

export interface BrowserExcelFact {
  field: string;
  value: string;
  quote: string;
  page_or_time: string;
  confidence: number;
}

export interface BrowserParsedXlsx {
  filename: string;
  markdown: string;
  facts: BrowserExcelFact[];
}

function decodeXml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
}

async function inflateRawBytes(compressed: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('DecompressionStream not supported');
  }
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  void writer.write(compressed as unknown as BufferSource);
  void writer.close();
  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.byteLength;
    }
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

async function unzipEntriesBrowser(buffer: ArrayBuffer): Promise<Map<string, string>> {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const decoder = new TextDecoder('utf-8');
  const entries = new Map<string, string>();

  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) return entries;

  const totalEntries = view.getUint16(eocd + 10, true);
  const cdOffset = view.getUint32(eocd + 16, true);
  let ptr = cdOffset;

  for (let i = 0; i < totalEntries && ptr < bytes.length; i++) {
    if (view.getUint32(ptr, true) !== 0x02014b50) break;
    const method = view.getUint16(ptr + 10, true);
    const compSize = view.getUint32(ptr + 20, true);
    const nameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localHeaderOffset = view.getUint32(ptr + 42, true);
    const name = decoder.decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
    ptr += 46 + nameLen + extraLen + commentLen;

    if (!name.endsWith('.xml') && !name.endsWith('.rels')) continue;
    if (localHeaderOffset + 30 > bytes.length) continue;

    const lNameLen = view.getUint16(localHeaderOffset + 26, true);
    const lExtraLen = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + lNameLen + lExtraLen;
    const slice = bytes.subarray(dataStart, dataStart + compSize);

    try {
      if (method === 0) {
        entries.set(name, decoder.decode(slice));
      } else if (method === 8) {
        const inflated = await inflateRawBytes(slice);
        entries.set(name, decoder.decode(inflated));
      }
    } catch {
      // ignore entry decompression error
    }
  }
  return entries;
}

export async function parseXlsxInBrowser(buffer: ArrayBuffer, filename: string): Promise<BrowserParsedXlsx> {
  const entries = await unzipEntriesBrowser(buffer);
  const sharedStrings: string[] = [];
  const ssXml = entries.get('xl/sharedStrings.xml');
  if (ssXml) {
    const siRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
    let m: RegExpExecArray | null;
    while ((m = siRegex.exec(ssXml)) !== null) {
      const tRegex = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
      const parts: string[] = [];
      let tm: RegExpExecArray | null;
      while ((tm = tRegex.exec(m[1])) !== null) {
        parts.push(decodeXml(tm[1]));
      }
      sharedStrings.push(parts.join(''));
    }
  }

  const sheetNames: string[] = [];
  const wbXml = entries.get('xl/workbook.xml');
  if (wbXml) {
    const sRegex = /<sheet\b[^>]*name="([^"]+)"[^>]*\/?>/g;
    let sm: RegExpExecArray | null;
    while ((sm = sRegex.exec(wbXml)) !== null) {
      sheetNames.push(decodeXml(sm[1]));
    }
  }

  const sheetFiles = Array.from(entries.keys())
    .filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k))
    .sort((a, b) => {
      const na = Number(a.match(/sheet(\d+)\.xml/)?.[1] ?? 0);
      const nb = Number(b.match(/sheet(\d+)\.xml/)?.[1] ?? 0);
      return na - nb;
    });

  const mdLines: string[] = [`# Modèle Excel : ${filename}`];
  const facts: BrowserExcelFact[] = [];

  for (let idx = 0; idx < sheetFiles.length; idx++) {
    const xml = entries.get(sheetFiles[idx]) || '';
    const sheetName = sheetNames[idx] || `Sheet${idx + 1}`;
    const rowRegex = /<row\b[^>]*>([\s\S]*?)<\/row>/g;
    let rm: RegExpExecArray | null;
    const rows: string[][] = [];
    let formulas = 0;

    while ((rm = rowRegex.exec(xml)) !== null) {
      const rowXml = rm[1];
      const cellRegex = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
      let cm: RegExpExecArray | null;
      const rowVals: string[] = [];
      while ((cm = cellRegex.exec(rowXml)) !== null) {
        const attrs = cm[1];
        const inner = cm[2];
        const tMatch = attrs.match(/\bt="([^"]+)"/);
        const cellType = tMatch ? tMatch[1] : '';
        if (/<f\b/.test(inner)) formulas++;
        const vMatch = inner.match(/<v\b[^>]*>([\s\S]*?)<\/v>/);
        let val = '';
        if (cellType === 's' && vMatch) {
          val = sharedStrings[Number(vMatch[1])] ?? vMatch[1];
        } else if (vMatch) {
          const raw = decodeXml(vMatch[1]);
          const num = Number(raw);
          if (!Number.isNaN(num) && raw.includes('.')) {
            val = Math.abs(num) >= 100 ? num.toFixed(1) : num.toFixed(3);
          } else {
            val = raw;
          }
        }
        if (val.trim()) rowVals.push(val.trim());
      }
      if (rowVals.length > 0) rows.push(rowVals);
    }

    mdLines.push(`\n## Onglet : ${sheetName} (${rows.length} lignes, ${formulas} formules)`);
    const maxPreview = rows.length > 200 ? 15 : 30;
    for (const r of rows.slice(0, maxPreview)) {
      const line = r.slice(0, 10).join(' | ');
      mdLines.push(`  ${line}`);
      if (
        facts.length < 8 &&
        r.length >= 2 &&
        /[A-Za-z]/.test(r[0]) &&
        r.slice(1).some((c) => /\d/.test(c))
      ) {
        const label = r[0].slice(0, 60);
        const vals = r.slice(1, 6).join(' · ');
        facts.push({
          field: `${sheetName} · ${label}`,
          value: vals.slice(0, 110),
          quote: `${label}: ${vals}`.slice(0, 120),
          page_or_time: `Sheet "${sheetName}"`,
          confidence: 0.95,
        });
      }
    }
  }

  return {
    filename,
    markdown: mdLines.join('\n').slice(0, 14000),
    facts,
  };
}
