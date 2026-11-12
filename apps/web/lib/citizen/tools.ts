import type {
  ApplicationRecord,
  CitizenProfile,
  EligibilityResult,
  Locale,
  SchemeRecord,
} from '../types';

/**
 * Extra Feature #19: Phonetic / Hinglish / Gujarati query expansion for offline Fuse.js search
 */
const SYNONYM_MAP: Record<string, string[]> = {
  kisan: ['farmer', 'agriculture', 'crop', 'pm-kisan', 'krishi'],
  krishi: ['farmer', 'agriculture', 'kisan'],
  khedut: ['farmer', 'agriculture', 'gujarat'],
  vidhwa: ['widow', 'pension', 'swarupa'],
  mahila: ['women', 'woman', 'female', 'maternity', 'shg', 'lakhpati'],
  bahen: ['women', 'woman', 'female'],
  chhatravritti: ['scholarship', 'student', 'education', 'tuition'],
  vidyarthi: ['student', 'education', 'scholarship'],
  awas: ['housing', 'house', 'home', 'pmay'],
  ghar: ['housing', 'house', 'home'],
  bima: ['insurance', 'accident', 'health', 'ayushman'],
  swasthya: ['health', 'ayushman', 'hospital'],
  aarogya: ['health', 'ayushman', 'medical'],
  rozgar: ['employment', 'job', 'mgnrega', 'wage', 'mudra'],
  kaam: ['employment', 'worker', 'shramik'],
  shramik: ['worker', 'labour', 'eshram', 'bocw'],
  vridh: ['senior', 'elderly', 'pension', 'old'],
  bujurg: ['senior', 'elderly', 'pension'],
  divyang: ['disability', 'disabled', 'handicapped'],
  viklang: ['disability', 'disabled'],
  udyam: ['entrepreneur', 'business', 'loan', 'mudra', 'msme'],
  dhandha: ['business', 'entrepreneur', 'mudra'],
  rashan: ['ration', 'food', 'nfsa', 'grain'],
  anaaj: ['ration', 'food', 'nfsa'],
  gas: ['lpg', 'ujjwala', 'cylinder'],
};

export function expandSmartQuery(raw: string): string {
  const cleaned = raw.trim().toLowerCase();
  if (!cleaned) return '';
  const tokens = cleaned.split(/\s+/);
  const expanded = new Set<string>(tokens);
  for (const t of tokens) {
    const syns = SYNONYM_MAP[t];
    if (syns) syns.forEach((s) => expanded.add(s));
  }
  return [...expanded].join(' ');
}

/**
 * Extra Feature #21: Deadline Urgency & Countdown Calculator
 */
export interface DeadlineUrgency {
  daysRemaining: number | null;
  badgeText: string;
  urgencyLevel: 'urgent' | 'soon' | 'rolling' | 'closed';
}

export function getDeadlineUrgency(deadline: string | null | undefined, now = new Date()): DeadlineUrgency {
  if (!deadline || deadline.toLowerCase().includes('rolling') || deadline.toLowerCase().includes('open')) {
    return { daysRemaining: null, badgeText: 'Rolling / Open', urgencyLevel: 'rolling' };
  }
  const parsed = Date.parse(deadline);
  if (Number.isNaN(parsed)) {
    return { daysRemaining: null, badgeText: deadline, urgencyLevel: 'rolling' };
  }
  const diffDays = Math.ceil((parsed - now.getTime()) / 86_400_000);
  if (diffDays < 0) {
    return { daysRemaining: diffDays, badgeText: 'Cycle Closed', urgencyLevel: 'closed' };
  }
  if (diffDays <= 14) {
    return { daysRemaining: diffDays, badgeText: `Closing in ${diffDays}d`, urgencyLevel: 'urgent' };
  }
  if (diffDays <= 45) {
    return { daysRemaining: diffDays, badgeText: `${diffDays}d left`, urgencyLevel: 'soon' };
  }
  return { daysRemaining: diffDays, badgeText: deadline, urgencyLevel: 'rolling' };
}

/**
 * Extra Feature #23: Personalised "Unlock Next Scheme" 1-Step Gap Roadmap
 */
export interface UnlockGapItem {
  scheme: SchemeRecord;
  status: 'not_eligible' | 'likely';
  blockingField: string;
  hint: string;
  annualGainRs: number;
}

export function computeUnlockRoadmap(
  schemes: SchemeRecord[],
  evaluations: Map<string, EligibilityResult>
): UnlockGapItem[] {
  const items: UnlockGapItem[] = [];
  for (const s of schemes) {
    const ev = evaluations.get(s.id);
    if (!ev || ev.status === 'eligible') continue;
    if (ev.status === 'not_eligible' && ev.near_miss) {
      items.push({
        scheme: s,
        status: 'not_eligible',
        blockingField: ev.near_miss.field,
        hint: `Single rule gap: ${ev.near_miss.field.replace(/_/g, ' ')} (off by ${ev.near_miss.distance} ${ev.near_miss.unit})`,
        annualGainRs: s.benefitPeriod === 'monthly' ? s.benefitAmount * 12 : s.benefitAmount,
      });
    } else if (ev.status === 'likely') {
      const unknown = ev.criteria.filter((c) => c.passed === null);
      if (unknown.length === 1) {
        items.push({
          scheme: s,
          status: 'likely',
          blockingField: unknown[0].field,
          hint: unknown[0].hint || `Add ${unknown[0].field.replace(/_/g, ' ')} to confirm`,
          annualGainRs: s.benefitPeriod === 'monthly' ? s.benefitAmount * 12 : s.benefitAmount,
        });
      }
    }
  }
  return items.sort((a, b) => b.annualGainRs - a.annualGainRs);
}

/**
 * Extra Feature #18: Offline Grievance / RTI Section 6(1) / Follow-up Letter Generator
 */
export type LetterKind = 'grievance' | 'rti' | 'followup';

export function generateCitizenLetter(params: {
  kind: LetterKind;
  locale: Locale;
  citizenName: string;
  state: string;
  schemeName: string;
  applicationRef?: string;
  daysPending?: number;
}): string {
  const today = new Date().toISOString().slice(0, 10);
  const ref = params.applicationRef?.trim() || '[APPLICATION_REF_NO]';
  const days = params.daysPending ?? 30;

  if (params.locale === 'hi') {
    if (params.kind === 'rti') {
      return `सेवा में,\nजन सूचना अधिकारी (PIO),\nसंबंधित विभाग, ${params.state}\nदिनांक: ${today}\n\nविषय: सूचना का अधिकार अधिनियम, 2005 की धारा 6(1) के अंतर्गत आवेदन — ${params.schemeName}\n\nमहोदय/महोदया,\nमैं ${params.citizenName} (${params.state}) निम्नलिखित जानकारी चाहता/चाहती हूँ:\n1. आवेदन संदर्भ संख्या ${ref} की वर्तमान स्थिति और लंबित रहने का कारण।\n2. क्या सभी संलग्न दस्तावेज़ सत्यापित हो चुके हैं?\n3. स्वीकृति एवं लाभ अंतरण की अपेक्षित समय-सीमा।\n\nभवदीय,\n${params.citizenName}\n(कृपया आधिकारिक पोर्टल पर विवरण सत्यापित करें)`;
    }
    return `सेवा में,\nजिला नोडल अधिकारी / शिकायत निवारण प्रकोष्ठ,\n${params.state}\nदिनांक: ${today}\n\nविषय: ${params.schemeName} (संदर्भ: ${ref}) के संबंध में ${params.kind === 'followup' ? 'स्मरण पत्र' : 'शिकायत निवारण आवेदन'}\n\nमहोदय/महोदया,\nमेरा आवेदन (${ref}) पिछले ${days} दिनों से लंबित है। कृपया दस्तावेज़ों की पुनः जांच कर शीघ्र कार्यवाही करने की कृपा करें।\n\nभवदीय,\n${params.citizenName}`;
  }

  if (params.locale === 'gu') {
    if (params.kind === 'rti') {
      return `પ્રતિ,\nજાહેર માહિતી અધિકારી (PIO),\nસંબંધિત વિભાગ, ${params.state}\nતારીખ: ${today}\n\nવિષય: માહિતી અધિકાર અધિનિયમ, 2005 ની કલમ 6(1) હેઠળ અરજી — ${params.schemeName}\n\nમાનનીય સાહેબશ્રી,\nહું ${params.citizenName} (${params.state}) નીચેની માહિતી માંગું છું:\n1. અરજી નંબર ${ref} ની હાલની સ્થિતિ અને વિલંબનું કારણ.\n2. જોડાયેલ દસ્તાવેજોની ચકાસણી પૂર્ણ થઈ છે કે કેમ.\n3. મંજૂરી અને લાભ વિતરણની અપેક્ષિત સમયમર્યાદા.\n\nઆપનો વિશ્વાસુ,\n${params.citizenName}`;
    }
    return `પ્રતિ,\nજિલ્લા નોડલ અધિકારી / ફરિયાદ નિવારણ કક્ષ,\n${params.state}\nતારીખ: ${today}\n\nવિષય: ${params.schemeName} (સંદર્ભ: ${ref}) અંગે ${params.kind === 'followup' ? 'રિમાઇન્ડર પત્ર' : 'ફરિયાદ અરજી'}\n\nમાનનીય સાહેબશ્રી,\nમારી અરજી (${ref}) છેલ્લા ${days} દિવસથી પડતર છે. કૃપા કરીને ઝડપી નિકાલ કરવા વિનંતી.\n\nઆપનો વિશ્વાસુ,\n${params.citizenName}`;
  }

  if (params.kind === 'rti') {
    return `To,\nThe Public Information Officer (PIO),\nDepartment of Welfare / Nodal Office, ${params.state}\nDate: ${today}\n\nSubject: Application under Section 6(1) of the Right to Information Act, 2005 — ${params.schemeName}\n\nSir/Madam,\nI, ${params.citizenName}, resident of ${params.state}, request the following information regarding my application (Reference: ${ref}):\n1. Current processing stage and file movement log for application ${ref}.\n2. Specific reason(s) for delay beyond the citizen charter timeline (${days} days elapsed).\n3. Name and designation of the officer currently assigned to verify this application.\n\nYours faithfully,\n${params.citizenName}\n[Local draft generated by Scheme Sathi AI — verify official office address before submission]`;
  }

  return `To,\nThe District Nodal Officer / Grievance Cell (CPGRAMS),\n${params.state}\nDate: ${today}\n\nSubject: ${params.kind === 'followup' ? 'Follow-Up Reminder' : 'Grievance Petition'} regarding ${params.schemeName} (Ref: ${ref})\n\nSir/Madam,\nI am ${params.citizenName} from ${params.state}. My application under ${params.schemeName} (Reference No: ${ref}) has been pending for ${days} days.\n\nI have verified that my required documents are in order. Kindly review the pending verification and update the portal status at the earliest.\n\nYours sincerely,\n${params.citizenName}\n[Draft only — submit via the official state/central grievance portal]`;
}

/**
 * Extra Feature #20: Deterministic SVG Citizen Pass Matrix (Offline QR-style visual grid)
 */
export function buildCitizenPassGrid(seedText: string, size = 15): boolean[][] {
  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  // Finder corners
  const markFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        grid[r0 + r][c0 + c] =
          r === 0 || r === 4 || c === 0 || c === 4 || (r === 2 && c === 2);
      }
    }
  };
  markFinder(0, 0);
  markFinder(0, size - 5);
  markFinder(size - 5, 0);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inFinder =
        (r < 6 && c < 6) ||
        (r < 6 && c >= size - 6) ||
        (r >= size - 6 && c < 6);
      if (inFinder) continue;
      hash ^= (r * 31 + c * 17 + 7);
      hash = Math.imul(hash, 16777619);
      grid[r][c] = (Math.abs(hash) % 100) < 48;
    }
  }
  return grid;
}

/**
 * Extra Feature #34: Document Pre-Flight Verification Checklist
 */
export const DOC_PREFLIGHT_CHECKS: Record<string, string[]> = {
  aadhaar: [
    'Mobile number linked for OTP e-KYC',
    'Name spelling matches Bank Passbook exactly',
    'NPCI Aadhaar-Bank DBT seeding active',
  ],
  bank_passbook: [
    'Account is active (not dormant) and in applicant name',
    'IFSC code clearly printed after any bank merger',
  ],
  income_certificate: [
    'Issued within the current financial year / valid expiry date',
    'Signed digitally by Tehsildar / Mamlatdar with QR/barcode',
  ],
  caste_certificate: [
    'Category (SC/ST/OBC/EWS) matches state/central list format',
    'OBC Non-Creamy Layer (NCL) certificate is current-year if required',
  ],
  land_record: [
    '7/12 Extract / Khatauni shows applicant name & exact hectares',
    'Mutation entry completed in revenue record',
  ],
  ration_card: [
    'All family members listed with Aadhaar e-KYC completed',
    'Card type (AAY / BPL / PHH) clearly visible',
  ],
  bpl_card: [
    'SECC / BPL survey number legible on card',
  ],
  disability_certificate: [
    'UDID card or CMO board certificate showing >= 40% disability',
  ],
};

/**
 * Extra Feature #35: Offline Issuing Office & CSC Directory
 */
export interface IssuingOfficeGuide {
  docKey: string;
  officeEn: string;
  officeHi: string;
  officeGu: string;
  feeHint: string;
  typicalDays: number;
}

export const ISSUING_OFFICE_DIRECTORY: IssuingOfficeGuide[] = [
  {
    docKey: 'income_certificate',
    officeEn: 'Tehsildar / Mamlatdar / e-Gram / Digital Gujarat / Jan Seva Kendra',
    officeHi: 'तहसीलदार कार्यालय / जन सेवा केंद्र (CSC) / ई-जिला पोर्टल',
    officeGu: 'મામલતદાર કચેરી / ઈ-ગ્રામ / ડિજિટલ ગુજરાત પોર્ટલ',
    feeHint: 'Rs. 20–50 nominal CSC fee',
    typicalDays: 7,
  },
  {
    docKey: 'caste_certificate',
    officeEn: 'SDM / Social Welfare Office / Taluka Panchayat / CSC',
    officeHi: 'एसडीएम कार्यालय / समाज कल्याण विभाग / जन सेवा केंद्र',
    officeGu: 'તાલુકા પંચાયત / સમાજ કલ્યાણ કચેરી / CSC',
    feeHint: 'Rs. 20–50 nominal CSC fee',
    typicalDays: 10,
  },
  {
    docKey: 'land_record',
    officeEn: 'Talati / Patwari / AnyROR / Bhulekh Portal',
    officeHi: 'पटवारी / भूलेख पोर्टल / तहसील',
    officeGu: 'તલાટી કચેરી / AnyROR પોર્ટલ (7/12 ઉતારો)',
    feeHint: 'Rs. 5–20 per certified copy',
    typicalDays: 3,
  },
  {
    docKey: 'aadhaar',
    officeEn: 'Aadhaar Seva Kendra / Post Office / Bank Branch',
    officeHi: 'आधार सेवा केंद्र / डाकघर / बैंक शाखा',
    officeGu: 'આધાર સેવા કેન્દ્ર / પોસ્ટ ઓફિસ / બેંક શાખા',
    feeHint: 'Rs. 50 update fee',
    typicalDays: 5,
  },
  {
    docKey: 'bank_passbook',
    officeEn: 'Nearest Nationalized / Gramin Bank Branch (request DBT NPCI seeding)',
    officeHi: 'नजदीकी बैंक शाखा (NPCI DBT सीडिंग फॉर्म भरें)',
    officeGu: 'નજીકની બેંક શાખા (NPCI DBT સીડિંગ કરાવો)',
    feeHint: 'Zero-balance Jan Dhan account free',
    typicalDays: 2,
  },
  {
    docKey: 'disability_certificate',
    officeEn: 'District Civil Hospital CMO Board / Swavlamban UDID Portal',
    officeHi: 'जिला अस्पताल मेडिकल बोर्ड / स्वावलंबन UDID पोर्टल',
    officeGu: 'જિલ્લા સિવિલ હોસ્પિટલ મેડિકલ બોર્ડ / UDID પોર્ટલ',
    feeHint: 'Free',
    typicalDays: 14,
  },
];

/**
 * Extra Feature #38: RFC-4180 CSV Exporter
 */
function csvEscape(val: unknown): string {
  const s = String(val ?? '');
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportSchemesCsv(
  rows: Array<{ scheme: SchemeRecord; evaluation?: EligibilityResult }>
): string {
  const header = [
    'scheme_id',
    'name',
    'level',
    'state',
    'category',
    'benefit_amount_rs',
    'benefit_period',
    'status',
    'deadline',
    'official_url',
    'is_sample',
  ];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.scheme.id,
        r.scheme.nameEn,
        r.scheme.level,
        r.scheme.state,
        r.scheme.category,
        r.scheme.benefitAmount,
        r.scheme.benefitPeriod,
        r.evaluation?.status ?? 'unknown',
        r.scheme.deadline ?? 'Rolling',
        r.scheme.officialUrl,
        'SAMPLE_VERIFY_BEFORE_USE',
      ]
        .map(csvEscape)
        .join(',')
    );
  }
  return lines.join('\n');
}

export function exportApplicationsCsv(
  apps: ApplicationRecord[],
  schemeById: Map<string, SchemeRecord>
): string {
  const header = [
    'scheme_id',
    'scheme_name',
    'status',
    'reference_no',
    'remind_on',
    'updated_at',
    'notes',
  ];
  const lines = [header.join(',')];
  for (const a of apps) {
    lines.push(
      [
        a.schemeId,
        schemeById.get(a.schemeId)?.nameEn ?? a.schemeId,
        a.status,
        a.referenceNo ?? '',
        a.remindOn ?? '',
        a.updatedAt,
        a.notes ?? '',
      ]
        .map(csvEscape)
        .join(',')
    );
  }
  return lines.join('\n');
}

/**
 * Extra Feature #42: Offline SMS / WhatsApp Plain-Text Summary Composer
 */
export function composePlainTextSummary(params: {
  locale: Locale;
  profile: CitizenProfile;
  eligibleSchemes: SchemeRecord[];
  missingDocs: string[];
}): string {
  const topNames = params.eligibleSchemes
    .slice(0, 5)
    .map((s, idx) => `${idx + 1}. ${s.nameEn} (Rs.${s.benefitAmount.toLocaleString('en-IN')}/${s.benefitPeriod})`)
    .join('\n');
  const docsText = params.missingDocs.length > 0 ? params.missingDocs.join(', ') : 'None';

  if (params.locale === 'hi') {
    return `योजना साथी AI सारांश (${params.profile.label})\nपात्र योजनाएं (${params.eligibleSchemes.length}):\n${topNames || 'कोई नहीं'}\n\nबाकी दस्तावेज़: ${docsText}\nनोट: यह सैंपल आकलन है — आवेदन से पहले आधिकारिक पोर्टल पर सत्यापन करें।`;
  }
  if (params.locale === 'gu') {
    return `યોજના સાથી AI સારાંશ (${params.profile.label})\nપાત્ર યોજનાઓ (${params.eligibleSchemes.length}):\n${topNames || 'કોઈ નહીં'}\n\nબાકી દસ્તાવેજો: ${docsText}\nનોંધ: આ સેમ્પલ અંદાજ છે — અરજી પહેલાં સત્તાવાર પોર્ટલ પર ચકાસો.`;
  }
  return `Scheme Sathi AI Summary (${params.profile.label})\nEligible Schemes (${params.eligibleSchemes.length}):\n${topNames || 'None matched yet'}\n\nMissing Documents: ${docsText}\nNote: Sample local estimate — verify on official portal before applying.`;
}

