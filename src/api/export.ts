import type { ColumnStore, VisibleRange } from '../core/types';

// ─── CSV Export ─────────────────────────────────────────────────────────────

export interface CSVExportOptions {
  /** Include only bars within this date range (Unix timestamps in seconds). */
  from?: number;
  /** Include only bars within this date range (Unix timestamps in seconds). */
  to?: number;
  /** Column separator (default: ','). */
  separator?: string;
  /** Include indicator columns. */
  includeIndicators?: boolean;
}

export interface SeriesInfo {
  label: string;
  store: ColumnStore;
}

export interface IndicatorInfo {
  label: string;
  /** Map of output name -> Float64Array values aligned with source series. */
  outputs: Map<string, Float64Array>;
}

/**
 * Export visible OHLCV data as a CSV string.
 */
export function exportCSV(
  series: SeriesInfo[],
  indicators: IndicatorInfo[],
  range: VisibleRange | null,
  options: CSVExportOptions = {},
): string {
  const sep = options.separator ?? ',';

  if (series.length === 0) return '';

  // Use the first series as the primary time source
  const primaryStore = series[0].store;
  if (primaryStore.length === 0) return '';

  // Determine index range
  let fromIdx = range?.fromIdx ?? 0;
  let toIdx = range?.toIdx ?? primaryStore.length - 1;
  fromIdx = Math.max(0, fromIdx);
  toIdx = Math.min(primaryStore.length - 1, toIdx);

  // Apply time-based filtering
  if (options.from !== undefined) {
    while (fromIdx <= toIdx && primaryStore.time[fromIdx] < options.from) fromIdx++;
  }
  if (options.to !== undefined) {
    while (toIdx >= fromIdx && primaryStore.time[toIdx] > options.to) toIdx--;
  }

  if (fromIdx > toIdx) return '';

  // Build header
  const headers: string[] = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume'];

  // Add additional series columns
  for (let s = 1; s < series.length; s++) {
    const label = series[s].label || `Series ${s + 1}`;
    headers.push(`${label} Open`, `${label} High`, `${label} Low`, `${label} Close`);
  }

  // Add indicator columns
  if (options.includeIndicators !== false) {
    for (const ind of indicators) {
      for (const outputName of ind.outputs.keys()) {
        headers.push(ind.label ? `${ind.label} ${outputName}` : outputName);
      }
    }
  }

  const rows: string[] = [headers.join(sep)];

  for (let i = fromIdx; i <= toIdx; i++) {
    const time = primaryStore.time[i];
    const date = new Date(time * 1000).toISOString();
    const fields: string[] = [
      date,
      String(primaryStore.open[i]),
      String(primaryStore.high[i]),
      String(primaryStore.low[i]),
      String(primaryStore.close[i]),
      String(primaryStore.volume[i]),
    ];

    // Additional series
    for (let s = 1; s < series.length; s++) {
      const store = series[s].store;
      if (i < store.length) {
        fields.push(
          String(store.open[i]),
          String(store.high[i]),
          String(store.low[i]),
          String(store.close[i]),
        );
      } else {
        fields.push('', '', '', '');
      }
    }

    // Indicators
    if (options.includeIndicators !== false) {
      for (const ind of indicators) {
        for (const values of ind.outputs.values()) {
          const val = i < values.length ? values[i] : NaN;
          fields.push(isNaN(val) ? '' : String(val));
        }
      }
    }

    rows.push(fields.join(sep));
  }

  return rows.join('\n');
}

// ─── SVG Export ─────────────────────────────────────────────────────────────

/**
 * Generate an SVG string from a screenshot canvas.
 * The canvas pixel data is embedded as a base64 PNG <image> element within
 * an SVG wrapper, preserving the exact chart appearance including themes
 * and annotations.
 */
export function exportSVG(screenshotCanvas: HTMLCanvasElement): string {
  const w = screenshotCanvas.width;
  const h = screenshotCanvas.height;
  const dataURL = screenshotCanvas.toDataURL('image/png');

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    `  <image width="${w}" height="${h}" xlink:href="${dataURL}" />`,
    `</svg>`,
  ].join('\n');
}

// ─── PDF Export ─────────────────────────────────────────────────────────────

export interface PDFExportOptions {
  /** Paper size (default: 'letter'). */
  pageSize?: 'letter' | 'a4';
  /** Page orientation (default: 'landscape'). */
  orientation?: 'portrait' | 'landscape';
  /** Optional title text at top of page. */
  title?: string;
}

// PDF page dimensions in points (1 point = 1/72 inch)
const PAGE_SIZES = {
  letter: { width: 612, height: 792 },
  a4: { width: 595.28, height: 841.89 },
};

/**
 * Generate a minimal PDF document containing the chart image.
 *
 * Uses a minimal PDF 1.4 generator (no external dependencies) that embeds
 * the chart as a JPEG image stream.
 */
export function exportPDF(
  screenshotCanvas: HTMLCanvasElement,
  options: PDFExportOptions = {},
): Blob {
  const pageSize = PAGE_SIZES[options.pageSize ?? 'letter'];
  const isLandscape = (options.orientation ?? 'landscape') === 'landscape';
  const pageW = isLandscape ? pageSize.height : pageSize.width;
  const pageH = isLandscape ? pageSize.width : pageSize.height;

  // Get image data as JPEG
  const dataURL = screenshotCanvas.toDataURL('image/jpeg', 0.95);
  const base64 = dataURL.split(',')[1];
  const binaryStr = atob(base64);
  const imageBytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    imageBytes[i] = binaryStr.charCodeAt(i);
  }

  // Compute image placement (fit to page with margins)
  const margin = 36; // 0.5 inch
  const titleHeight = options.title ? 24 : 0;
  const availW = pageW - 2 * margin;
  const availH = pageH - 2 * margin - titleHeight;
  const imgAspect = screenshotCanvas.width / screenshotCanvas.height;
  const areaAspect = availW / availH;

  let imgW: number, imgH: number;
  if (imgAspect > areaAspect) {
    imgW = availW;
    imgH = availW / imgAspect;
  } else {
    imgH = availH;
    imgW = availH * imgAspect;
  }

  const imgX = margin + (availW - imgW) / 2;
  const imgY = margin + (availH - imgH) / 2;

  // Build minimal PDF
  const objects: string[] = [];
  const offsets: number[] = [];
  let currentOffset = 0;

  function addObject(content: string, stream?: Uint8Array): number {
    const id = objects.length + 1;
    let obj: string;
    if (stream) {
      obj = `${id} 0 obj\n${content}\nendobj\n`;
    } else {
      obj = `${id} 0 obj\n${content}\nendobj\n`;
    }
    offsets.push(currentOffset);
    objects.push(obj);
    currentOffset += new TextEncoder().encode(obj).length;
    if (stream) {
      currentOffset += stream.length + 1; // +1 for newline before endstream
    }
    return id;
  }

  // Object 1: Catalog
  const catalogId = addObject('<< /Type /Catalog /Pages 2 0 R >>');

  // Object 2: Pages
  const pagesId = addObject(`<< /Type /Pages /Kids [3 0 R] /Count 1 >>`);

  // Object 3: Page
  const pageId = addObject(
    `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 5 0 R /Resources << /XObject << /Img 4 0 R >> /Font << /F1 6 0 R >> >> >>`,
  );

  // Object 4: Image XObject (placeholder - we'll handle inline)
  const imageStreamHeader = `<< /Type /XObject /Subtype /Image /Width ${screenshotCanvas.width} /Height ${screenshotCanvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>`;
  addObject(imageStreamHeader);

  // Object 5: Page content stream
  let contentStr = '';
  if (options.title) {
    const titleY = pageH - margin - 14;
    contentStr += `BT /F1 14 Tf ${margin} ${titleY} Td (${escapePDFString(options.title)}) Tj ET\n`;
  }
  contentStr += `q ${imgW} 0 0 ${imgH} ${imgX} ${imgY} cm /Img Do Q\n`;
  const contentBytes = new TextEncoder().encode(contentStr);
  addObject(`<< /Length ${contentBytes.length} >>`);

  // Object 6: Font
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  // Now build the final PDF manually with binary streams
  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const parts: (string | Uint8Array)[] = [header];

  // Re-calculate offsets properly
  const realOffsets: number[] = [];
  let pos = new TextEncoder().encode(header).length;

  // Object 1: Catalog
  const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  realOffsets.push(pos);
  parts.push(obj1);
  pos += new TextEncoder().encode(obj1).length;

  // Object 2: Pages
  const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  realOffsets.push(pos);
  parts.push(obj2);
  pos += new TextEncoder().encode(obj2).length;

  // Object 3: Page
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 5 0 R /Resources << /XObject << /Img 4 0 R >> /Font << /F1 6 0 R >> >> >>\nendobj\n`;
  realOffsets.push(pos);
  parts.push(obj3);
  pos += new TextEncoder().encode(obj3).length;

  // Object 4: Image
  const imgHeader = `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${screenshotCanvas.width} /Height ${screenshotCanvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`;
  const imgFooter = `\nendstream\nendobj\n`;
  realOffsets.push(pos);
  parts.push(imgHeader);
  pos += new TextEncoder().encode(imgHeader).length;
  parts.push(imageBytes);
  pos += imageBytes.length;
  parts.push(imgFooter);
  pos += new TextEncoder().encode(imgFooter).length;

  // Object 5: Content stream
  const obj5Header = `5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`;
  const obj5Footer = `\nendstream\nendobj\n`;
  realOffsets.push(pos);
  parts.push(obj5Header);
  pos += new TextEncoder().encode(obj5Header).length;
  parts.push(contentBytes);
  pos += contentBytes.length;
  parts.push(obj5Footer);
  pos += new TextEncoder().encode(obj5Footer).length;

  // Object 6: Font
  const obj6 = `6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;
  realOffsets.push(pos);
  parts.push(obj6);
  pos += new TextEncoder().encode(obj6).length;

  // Cross-reference table
  const xrefStart = pos;
  const xref = [
    'xref',
    `0 ${realOffsets.length + 1}`,
    '0000000000 65535 f ',
    ...realOffsets.map((off) => `${String(off).padStart(10, '0')} 00000 n `),
  ].join('\n') + '\n';
  parts.push(xref);

  // Trailer
  const trailer = `trailer\n<< /Size ${realOffsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  parts.push(trailer);

  // Combine into Blob
  const blobParts: BlobPart[] = parts.map((p) =>
    typeof p === 'string' ? new TextEncoder().encode(p).buffer as ArrayBuffer : p.buffer as ArrayBuffer,
  );
  return new Blob(blobParts, { type: 'application/pdf' });
}

function escapePDFString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
