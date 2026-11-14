'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Sparkle,
  X,
  PaperPlaneTilt,
  ChatCircleDots,
  ShieldCheck,
  Cpu,
  Trash,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import { useSathiStore } from '@/lib/store/useSathiStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const QUICK_PROMPTS = {
  en: [
    { label: '🌾 PM-KISAN e-KYC', text: 'How do I complete OTP-based or biometric e-KYC for PM-KISAN?' },
    { label: '🏦 Aadhaar DBT Seeding', text: 'What is NPCI Aadhaar DBT bank account seeding and how do I do it at my bank?' },
    { label: '🏥 Ayushman Card Steps', text: 'What documents are required and where can I create my Ayushman Bharat card?' },
    { label: '⚖️ Grievance Filing', text: 'My scheme application is approved but subsidy not credited. How do I file a grievance on CPGRAMS?' },
  ],
  hi: [
    { label: '🌾 PM-किसान e-KYC', text: 'PM-किसान में मोबाइल OTP या फिंगरप्रिंट e-KYC कैसे पूरा करें?' },
    { label: '🏦 आधार DBT मैपिंग', text: 'बैंक खाते में आधार NPCI / DBT सीडिंग कैसे करवाएं? क्या फॉर्म लगता है?' },
    { label: '🏥 आयुष्मान कार्ड प्रक्रिया', text: 'आयुष्मान भारत कार्ड बनवाने के लिए क्या दस्तावेज चाहिए और कहां जाना होगा?' },
    { label: '⚖️ शिकायत निवारण', text: 'योजना पास होने के बाद भी पैसे नहीं आए, तो CPGRAMS पर ऑनलाइन शिकायत कैसे दर्ज करें?' },
  ],
  gu: [
    { label: '🌾 PM-કિસાન e-KYC', text: 'PM-કિસાન પોર્ટલ પર આધાર e-KYC કેવી રીતે પૂરું કરવું?' },
    { label: '🏦 બેંક DBT સીડિંગ', text: 'બેંક ખાતામાં આધાર NPCI / DBT સીડિંગ કરાવવાની સરળ રીત કઈ છે?' },
    { label: '🏥 આયુષ્માન કાર્ડ', text: 'આયુષ્માન કાર્ડ બનાવવા માટે કયા દસ્તાવેજો જોઈએ અને ક્યાં જવું?' },
    { label: '⚖️ ફરિયાદ નિવારણ', text: 'યોજના મંજૂર થઈ છતાં નાણાં જમા ન થાય તો સરકારી પોર્ટલ પર ફરિયાદ કેવી રીતે કરવી?' },
  ],
};

export function SchemeSathiCopilot() {
  const pathname = usePathname();
  const { locale, profiles, activeProfileId, catalogue } = useSathiStore();
  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Extract scheme context if user is on scheme detail page (/schemes/[slug])
  const currentSchemeSlug = pathname?.startsWith('/schemes/') ? pathname.replace('/schemes/', '') : null;
  const currentScheme = currentSchemeSlug
    ? catalogue.schemes.find((s) => s.slug === currentSchemeSlug || s.id === currentSchemeSlug)
    : null;

  // Initialize greeting on first open
  useEffect(() => {
    if (messages.length === 0) {
      const greeting =
        locale === 'hi'
          ? `नमस्ते! मैं स्कीम साथी AI सह-पायलट हूँ (NVIDIA NIM द्वारा संचालित)। आप सरकारी योजनाओं, दस्तावेज़ समस्याओं (जैसे DBT/NPCI, e-KYC) या आवेदन प्रक्रिया के बारे में कोई भी प्रश्न पूछ सकते हैं।`
          : locale === 'gu'
          ? `નમસ્તે! હું સ્કીમ સાથી AI સહાયક છું (NVIDIA NIM સંચાલિત). સરકારી યોજનાઓ, DBT સીડિંગ, e-KYC અથવા દસ્તાવેજો અંગે કોઈ પણ પ્રશ્ન પૂછો.`
          : `Hello! I am Scheme Sathi AI Copilot, powered by NVIDIA NIM. Ask me anything about welfare scheme eligibility, resolving document blocks (e.g. Aadhaar DBT seeding, e-KYC), or application guidance.`;

      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: greeting,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [locale, messages.length]);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const payloadMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          profile: {
            label: activeProfile.label,
            state: activeProfile.state,
            occupation: activeProfile.occupation,
            annual_income: activeProfile.income,
            gender: activeProfile.gender,
            age: activeProfile.age,
            caste_category: activeProfile.category,
            land_hectares: activeProfile.land_hectares,
            held_documents: activeProfile.held_documents,
          },
          schemeContext: currentScheme
            ? {
                id: currentScheme.id,
                slug: currentScheme.slug,
                nameEn: currentScheme.nameEn,
                nameHi: currentScheme.nameHi,
                nameGu: currentScheme.nameGu,
                benefitSummary: currentScheme.benefitType,
                officialPortal: currentScheme.officialUrl,
                requiredDocs: currentScheme.documents,
                steps: currentScheme.steps?.en ?? [],
              }
            : undefined,
          locale,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.reply || data.error || 'Server error');
      }

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'No response generated.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ ${msg}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const prompts = QUICK_PROMPTS[locale] || QUICK_PROMPTS.en;

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-5 right-5 z-40">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 rounded-full bg-blue px-4 py-3 text-white shadow-xl transition-all duration-200 hover:scale-105 hover:bg-blue-700 active:scale-95"
            aria-label="Open Scheme Sathi AI Copilot"
          >
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-yellow" />
            </span>
            <Sparkle size={20} weight="fill" className="text-yellow" />
            <span className="text-sm font-bold tracking-tight">AI Copilot</span>
            <span className="rounded-pill bg-white/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-yellow">
              NVIDIA NIM
            </span>
          </button>
        )}
      </div>

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 flex h-[620px] w-[95vw] max-w-[440px] flex-col overflow-hidden rounded-2xl border border-blue/20 bg-white/95 shadow-2xl backdrop-blur-xl sm:bottom-6 sm:right-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-blue/15 bg-blue px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-yellow shadow-inner">
                <Sparkle size={18} weight="fill" />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-sm font-bold leading-tight">Scheme Sathi Copilot</h3>
                  <span className="rounded-pill bg-yellow px-1.5 py-0.2 text-[9px] font-black uppercase text-ink">
                    NVIDIA
                  </span>
                </div>
                <p className="text-[11px] text-white/80">
                  {currentScheme
                    ? `Scheme Focus: ${currentScheme.nameEn.slice(0, 26)}...`
                    : `Active: ${activeProfile.label}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMessages([])}
                title="Clear chat"
                className="rounded-full p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                <Trash size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
                aria-label="Close Copilot"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
          </div>

          {/* Context Strip */}
          <div className="flex items-center justify-between border-b border-blue/10 bg-blue-50/70 px-3 py-1.5 text-[11px] font-semibold text-blue-900">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-green-600" weight="duotone" />
              <span>Offline deterministic eligibility verified</span>
            </div>
            <span className="text-[10px] text-ink/70 uppercase font-mono-num">
              {locale.toUpperCase()}
            </span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed text-xs sm:text-sm ${
                    m.role === 'user'
                      ? 'bg-blue text-white rounded-br-none shadow-sm'
                      : 'border border-blue/15 bg-white text-ink rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-blue/15 bg-white px-3.5 py-2.5 text-xs text-ink/75 shadow-sm">
                  <ArrowsClockwise size={14} className="animate-spin text-blue" />
                  <span>Scheme Sathi is reasoning with NVIDIA NIM...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Prompt Chips */}
          <div className="border-t border-blue/10 bg-white/60 p-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink/60 mb-1.5 px-1">
              Quick Citizen Guidance
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {prompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(p.text)}
                  disabled={loading}
                  className="shrink-0 rounded-pill border border-blue/20 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-800 transition hover:bg-blue-50 active:scale-95 disabled:opacity-50"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t border-blue/15 bg-white p-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                locale === 'hi'
                  ? 'योजना, DBT या दस्तावेज के बारे में पूछें...'
                  : locale === 'gu'
                  ? 'યોજના કે DBT વિશે પૂછો...'
                  : 'Ask about eligibility, DBT, or documents...'
              }
              className="flex-1 rounded-pill border border-blue/25 bg-blue-50/40 px-3.5 py-2 text-xs font-medium text-ink focus:border-blue focus:bg-white focus:outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue text-white transition hover:bg-blue-700 disabled:opacity-40"
              aria-label="Send message"
            >
              <PaperPlaneTilt size={16} weight="bold" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
