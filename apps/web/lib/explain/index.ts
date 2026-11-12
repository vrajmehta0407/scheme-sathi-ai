import type {
  CriterionResult,
  EligibilityResult,
  Locale,
  NearMissInfo,
  SchemeRecord,
} from '../types';
import { formatINR } from '../benefits';

const FIELD_LABELS: Record<string, Record<Locale, string>> = {
  state: { en: 'State of residence', hi: 'निवास राज्य', gu: 'રહેઠાણનું રાજ્ય' },
  district_type: { en: 'Area type (Rural/Urban)', hi: 'क्षेत्र (ग्रामीण/शहरी)', gu: 'વિસ્તાર (ગ્રામીણ/શહેરી)' },
  age: { en: 'Age', hi: 'आयु', gu: 'ઉંમર' },
  gender: { en: 'Gender', hi: 'लिंग', gu: 'જાતિ' },
  income: { en: 'Annual household income', hi: 'वार्षिक पारिवारिक आय', gu: 'વાર્ષિક કૌટુંબિક આવક' },
  occupation: { en: 'Primary occupation', hi: 'मुख्य व्यवसाय', gu: 'મુખ્ય વ્યવસાય' },
  category: { en: 'Social category', hi: 'सामाजिक श्रेणी', gu: 'સામાજિક વર્ગ' },
  land_hectares: { en: 'Agricultural land', hi: 'कृषि भूमि', gu: 'ખેતીની જમીન' },
  education: { en: 'Education level', hi: 'शिक्षा स्तर', gu: 'શિક્ષણ સ્તર' },
  disability: { en: 'Disability status (40%+)', hi: 'दिव्यांगता स्थिति', gu: 'દિવ્યાંગતા સ્થિતિ' },
  family_size: { en: 'Family size', hi: 'परिवार का आकार', gu: 'પરિવારના સભ્યો' },
  is_bpl: { en: 'BPL / NFSA Ration status', hi: 'बीपीएल / राशन कार्ड स्थिति', gu: 'BPL / રેશન કાર્ડ સ્થિતિ' },
  is_widow: { en: 'Widow status', hi: 'विधवा स्थिति', gu: 'વિધવા સ્થિતિ' },
  is_income_tax_payer: { en: 'Income-tax payer exclusion', hi: 'आयकर दाता न होना', gu: 'આવકવેરા દાતા ન હોવા' },
  owns_pucca_house: { en: 'Pucca house ownership', hi: 'पक्का मकान स्वामित्व', gu: 'પાકું મકાન માલિકી' },
};

function formatExpectedValue(field: string, expected: unknown): string {
  if (field === 'income' && typeof expected === 'number') {
    return formatINR(expected);
  }
  if (Array.isArray(expected)) {
    return expected.join(' – ');
  }
  if (typeof expected === 'boolean') {
    return expected ? 'Yes' : 'No';
  }
  return String(expected ?? '');
}

export function getFieldLabel(field: string, locale: Locale): { text: string; fallbackToEn: boolean } {
  const entry = FIELD_LABELS[field];
  if (!entry) return { text: field.replace(/_/g, ' '), fallbackToEn: locale !== 'en' };
  const val = entry[locale];
  if (!val) return { text: entry.en, fallbackToEn: true };
  return { text: val, fallbackToEn: false };
}

/**
 * Agent 5: Explainer Agent (deterministic ICU-style template engine)
 */
export function explainCriterion(c: CriterionResult, locale: Locale): string {
  const { text: label, fallbackToEn } = getFieldLabel(c.field, locale);
  const expStr = formatExpectedValue(c.field, c.expected);
  const marker = fallbackToEn && locale !== 'en' ? ' [EN]' : '';

  if (c.passed === null) {
    if (locale === 'hi') return `${label}${marker}: जानकारी अधूरी है — पुष्टि के लिए विवरण जोड़ें (अपेक्षित: ${expStr})।`;
    if (locale === 'gu') return `${label}${marker}: માહિતી બાકી છે — ખાતરી કરવા વિગત ઉમેરો (અપેક્ષિત: ${expStr}).`;
    return `${label}: Not answered yet — add this detail to confirm (needs ${expStr}).`;
  }

  if (c.passed) {
    if (locale === 'hi') return `${label}${marker}: पात्रता शर्त पूरी हुई (${c.op} ${expStr})।`;
    if (locale === 'gu') return `${label}${marker}: પાત્રતાની શરત પૂર્ણ થઈ (${c.op} ${expStr}).`;
    return `${label}: Matched requirement (${c.op} ${expStr}).`;
  }

  if (locale === 'hi') return `${label}${marker}: शर्त पूरी नहीं हुई — आपका मान ${String(c.actual)}, आवश्यक ${expStr}।`;
  if (locale === 'gu') return `${label}${marker}: શરત પૂર્ણ થઈ નથી — તમારી વિગત ${String(c.actual)}, જરૂરી ${expStr}.`;
  return `${label}: Did not match — yours is ${String(c.actual)}, requires ${expStr}.`;
}

export function explainOverallEligibility(
  scheme: SchemeRecord,
  result: EligibilityResult,
  locale: Locale
): { headline: string; reasons: string[]; verifyNotice: string } {
  const name =
    locale === 'hi' ? scheme.nameHi : locale === 'gu' ? scheme.nameGu : scheme.nameEn;

  const passedCriteria = result.criteria.filter((c) => c.passed === true);
  const unknownCriteria = result.criteria.filter((c) => c.passed === null);
  const failedCriteria = result.criteria.filter((c) => c.passed === false);

  let headline = '';
  if (result.status === 'eligible') {
    if (locale === 'hi')
      headline = `आप ${name} के सभी ${passedCriteria.length} प्रमुख नियमों को पूरा करते हैं।`;
    else if (locale === 'gu')
      headline = `તમે ${name} ના તમામ ${passedCriteria.length} મુખ્ય નિયમો પૂર્ણ કરો છો.`;
    else
      headline = `You match all ${passedCriteria.length} checked rules for ${name}.`;
  } else if (result.status === 'likely') {
    if (locale === 'hi')
      headline = `आप संभावित रूप से पात्र हैं — ${unknownCriteria.length} विवरण की पुष्टि शेष है।`;
    else if (locale === 'gu')
      headline = `તમે સંભવિત રીતે પાત્ર છો — ${unknownCriteria.length} વિગતની ખાતરી બાકી છે.`;
    else
      headline = `Likely match — ${unknownCriteria.length} detail(s) still need confirmation.`;
  } else {
    if (locale === 'hi')
      headline = `वर्तमान जानकारी के अनुसार ${failedCriteria.length} शर्त पूरी नहीं हुई।`;
    else if (locale === 'gu')
      headline = `હાલની માહિતી મુજબ ${failedCriteria.length} શરત પૂર્ણ થતી નથી.`;
    else
      headline = `Not currently matched on ${failedCriteria.length} rule(s).`;
  }

  const reasons = result.criteria.map((c) => explainCriterion(c, locale));

  const verifyNotice =
    locale === 'hi'
      ? 'नमूना नियम जांच — आवेदन से पहले आधिकारिक पोर्टल पर अवश्य सत्यापित करें।'
      : locale === 'gu'
      ? 'નમૂના નિયમ ચકાસણી — અરજી કરતાં પહેલાં સત્તાવાર પોર્ટલ પર અવશ્ય ચકાસો.'
      : 'Sample rule check — always verify final eligibility on the official portal.';

  return { headline, reasons, verifyNotice };
}

export function formatNearMissBanner(nearMiss: NearMissInfo, locale: Locale): string {
  if (nearMiss.field === 'income') {
    const diff = formatINR(nearMiss.distance);
    if (locale === 'hi') return `आप आय सीमा से ${diff} अधिक हैं`;
    if (locale === 'gu') return `તમારી આવક મર્યાદા કરતાં ${diff} વધુ છે`;
    return `You miss this by ${diff} of income`;
  }
  if (nearMiss.field === 'age') {
    const yrs = nearMiss.distance;
    if (locale === 'hi') return `आयु सीमा से ${yrs} वर्ष का अंतर`;
    if (locale === 'gu') return `ઉંમરની મર્યાદાથી ${yrs} વર્ષનું અંતર`;
    return `${yrs} year(s) away from age rule`;
  }
  if (nearMiss.field === 'land_hectares') {
    if (locale === 'hi') return `भूमि सीमा से ${nearMiss.distance} हेक्टेयर का अंतर`;
    if (locale === 'gu') return `જમીનની મર્યાદાથી ${nearMiss.distance} હેક્ટરનું અંતર`;
    return `${nearMiss.distance} ha away from land rule`;
  }
  const { text: label } = getFieldLabel(nearMiss.field, locale);
  if (locale === 'hi') return `केवल 1 नियम शेष: ${label}`;
  if (locale === 'gu') return `માત્ર 1 નિયમ બાકી: ${label}`;
  return `Only 1 rule away: ${label}`;
}

/**
 * Extra Feature #7: In-App Offline Jargon Glossary (EN/HI/GU)
 */
export interface GlossaryEntry {
  term: string;
  en: string;
  hi: string;
  gu: string;
}

export const OFFLINE_GLOSSARY: GlossaryEntry[] = [
  {
    term: 'DBT (Direct Benefit Transfer)',
    en: 'Money sent straight from the government into your Aadhaar-linked bank account without middlemen.',
    hi: 'सरकारी राशि बिना बिचौलिये के सीधे आपके आधार-लिंक्ड बैंक खाते में भेजी जाती है।',
    gu: 'સરકારી સહાય વચેટિયા વગર સીધી તમારા આધાર-લિંક બેંક ખાતામાં જમા થાય છે.',
  },
  {
    term: 'BPL / NFSA',
    en: 'Below Poverty Line / National Food Security Act ration categories that unlock food and priority welfare.',
    hi: 'गरीबी रेखा से नीचे (BPL) और राष्ट्रीय खाद्य सुरक्षा राशन श्रेणी, जिससे प्राथमिकता लाभ मिलते हैं।',
    gu: 'ગરીબી રેખા નીચે (BPL) અને રાષ્ટ્રીય અન્ન સુરક્ષા રેશન કાર્ડ વર્ગ.',
  },
  {
    term: '7/12 & 8-A Extract (Satbara / Khasra)',
    en: 'Official village land-ownership record showing plot area and farmer name; available at Talati / AnyROR.',
    hi: 'सरकारी भूमि अभिलेख जिसमें जमीन का क्षेत्रफल और मालिक का नाम दर्ज होता है।',
    gu: 'જમીન માલિકીનો સત્તાવાર ઉતારો જેમાં જમીનનું ક્ષેત્રફળ અને ખેડૂતનું નામ હોય છે (AnyROR / તલાટી).',
  },
  {
    term: 'e-KYC',
    en: 'Quick digital identity check done using your Aadhaar OTP or fingerprint at a CSC or portal.',
    hi: 'आधार ओटीपी या फिंगरप्रिंट से की जाने वाली त्वरित डिजिटल पहचान पुष्टि।',
    gu: 'આધાર OTP અથવા ફિંગરપ્રિન્ટ વડે થતી ઝડપી ડિજિટલ ઓળખ ચકાસણી.',
  },
  {
    term: 'UDID Card',
    en: 'Unique Disability ID issued by Medical Boards for 40%+ disability, valid across all central/state schemes.',
    hi: 'मेडिकल बोर्ड द्वारा जारी विशिष्ट दिव्यांगता पहचान पत्र, सभी योजनाओं में मान्य।',
    gu: 'મેડિકલ બોર્ડ દ્વારા અપાતું વિશિષ્ટ દિવ્યાંગતા ઓળખપત્ર, તમામ યોજનાઓમાં માન્ય.',
  },
  {
    term: 'EWS (Economically Weaker Section)',
    en: 'General-category households meeting income and asset ceilings (typically under Rs. 8 lakh/year).',
    hi: 'सामान्य वर्ग के वे परिवार जिनकी वार्षिक आय निर्धारित सीमा (सामान्यतः 8 लाख से कम) में है।',
    gu: 'સામાન્ય વર્ગના પરિવારો જેમની વાર્ષિક આવક નિયત મર્યાદા (રૂ. 8 લાખથી ઓછી) માં હોય.',
  },
];

