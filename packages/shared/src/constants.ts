import { SchemeCategory, Language } from './types';

export const SCHEME_CATEGORIES: { id: SchemeCategory; label_en: string; label_gu: string; color: string }[] = [
  { id: 'education', label_en: 'Education & Scholarships', label_gu: 'શિક્ષણ અને શિષ્યવૃત્તિ', color: '#5B5FEF' },
  { id: 'agriculture', label_en: 'Farmer & Agriculture', label_gu: 'ખેડૂત અને કૃષિ સહાય', color: '#16A085' },
  { id: 'women_family', label_en: 'Women & Family Welfare', label_gu: 'મહિલા અને પારિવારિક કલ્યાણ', color: '#FF806E' },
  { id: 'employment', label_en: 'Employment & Skill Development', label_gu: 'રોજગાર અને કૌશલ્ય વિકાસ', color: '#FFC857' },
  { id: 'housing', label_en: 'Housing & Rural Support', label_gu: 'આવાસ અને ગ્રામીણ સહાય', color: '#8CCBFF' },
  { id: 'health', label_en: 'Health & Medical Aid', label_gu: 'આરોગ્ય અને તબીબી સહાય', color: '#C7B8FF' },
  { id: 'social_security', label_en: 'Social Security & Pension', label_gu: 'સામાજિક સુરક્ષા અને પેન્શન', color: '#E5989B' },
];

export const AGE_BANDS = [
  { id: '0-5', label_en: 'Early Childhood (0–5 yrs)', label_gu: 'પ્રારંભિક બાળપણ (૦-૫ વર્ષ)' },
  { id: '6-14', label_en: 'School Age (6–14 yrs)', label_gu: 'શાળા વય (૬-૧૪ વર્ષ)' },
  { id: '15-18', label_en: 'Adolescent (15–18 yrs)', label_gu: 'કિશોરાવસ્થા (૧૫-૧૮ વર્ષ)' },
  { id: '18-25', label_en: 'Youth & Higher Education (18–25 yrs)', label_gu: 'યુવા અને ઉચ્ચ શિક્ષણ (૧૮-૨૫ વર્ષ)' },
  { id: '26-40', label_en: 'Working Age (26–40 yrs)', label_gu: 'કાર્યકારી વય (૨૬-૪૦ વર્ષ)' },
  { id: '41-59', label_en: 'Mature Adult (41–59 yrs)', label_gu: 'પુખ્ત વય (૪૧-૫૯ વર્ષ)' },
  { id: '60+', label_en: 'Senior Citizen (60+ yrs)', label_gu: 'વરિષ્ઠ નાગરિક (૬૦+ વર્ષ)' },
];

export const INCOME_BRACKETS = [
  { id: 'below_1_lakh', label_en: 'Below ₹1,00,000 / year (BPL / EWS)', label_gu: 'વાર્ષિક ₹૧,૦૦,૦૦૦ થી ઓછી (BPL / EWS)' },
  { id: '1_to_2.5_lakh', label_en: '₹1,00,000 – ₹2,50,000 / year', label_gu: 'વાર્ષિક ₹૧,૦૦,૦૦૦ થી ₹૨,૫૦,૦૦૦' },
  { id: '2.5_to_5_lakh', label_en: '₹2,50,000 – ₹5,00,000 / year', label_gu: 'વાર્ષિક ₹૨,૫૦,૦૦૦ થી ₹૫,૦૦,૦૦૦' },
  { id: '5_to_8_lakh', label_en: '₹5,00,000 – ₹8,00,000 / year', label_gu: 'વાર્ષિક ₹૫,૦૦,૦૦૦ થી ₹૮,૦૦,૦૦૦' },
  { id: 'above_8_lakh', label_en: 'Above ₹8,00,000 / year', label_gu: 'વાર્ષિક ₹૮,૦૦,૦૦૦ થી વધુ' },
];

export const OCCUPATIONS = [
  { id: 'student', label_en: 'Student', label_gu: 'વિદ્યાર્થી' },
  { id: 'farmer', label_en: 'Farmer / Agri-worker', label_gu: 'ખેડૂત / ખેત મજૂર' },
  { id: 'daily_wage', label_en: 'Daily Wage Laborer / Artisan', label_gu: 'દૈનિક મજૂર / કારીગર' },
  { id: 'self_employed', label_en: 'Self-employed / Small Trader', label_gu: 'સ્વ-રોજગાર / નાનો વેપારી' },
  { id: 'salaried', label_en: 'Salaried Employee (Private / Public)', label_gu: 'નોકરિયાત કર્મચારી' },
  { id: 'homemaker', label_en: 'Homemaker / Caregiver', label_gu: 'ગૃહિણી' },
  { id: 'unemployed', label_en: 'Looking for Work', label_gu: 'રોજગાર શોધનાર' },
  { id: 'retired', label_en: 'Retired', label_gu: 'નિવૃત્ત' },
];

export const GUJARAT_DISTRICTS = [
  'Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch',
  'Bhavnagar', 'Botad', 'Chhota Udaipur', 'Dahod', 'Dang', 'Devbhoomi Dwarka',
  'Gandhinagar', 'Gir Somnath', 'Jamnagar', 'Junagadh', 'Kheda', 'Kutch',
  'Mahisagar', 'Mehsana', 'Morbi', 'Narmada', 'Navsari', 'Panchmahal',
  'Patan', 'Porbandar', 'Rajkot', 'Sabarkantha', 'Surat', 'Surendranagar',
  'Tapi', 'Vadodara', 'Valsad'
];

export const INDIAN_STATES = [
  { code: 'GJ', name_en: 'Gujarat', name_gu: 'ગુજરાત' },
  { code: 'MH', name_en: 'Maharashtra', name_gu: 'મહારાષ્ટ્ર' },
  { code: 'RJ', name_en: 'Rajasthan', name_gu: 'રાજસ્થાન' },
  { code: 'MP', name_en: 'Madhya Pradesh', name_gu: 'મધ્ય પ્રદેશ' },
  { code: 'UP', name_en: 'Uttar Pradesh', name_gu: 'ઉત્તર પ્રદેશ' },
  { code: 'DL', name_en: 'Delhi (NCT)', name_gu: 'દિલ્હી' },
  { code: 'KA', name_en: 'Karnataka', name_gu: 'કર્ણાટક' },
  { code: 'TN', name_en: 'Tamil Nadu', name_gu: 'તમિલનાડુ' },
];

export const DISCLAIMERS = {
  en: {
    general: 'SchemeSathi AI is an informational discovery assistant. Matches are potential indicators based on user-provided inputs and do not constitute an official government eligibility decision. Please apply only through verified official government portals.',
    demo: 'This record is a demo fixture for interface demonstration and testing. Factual details are derived from publicly available guidelines but must be verified on official ministry portals.',
    no_pii: 'We never request your Aadhaar number, OTP, bank PIN, or passwords. Beware of fraudulent services asking for payment for government scheme applications.',
  },
  gu: {
    general: 'સ્કીમસાથી AI એક માહિતીલક્ષી માર્ગદર્શક છે. મેળ ખાતી યોજનાઓ વપરાશકર્તા દ્વારા આપેલ વિગતો પર આધારિત સંભવિત સૂચકાંકો છે અને તે સત્તાવાર સરકારી નિર્ણય નથી. કૃપા કરીને ફક્ત અધિકૃત સરકારી પોર્ટલ દ્વારા જ અરજી કરો.',
    demo: 'આ રેકોર્ડ ઇન્ટરફેસ ડેમો અને પરીક્ષણ માટે છે. વિગતો સાર્વજનિક માર્ગદર્શિકામાંથી લીધેલી છે પરંતુ સત્તાવાર મંત્રાલય પોર્ટલ પર ચકાસવી આવશ્યક છે.',
    no_pii: 'અમે ક્યારેય તમારો આધાર નંબર, OTP, બેંક પિન અથવા પાસવર્ડ માંગતા નથી. સરકારી યોજનાઓ માટે પૈસા માંગતી કપટી સેવાઓથી સાવધ રહો.',
  }
};
