import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type {
  CitizenProfile,
  DocumentRecord,
  EligibilityResult,
  Locale,
  SchemeRecord,
} from '../types';
import { formatINR } from '../benefits';

export interface MergedDocumentItem {
  doc: DocumentRecord;
  requiredBySchemes: Array<{ id: string; name: string }>;
  held: boolean;
  unlocksCount: number;
  expiryDate?: string;
  isExpiringSoon?: boolean;
}

export function buildMergedDocumentChecklist(
  chosenSchemes: SchemeRecord[],
  allDocuments: DocumentRecord[],
  heldDocKeys: string[],
  locale: Locale = 'en',
  docExpiries: Record<string, string> = {}
): {
  items: MergedDocumentItem[];
  readinessPct: number;
  nextBestDoc: MergedDocumentItem | null;
  estimatedDaysToReady: number;
} {
  const heldSet = new Set(heldDocKeys);
  const docMap = new Map(allDocuments.map((d) => [d.docKey, d]));
  const usageMap = new Map<string, Array<{ id: string; name: string }>>();

  for (const s of chosenSchemes) {
    const schemeName = locale === 'hi' ? s.nameHi : locale === 'gu' ? s.nameGu : s.nameEn;
    for (const key of s.documents) {
      const list = usageMap.get(key) ?? [];
      list.push({ id: s.id, name: schemeName });
      usageMap.set(key, list);
    }
  }

  const now = Date.now();
  const items: MergedDocumentItem[] = [];
  for (const [docKey, schemesList] of usageMap.entries()) {
    const doc = docMap.get(docKey);
    if (!doc) continue;
    const held = heldSet.has(docKey);
    const expiryDate = docExpiries[docKey];
    let isExpiringSoon = false;
    if (expiryDate) {
      const diffDays = (new Date(expiryDate).getTime() - now) / (1000 * 60 * 60 * 24);
      isExpiringSoon = diffDays <= 30;
    }
    items.push({
      doc,
      requiredBySchemes: schemesList,
      held,
      unlocksCount: schemesList.length,
      expiryDate,
      isExpiringSoon,
    });
  }

  items.sort((a, b) => {
    if (a.held !== b.held) return a.held ? 1 : -1;
    return b.unlocksCount - a.unlocksCount;
  });

  const total = items.length;
  const heldCount = items.filter((i) => i.held).length;
  const readinessPct = total === 0 ? 100 : Math.round((heldCount / total) * 100);
  const missing = items.filter((i) => !i.held);
  const nextBestDoc = missing[0] ?? null;

  // Extra Feature #11: Time-to-Apply Estimator (parallel document gathering max typical days)
  const estimatedDaysToReady = missing.reduce(
    (maxD, item) => Math.max(maxD, item.doc.typicalDays),
    0
  );

  return {
    items,
    readinessPct,
    nextBestDoc,
    estimatedDaysToReady,
  };
}

/**
 * Extra Feature #6: Offline .ICS Calendar Export for Deadlines & Document Renewals
 */
export function generateDeadlineICS(
  schemes: SchemeRecord[],
  docExpiries: Record<string, string>,
  allDocuments: DocumentRecord[]
): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Scheme Sathi AI//Offline Calendar//EN',
    'CALSCALE:GREGORIAN',
  ];

  const toICSDate = (iso: string) => iso.replace(/-/g, '').slice(0, 8);

  for (const s of schemes) {
    if (!s.deadline) continue;
    const dt = toICSDate(s.deadline);
    lines.push(
      'BEGIN:VEVENT',
      `UID:scheme-${s.id}@schemesathi.local`,
      `DTSTART;VALUE=DATE:${dt}`,
      `SUMMARY:Scheme Deadline — ${s.nameEn}`,
      `DESCRIPTION:Sample reminder — verify official deadline at ${s.officialUrl}`,
      'END:VEVENT'
    );
  }

  const docMap = new Map(allDocuments.map((d) => [d.docKey, d]));
  for (const [docKey, expiry] of Object.entries(docExpiries)) {
    if (!expiry) continue;
    const dt = toICSDate(expiry);
    const docName = docMap.get(docKey)?.nameEn ?? docKey;
    lines.push(
      'BEGIN:VEVENT',
      `UID:doc-${docKey}@schemesathi.local`,
      `DTSTART;VALUE=DATE:${dt}`,
      `SUMMARY:Renew Document — ${docName}`,
      'DESCRIPTION:Document validity renewal reminder from Scheme Sathi AI.',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Extra Feature #9 + FR-7: Client-side Multi-Page Printable PDF Dossier (pdf-lib)
 */
export async function generateCitizenDossierPDF(params: {
  profile: CitizenProfile;
  schemes: SchemeRecord[];
  evalMap: Map<string, EligibilityResult>;
  documents: MergedDocumentItem[];
  annualTotal: number;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const navy = rgb(0.04, 0.1, 0.24);
  const blue = rgb(0.08, 0.47, 1.0);
  const green = rgb(0.07, 0.72, 0.42);
  const muted = rgb(0.35, 0.42, 0.55);

  let page = pdfDoc.addPage([595, 842]);
  let y = 795;

  const ensureSpace = (needed: number) => {
    if (y - needed < 50) {
      page = pdfDoc.addPage([595, 842]);
      y = 795;
    }
  };

  page.drawText('Scheme Sathi AI — Personal Scheme & Document Dossier', {
    x: 42,
    y,
    size: 16,
    font: bold,
    color: blue,
  });
  y -= 20;
  page.drawText(
    `Profile: ${params.profile.label} | State: ${params.profile.state ?? 'Unspecified'} | Est. Annual Benefit: ${formatINR(params.annualTotal)} (Estimate)`,
    { x: 42, y, size: 10, font, color: navy }
  );
  y -= 15;
  page.drawText(
    'IMPORTANT: Sample data for guidance only. Always verify eligibility & apply on official portals.',
    { x: 42, y, size: 8.5, font: bold, color: muted }
  );
  y -= 26;

  // Section 1: Document Checklist
  page.drawText('1. Combined Document Checklist', {
    x: 42,
    y,
    size: 13,
    font: bold,
    color: navy,
  });
  y -= 18;

  for (const item of params.documents) {
    ensureSpace(32);
    const statusMark = item.held ? '[HAVE]' : '[NEED]';
    const color = item.held ? green : blue;
    page.drawText(
      `${statusMark} ${item.doc.nameEn} (Needed for ${item.unlocksCount} scheme${item.unlocksCount === 1 ? '' : 's'})`,
      { x: 46, y, size: 10, font: bold, color }
    );
    y -= 13;
    page.drawText(`Where: ${item.doc.whereToGetEn.slice(0, 92)}`, {
      x: 56,
      y,
      size: 8.5,
      font,
      color: muted,
    });
    y -= 16;
  }

  y -= 12;
  ensureSpace(40);
  page.drawText('2. Matched Schemes & Next Steps', {
    x: 42,
    y,
    size: 13,
    font: bold,
    color: navy,
  });
  y -= 18;

  for (const s of params.schemes.slice(0, 18)) {
    ensureSpace(58);
    const res = params.evalMap.get(s.id);
    const statusLabel = res ? res.status.toUpperCase() : 'LIKELY';
    page.drawText(
      `• ${s.nameEn} [${statusLabel}] — Est. ${formatINR(s.benefitAmount)}`,
      { x: 46, y, size: 10, font: bold, color: navy }
    );
    y -= 13;
    page.drawText(`Portal: ${s.officialUrl} | Last verified: ${s.lastVerified}`, {
      x: 54,
      y,
      size: 8.5,
      font,
      color: blue,
    });
    y -= 12;
    const step1 = s.steps.en[0] ?? 'Check official portal instructions.';
    page.drawText(`Step 1: ${step1.slice(0, 90)}`, {
      x: 54,
      y,
      size: 8.5,
      font,
      color: muted,
    });
    y -= 17;
  }

  return pdfDoc.save();
}

