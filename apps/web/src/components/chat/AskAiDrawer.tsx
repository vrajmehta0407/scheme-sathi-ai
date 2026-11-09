'use client';

import React, { useState } from 'react';
import { Language, UserProfile, CitationItem } from '@schemesathi/shared';
import { translations } from '../../lib/i18n';
import { askAssistant } from '../../lib/api';
import { X, Send, Sparkles, ShieldCheck, ExternalLink, Bot, User, HelpCircle } from 'lucide-react';

interface AskAiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  userProfile?: UserProfile;
  activeSchemeId?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: CitationItem[];
  timestamp: string;
}

export const AskAiDrawer: React.FC<AskAiDrawerProps> = ({
  isOpen,
  onClose,
  language,
  userProfile,
  activeSchemeId,
}) => {
  const t = translations[language].chat;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: language === 'gu'
        ? 'નમસ્તે! હું સ્કીમસાથી AI સહાયક છું. તમે કેન્દ્રીય તેમજ ગુજરાત સરકારની યોજનાઓની પાત્રતા, નિયમો અને જરૂરી કાગળો વિશે પૂછી શકો છો. મારી માહિતી સત્તાવાર મંજૂર દસ્તાવેજો પર આધારિત છે.'
        : 'Hello! I am your SchemeSathi AI assistant. Ask me questions about scheme benefits, eligibility criteria, or required documents. All answers are strictly grounded in verified government guidelines.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const resp = await askAssistant({
        query: textToSend,
        language: language,
        profile_context: userProfile,
        active_scheme_id: activeSchemeId,
      });

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: resp.answer,
        citations: resp.citations,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'assistant',
          text: 'Unable to reach the assistant service. Please check the official guidelines on the portal.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-navy/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl h-full shadow-[0_0_60px_rgba(11,25,44,0.2)] border-l border-editorial-border flex flex-col justify-between relative overflow-hidden">
        {/* Luminous Top Gradient Line in Navy & Coral */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-navy via-coral to-coral-light z-10" />

        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-editorial-border bg-canvas/70 backdrop-blur-md flex items-center justify-between mt-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-coral to-rose-600 flex items-center justify-center text-white shadow-glow-coral">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-navy">{t.title}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-status-success-soft text-status-success border border-status-success/20">
                  Grounded
                </span>
              </div>
              <p className="text-xs text-ink-muted">{t.subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 text-ink-muted hover:text-navy transition-colors"
            aria-label="Close assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 text-xs ${
                m.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-navy-soft text-navy flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] space-y-2`}>
                <div
                  className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-line ${
                    m.sender === 'user'
                      ? 'bg-navy text-white rounded-tr-none shadow-sm font-medium'
                      : 'bg-white border border-editorial-border text-navy rounded-tl-none shadow-paper'
                  }`}
                >
                  {m.text}
                </div>

                {/* Grounded Citations & Sources */}
                {m.citations && m.citations.length > 0 && (
                  <div className="p-3 rounded-xl bg-canvas border border-editorial-border space-y-2 text-[11px]">
                    <div className="font-bold text-navy uppercase tracking-wider flex items-center gap-1.5 text-[10px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-coral" />
                      <span>{t.citationsHeading}</span>
                    </div>
                    {m.citations.map((c) => (
                      <div key={c.citation_id} className="border-t border-editorial-border/60 pt-1.5">
                        <div className="font-bold text-navy">{c.scheme_name}</div>
                        <div className="text-ink-muted text-[10px]">{c.source_org}</div>
                        <a
                          href={c.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-coral hover:underline font-medium text-[10px] mt-0.5"
                        >
                          Official Portal Link <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-[10px] text-ink-muted text-right px-1">
                  {m.timestamp}
                </div>
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-coral text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 text-xs items-center text-ink-muted">
              <div className="w-7 h-7 rounded-full bg-navy-soft text-navy flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl bg-white border border-editorial-border italic text-navy">
                Verifying scheme records & citations...
              </div>
            </div>
          )}
        </div>

        {/* Suggested Queries */}
        <div className="px-4 py-2 border-t border-editorial-border/60 bg-canvas/40">
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1.5">
            {t.suggestedHeading}
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[t.qSuggest1, t.qSuggest2, t.qSuggest3].map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(sug)}
                className="px-2.5 py-1 rounded-full bg-white border border-editorial-border hover:border-coral/50 hover:text-coral hover:bg-coral-soft/30 text-navy text-[11px] whitespace-nowrap transition-colors"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-editorial-border bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.inputPlaceholder}
              className="flex-1 p-3 rounded-2xl border border-editorial-border bg-canvas text-xs text-navy focus:ring-2 focus:ring-coral focus:border-coral focus:outline-none placeholder:text-ink-muted"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="w-11 h-11 rounded-2xl bg-gradient-to-r from-coral to-rose-600 hover:from-coral-hover hover:to-rose-700 shadow-glow-coral disabled:opacity-40 text-white flex items-center justify-center transition-all shrink-0 active:scale-95"
              aria-label={t.send}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-[10px] text-ink-muted text-center mt-2">
            AI responses explain official guidelines and do not guarantee approval.
          </p>
        </div>
      </div>
    </div>
  );
};

