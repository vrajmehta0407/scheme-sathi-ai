import { z } from 'zod';
import type {
  CitizenProfile,
  IncomeBandId,
  NormalizedProfile,
  SchemeRuleTree,
} from '../types';

export const INCOME_BANDS: Record<
  IncomeBandId,
  { min: number; max: number; midpoint: number; labelEn: string; labelHi: string; labelGu: string }
> = {
  below_1l: {
    min: 0,
    max: 100000,
    midpoint: 65000,
    labelEn: 'Below ₹1 Lakh',
    labelHi: '₹1 लाख से कम',
    labelGu: '₹1 લાખથી ઓછી',
  },
  '1l_to_2_5l': {
    min: 100001,
    max: 250000,
    midpoint: 175000,
    labelEn: '₹1L – ₹2.5L',
    labelHi: '₹1 – ₹2.5 लाख',
    labelGu: '₹1 – ₹2.5 લાખ',
  },
  '2_5l_to_5l': {
    min: 250001,
    max: 500000,
    midpoint: 375000,
    labelEn: '₹2.5L – ₹5L',
    labelHi: '₹2.5 – ₹5 लाख',
    labelGu: '₹2.5 – ₹5 લાખ',
  },
  '5l_to_8l': {
    min: 500001,
    max: 800000,
    midpoint: 650000,
    labelEn: '₹5L – ₹8L',
    labelHi: '₹5 – ₹8 लाख',
    labelGu: '₹5 – ₹8 લાખ',
  },
  above_8l: {
    min: 800001,
    max: 2500000,
    midpoint: 1100000,
    labelEn: 'Above ₹8 Lakh',
    labelHi: '₹8 लाख से अधिक',
    labelGu: '₹8 લાખથી વધુ',
  },
};

export const INDIAN_STATES = [
  'Gujarat',
  'Maharashtra',
  'Rajasthan',
  'Uttar Pradesh',
  'Bihar',
  'Madhya Pradesh',
  'Karnataka',
  'Tamil Nadu',
  'Andhra Pradesh',
  'Telangana',
  'Kerala',
  'West Bengal',
  'Odisha',
  'Punjab',
  'Haryana',
  'Assam',
  'Jharkhand',
  'Chhattisgarh',
  'Uttarakhand',
  'Himachal Pradesh',
  'Delhi',
  'Jammu & Kashmir',
] as const;

export const citizenProfileSchema = z.object({
  id: z.string().min(1).default('guest-primary'),
  label: z.string().min(1).max(60).default('My Profile'),
  state: z.string().optional(),
  district: z.string().optional(),
  district_type: z.enum(['rural', 'semi_urban', 'urban']).optional(),
  age: z.number().int().min(0).max(120).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  income_band: z
    .enum(['below_1l', '1l_to_2_5l', '2_5l_to_5l', '5l_to_8l', 'above_8l'])
    .optional(),
  income: z.number().min(0).max(100000000).optional(),
  occupation: z
    .enum([
      'farmer',
      'student',
      'worker',
      'artisan',
      'entrepreneur',
      'salaried',
      'unemployed',
      'retired',
    ])
    .optional(),
  category: z.enum(['General', 'OBC', 'SC', 'ST', 'EWS']).optional(),
  disability: z.boolean().optional(),
  family_size: z.number().int().min(1).max(30).optional(),
  land_hectares: z.number().min(0).max(500).optional(),
  education: z
    .enum([
      'none',
      'primary',
      'secondary',
      'higher_secondary',
      'diploma',
      'graduate',
      'postgraduate',
    ])
    .optional(),
  is_bpl: z.boolean().optional(),
  is_widow: z.boolean().optional(),
  is_income_tax_payer: z.boolean().optional(),
  owns_pucca_house: z.boolean().optional(),
  held_documents: z.array(z.string()).default([]),
  doc_expiries: z.record(z.string(), z.string()).optional(),
});

const TRACKED_PROFILE_FIELDS = [
  'state',
  'district_type',
  'age',
  'gender',
  'income',
  'occupation',
  'category',
  'disability',
  'family_size',
  'land_hectares',
  'education',
  'is_bpl',
  'is_widow',
  'is_income_tax_payer',
  'owns_pucca_house',
] as const;

export function normalizeProfile(raw: Partial<CitizenProfile>): NormalizedProfile {
  const parsed = citizenProfileSchema.parse({
    id: raw.id ?? 'guest-primary',
    label: raw.label ?? 'My Profile',
    ...raw,
    held_documents: raw.held_documents ?? [],
  });

  let incomeRange: [number, number] | null = null;
  let effectiveIncome = parsed.income;

  if (parsed.income !== undefined) {
    incomeRange = [parsed.income, parsed.income];
  } else if (parsed.income_band) {
    const band = INCOME_BANDS[parsed.income_band];
    incomeRange = [band.min, band.max];
    effectiveIncome = band.midpoint;
  }

  let ageGroup: NormalizedProfile['ageGroup'] = 'unknown';
  let isSenior: boolean | null = null;
  if (parsed.age !== undefined) {
    if (parsed.age < 18) ageGroup = 'child';
    else if (parsed.age <= 35) ageGroup = 'youth';
    else if (parsed.age < 60) ageGroup = 'adult';
    else ageGroup = 'senior';
    isSenior = parsed.age >= 60;
  }

  const normalized: NormalizedProfile = {
    ...parsed,
    income: effectiveIncome,
    knownFields: [],
    unknownFields: [],
    incomeRange,
    ageGroup,
    isSenior,
  };

  for (const field of TRACKED_PROFILE_FIELDS) {
    const val = normalized[field];
    if (val === undefined || val === null || val === '') {
      normalized.unknownFields.push(field);
    } else {
      normalized.knownFields.push(field);
    }
  }

  return normalized;
}

export interface WizardQuestionSpec {
  id: string;
  field: keyof CitizenProfile;
  titleEn: string;
  titleHi: string;
  titleGu: string;
  subEn: string;
  subHi: string;
  subGu: string;
}

export const WIZARD_QUESTIONS: WizardQuestionSpec[] = [
  {
    id: 'occupation',
    field: 'occupation',
    titleEn: 'What best describes your primary work?',
    titleHi: 'आपका मुख्य कार्य या व्यवसाय क्या है?',
    titleGu: 'તમારો મુખ્ય વ્યવસાય અથવા કામ શું છે?',
    subEn: 'Unlocks targeted farmer, student, worker, or business schemes.',
    subHi: 'किसान, छात्र, श्रमिक या उद्यमी योजनाएं तुरंत फ़िल्टर होती हैं।',
    subGu: 'ખેડૂત, વિદ્યાર્થી, શ્રમિક કે ઉદ્યોગસાહસિક યોજનાઓ અલગ તારવે છે.',
  },
  {
    id: 'state',
    field: 'state',
    titleEn: 'Which state and area do you live in?',
    titleHi: 'आप किस राज्य और क्षेत्र में रहते हैं?',
    titleGu: 'તમે કયા રાજ્ય અને વિસ્તારમાં રહો છો?',
    subEn: 'Includes both Central and State-level benefits.',
    subHi: 'केंद्र और राज्य दोनों स्तर की योजनाएं शामिल होती हैं।',
    subGu: 'કેન્દ્ર અને રાજ્ય બંને સ્તરની યોજનાઓ આવરી લે છે.',
  },
  {
    id: 'income_band',
    field: 'income_band',
    titleEn: 'What is your annual household income?',
    titleHi: 'आपके परिवार की वार्षिक आय कितनी है?',
    titleGu: 'તમારા પરિવારની વાર્ષિક આવક કેટલી છે?',
    subEn: 'Skip if unsure — we mark income-capped schemes as Likely.',
    subHi: 'निश्चित न हों तो छोड़ सकते हैं — ऐसी योजनाएं "संभावित" दिखेंगी।',
    subGu: 'ચોક્કસ ખબર ન હોય તો છોડી દો — તે યોજનાઓ "સંભવિત" દેખાશે.',
  },
  {
    id: 'age',
    field: 'age',
    titleEn: 'How old are you?',
    titleHi: 'आपकी आयु कितनी है?',
    titleGu: 'તમારી ઉંમર કેટલી છે?',
    subEn: 'Checks youth scholarships, maternity, and 60+ / 70+ pensions.',
    subHi: 'छात्रवृत्ति, मातृत्व और 60+ / 70+ पेंशन की जांच के लिए।',
    subGu: 'શિષ્યવૃત્તિ, માતૃત્વ અને 60+ / 70+ પેન્શન તપાસવા માટે.',
  },
  {
    id: 'gender',
    field: 'gender',
    titleEn: 'What is your gender?',
    titleHi: 'आपका लिंग क्या है?',
    titleGu: 'તમારી જાતિ (Gender) શું છે?',
    subEn: 'Matches women-centric grants, scholarships, and savings.',
    subHi: 'महिला केंद्रित अनुदान और छात्रवृत्तियां दिखाता है।',
    subGu: 'મહિલા કેન્દ્રિત સહાય અને શિષ્યવૃત્તિઓ દર્શાવે છે.',
  },
  {
    id: 'category',
    field: 'category',
    titleEn: 'Which social category do you belong to?',
    titleHi: 'आप किस सामाजिक श्रेणी से आते हैं?',
    titleGu: 'તમે કયા સામાજિક વર્ગમાં આવો છો?',
    subEn: 'Many scholarships and housing grants depend on category.',
    subHi: 'कई छात्रवृत्ति और आवास योजनाएं श्रेणी पर आधारित होती हैं।',
    subGu: 'ઘણી શિષ્યવૃત્તિ અને આવાસ યોજનાઓ વર્ગ પર આધારિત હોય છે.',
  },
  {
    id: 'land_hectares',
    field: 'land_hectares',
    titleEn: 'Do you own agricultural land? (Hectares)',
    titleHi: 'क्या आपके पास कृषि भूमि है? (हेक्टेयर में)',
    titleGu: 'શું તમારી પાસે ખેતીની જમીન છે? (હેક્ટરમાં)',
    subEn: 'Used for PM-KISAN, crop insurance, and irrigation subsidies.',
    subHi: 'पीएम-किसान, फसल बीमा और सिंचाई सब्सिडी के लिए उपयोगी।',
    subGu: 'પીએમ-કિસાન, પાક વીમો અને સિંચાઈ સબસિડી માટે ઉપયોગી.',
  },
  {
    id: 'household_flags',
    field: 'is_bpl',
    titleEn: 'A few quick household checks',
    titleHi: 'परिवार से जुड़े कुछ त्वरित प्रश्न',
    titleGu: 'પરિવાર સંબંધિત થોડા ઝડપી પ્રશ્નો',
    subEn: 'BPL / Ration status, disability, housing, and education.',
    subHi: 'बीपीएल स्थिति, दिव्यांगता, आवास और शिक्षा विवरण।',
    subGu: 'BPL સ્થિતિ, દિવ્યાંગતા, આવાસ અને શિક્ષણની વિગત.',
  },
  {
    id: 'held_documents',
    field: 'held_documents',
    titleEn: 'Which documents do you already have ready?',
    titleHi: 'आपके पास कौन-से दस्तावेज पहले से तैयार हैं?',
    titleGu: 'તમારી પાસે કયા દસ્તાવેજો પહેલેથી જ તૈયાર છે?',
    subEn: 'Helps rank the easiest schemes you can apply for today.',
    subHi: 'आज ही आवेदन करने योग्य आसान योजनाओं को ऊपर दिखाता है।',
    subGu: 'આજે જ અરજી કરી શકાય તેવી સરળ યોજનાઓને પ્રાથમિકતા આપે છે.',
  },
];

function extractRuleFields(node: unknown, out: Set<string>): void {
  if (!node || typeof node !== 'object') return;
  const obj = node as Record<string, unknown>;
  if (typeof obj.field === 'string') {
    out.add(obj.field);
  }
  for (const key of ['all', 'any', 'none']) {
    if (Array.isArray(obj[key])) {
      for (const child of obj[key]) {
        extractRuleFields(child, out);
      }
    }
  }
}

/**
 * Picks the next unanswered wizard question with the highest information gain
 * (the field referenced by the largest share of currently viable schemes).
 */
export function pickNextBestQuestion(
  profile: NormalizedProfile,
  candidateRuleTrees: SchemeRuleTree[],
  answeredStepIds: Set<string>
): WizardQuestionSpec | null {
  const remaining = WIZARD_QUESTIONS.filter((q) => !answeredStepIds.has(q.id));
  if (remaining.length === 0) return null;

  const fieldCounts = new Map<string, number>();
  for (const tree of candidateRuleTrees) {
    const fields = new Set<string>();
    extractRuleFields(tree, fields);
    for (const f of fields) {
      fieldCounts.set(f, (fieldCounts.get(f) ?? 0) + 1);
    }
  }

  let best = remaining[0];
  let bestScore = -1;
  for (const q of remaining) {
    const lookupField = q.field === 'income_band' ? 'income' : q.field;
    const isAlreadyKnown =
      q.id !== 'held_documents' &&
      q.id !== 'household_flags' &&
      profile.knownFields.includes(lookupField);
    if (isAlreadyKnown) continue;

    // Prioritize occupation & state first when unknown, otherwise max scheme-splitting count
    const baseCount = fieldCounts.get(lookupField) ?? 0;
    const bonus = q.id === 'occupation' ? 100 : q.id === 'state' ? 80 : 0;
    const score = baseCount + bonus;
    if (score > bestScore) {
      bestScore = score;
      best = q;
    }
  }

  return best;
}

/**
 * Extra Feature #4: Life-Event Quick Bundles
 */
export interface LifeEventBundle {
  id: string;
  titleEn: string;
  titleHi: string;
  titleGu: string;
  descEn: string;
  descHi: string;
  descGu: string;
  preset: Partial<CitizenProfile>;
}

export const LIFE_EVENT_BUNDLES: LifeEventBundle[] = [
  {
    id: 'turned-60',
    titleEn: 'Turned 60+ Senior',
    titleHi: '60+ वरिष्ठ नागरिक',
    titleGu: '60+ વરિષ્ઠ નાગરિક',
    descEn: 'Pensions, assistive devices & senior health cover',
    descHi: 'पेंशन, सहायक उपकरण व वरिष्ठ स्वास्थ्य बीमा',
    descGu: 'પેન્શન, સહાયક સાધનો અને વરિષ્ઠ આરોગ્ય કવચ',
    preset: { age: 64, occupation: 'retired', income_band: 'below_1l', is_bpl: true },
  },
  {
    id: 'small-farmer',
    titleEn: 'Small Farmer (Gujarat)',
    titleHi: 'लघु किसान (गुजरात)',
    titleGu: 'નાના ખેડૂત (ગુજરાત)',
    descEn: 'PM-KISAN, crop insurance, KCC & i-Khedut subsidies',
    descHi: 'पीएम-किसान, फसल बीमा, केसीसी व कृषि यंत्र सब्सिडी',
    descGu: 'પીએમ-કિસાન, પાક વીમો, KCC અને આઈ-ખેડૂત સહાય',
    preset: {
      state: 'Gujarat',
      district_type: 'rural',
      occupation: 'farmer',
      age: 42,
      land_hectares: 1.5,
      income_band: '1l_to_2_5l',
      is_income_tax_payer: false,
    },
  },
  {
    id: 'college-student',
    titleEn: 'College Student',
    titleHi: 'कॉलेज छात्र / छात्रा',
    titleGu: 'કોલેજ વિદ્યાર્થી',
    descEn: 'MYSY, Post-Matric & Pragati scholarships',
    descHi: 'एमवाईएसवाई, पोस्ट-मैट्रिक व प्रगति छात्रवृत्तियां',
    descGu: 'MYSY, પોસ્ટ-મેટ્રિક અને પ્રગતિ શિષ્યવૃત્તિઓ',
    preset: {
      state: 'Gujarat',
      occupation: 'student',
      age: 19,
      gender: 'female',
      education: 'higher_secondary',
      category: 'OBC',
      income_band: '1l_to_2_5l',
    },
  },
  {
    id: 'women-entrepreneur',
    titleEn: 'Women Founder',
    titleHi: 'महिला उद्यमी',
    titleGu: 'મહિલા ઉદ્યોગસાહસિક',
    descEn: 'Stand-Up India, MUDRA, PMEGP & SHG support',
    descHi: 'स्टैंड-अप इंडिया, मुद्रा, पीएमईजीपी व एसएचजी सहायता',
    descGu: 'સ્ટેન્ડ-અપ ઈન્ડિયા, મુદ્રા, PMEGP અને SHG સહાય',
    preset: {
      state: 'Gujarat',
      district_type: 'semi_urban',
      occupation: 'entrepreneur',
      gender: 'female',
      age: 32,
      education: 'secondary',
      income_band: '1l_to_2_5l',
    },
  },
  {
    id: 'new-mother',
    titleEn: 'Expecting / New Mother',
    titleHi: 'गर्भवती / नई माता',
    titleGu: 'સગર્ભા / નવી માતા',
    descEn: 'PMMVY, Janani Suraksha & Vahli Dikri',
    descHi: 'मातृ वंदना, जननी सुरक्षा व वहली दीकरी',
    descGu: 'માતૃ વંદના, જનની સુરક્ષા અને વહાલી દીકરી',
    preset: {
      state: 'Gujarat',
      gender: 'female',
      age: 26,
      income_band: 'below_1l',
      district_type: 'rural',
    },
  },
];

/**
 * Extra Feature #2: Offline Base64 Profile Snapshot encoder & decoder (no backend needed)
 */
export function encodeProfileSnapshot(profile: CitizenProfile): string {
  const compact = JSON.stringify(profile);
  if (typeof window !== 'undefined') {
    const bytes = new TextEncoder().encode(compact);
    let binary = '';
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  }
  return Buffer.from(compact, 'utf8').toString('base64');
}

export function decodeProfileSnapshot(token: string): CitizenProfile | null {
  try {
    let jsonStr = '';
    if (typeof window !== 'undefined') {
      const binary = atob(token.trim());
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      jsonStr = new TextDecoder().decode(bytes);
    } else {
      jsonStr = Buffer.from(token.trim(), 'base64').toString('utf8');
    }
    const raw = JSON.parse(jsonStr);
    return citizenProfileSchema.parse(raw);
  } catch {
    return null;
  }
}

