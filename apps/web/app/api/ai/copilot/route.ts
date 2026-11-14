import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface CopilotPayload {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  profile?: {
    label?: string;
    state?: string;
    occupation?: string;
    annual_income?: number;
    gender?: string;
    age?: number;
    caste_category?: string;
    land_hectares?: number;
    held_documents?: string[];
  };
  schemeContext?: {
    id?: string;
    slug?: string;
    nameEn?: string;
    nameHi?: string;
    nameGu?: string;
    benefitSummary?: string;
    officialPortal?: string;
    requiredDocs?: string[];
    steps?: string[];
  };
  locale?: 'en' | 'hi' | 'gu';
}

const DEFAULT_NVIDIA_MODEL = 'nvidia/nemotron-3.5-lightning-30b-a3b';
const NVIDIA_CHAT_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'NVIDIA API key not configured on server.',
          reply:
            'NVIDIA API key is missing. Please ensure NVIDIA_API_KEY is configured in apps/web/.env.local.',
        },
        { status: 500 }
      );
    }

    const body = (await req.json()) as CopilotPayload;
    const { messages = [], profile, schemeContext, locale = 'en' } = body;

    const userMessages = messages.filter((m) => m && typeof m.content === 'string');
    if (userMessages.length === 0) {
      return NextResponse.json(
        { error: 'At least one user message is required.' },
        { status: 400 }
      );
    }

    // Build rich, real-world context for Indian welfare assistance
    const langInstructions = {
      en: 'Respond in clear, simple English. Format action steps with markdown bullet points.',
      hi: 'उत्तर सरल और स्पष्ट हिंदी (Devanagari script) में दें। प्रक्रिया को बिंदुवार (bullet points) समझाएं।',
      gu: 'જવાબ સરળ અને સ્પષ્ટ ગુજરાતીમાં આપો. પ્રક્રિયાને મુદ્દાસર (bullet points) સમજાવો.',
    }[locale] || 'Respond in clear, simple English.';

    let contextPrompt = `You are "Scheme Sathi AI Copilot", an expert and empathetic Indian Citizen Welfare Advisor powered by NVIDIA NIM AI.
Your mission is to help Indian citizens, CSC kiosk operators, and panchayat volunteers navigate government welfare schemes, understand eligibility criteria, resolve document roadblocks (e.g. Aadhaar DBT seeding, e-KYC, NPCI bank mapping, 7-12 / Khatauni land records, Samagra ID, Ration card verification), and draft grievance complaints.

GUIDELINES:
1. Tone: Respectful, practical, encouraging, and accurate.
2. Language: ${langInstructions}
3. Practical Procedures: Always explain WHERE and HOW the citizen can perform the step (e.g., visiting nearest Bank branch for DBT mandate / Form 1, CSC center, Jan Seva Kendra, or official government portal).
4. Direct Benefits: If the citizen mentions benefit payment delays, explain how to verify PFMS/DBT status and register a grievance on CPGRAMS (pgportal.gov.in) or state CM helpline.
5. Privacy: Never ask for or record real 12-digit Aadhaar numbers or bank account passwords.
`;

    if (profile) {
      contextPrompt += `\nCITIZEN CONTEXT (From local offline profile):
- Name/Label: ${profile.label || 'Citizen'}
- State: ${profile.state || 'All India'}
- Age: ${profile.age || 'Unknown'}, Gender: ${profile.gender || 'Unknown'}
- Occupation: ${profile.occupation || 'General'}
- Annual Income: ${profile.annual_income ? `₹${profile.annual_income.toLocaleString('en-IN')}` : 'Not declared'}
- Category: ${profile.caste_category || 'General'}
- Land Owned: ${profile.land_hectares !== undefined ? `${profile.land_hectares} hectares` : 'None / Not declared'}
- Documents currently held: ${profile.held_documents && profile.held_documents.length ? profile.held_documents.join(', ') : 'None marked yet'}
`;
    }

    if (schemeContext) {
      contextPrompt += `\nCURRENT SCHEME IN FOCUS:
- Scheme: ${schemeContext.nameEn || schemeContext.id || 'N/A'} (Hindi: ${schemeContext.nameHi || 'N/A'}, Gujarati: ${schemeContext.nameGu || 'N/A'})
- Benefit: ${schemeContext.benefitSummary || 'Government subsidy / direct cash transfer'}
- Required Documents: ${schemeContext.requiredDocs?.join(', ') || 'Standard identity & address proof'}
- Application Process Steps: ${schemeContext.steps?.join(' -> ') || 'Online / CSC registration'}
- Official Portal: ${schemeContext.officialPortal || 'https://www.myscheme.gov.in'}
`;
    }

    const modelName = process.env.NVIDIA_MODEL || DEFAULT_NVIDIA_MODEL;

    // Send payload to NVIDIA NIM
    const nvidiaRes = await fetch(NVIDIA_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: contextPrompt },
          ...userMessages.slice(-8), // Keep conversation window compact and focused
        ],
        temperature: 0.35,
        max_tokens: 1024,
      }),
    });

    if (!nvidiaRes.ok) {
      const errorText = await nvidiaRes.text();
      console.error('[NVIDIA Copilot Error]', nvidiaRes.status, errorText);
      return NextResponse.json(
        {
          error: `NVIDIA API responded with status ${nvidiaRes.status}`,
          details: errorText,
          reply:
            locale === 'hi'
              ? 'वर्तमान में AI सेवा से संपर्क नहीं हो पा रहा है। कृपया कुछ क्षण बाद पुनः प्रयास करें या ऑफ़लाइन नियमों का उपयोग करें।'
              : locale === 'gu'
              ? 'હાલમાં AI સેવા સાથે જોડાણ થઈ રહ્યું નથી. કૃપા કરીને થોડીવાર પછી પ્રયાસ કરો.'
              : 'Unable to reach the NVIDIA AI service at this moment. Please try again shortly or use the offline scheme rules.',
        },
        { status: 502 }
      );
    }

    const data = await nvidiaRes.json();
    const choice = data.choices?.[0];

    // Some reasoning models return answers in content or reasoning_content
    let replyText = choice?.message?.content || choice?.message?.reasoning_content || '';

    // If both exist or content had markdown
    if (!replyText && choice?.text) {
      replyText = choice.text;
    }

    if (!replyText.trim()) {
      replyText =
        locale === 'hi'
          ? 'आपके प्रश्न का उत्तर तैयार किया गया, कृपया योजना के आधिकारिक पोर्टल पर विवरण देखें।'
          : locale === 'gu'
          ? 'તમારા પ્રશ્ન માટે માહિતી તૈયાર થઈ ગઈ છે, કૃપા કરીને સત્તાવાર પોર્ટલ પર ચકાસો.'
          : 'Your guidance is ready. Please cross-verify document requirements on the official scheme portal.';
    }

    return NextResponse.json({
      reply: replyText.trim(),
      model: data.model || modelName,
      usage: data.usage || null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Copilot Handler Exception]', message);
    return NextResponse.json(
      {
        error: 'Internal server error while processing copilot request.',
        details: message,
      },
      { status: 500 }
    );
  }
}
