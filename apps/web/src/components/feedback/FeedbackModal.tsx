'use client';

import React, { useState } from 'react';
import { Language } from '@schemesathi/shared';
import { translations } from '../../lib/i18n';
import { submitFeedback } from '../../lib/api';
import { X, ThumbsUp, ThumbsDown, CheckCircle, Flag } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [rating, setRating] = useState<'helpful' | 'unhelpful' | null>(null);
  const [isOutdated, setIsOutdated] = useState<boolean>(false);
  const [comment, setComment] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const t = translations[language].feedback;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitFeedback({
      rating: rating || undefined,
      is_outdated_report: isOutdated,
      comment: comment,
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-surface rounded-editorial p-6 shadow-2xl border border-editorial-border relative space-y-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-3 border-b border-editorial-border">
          <h3 className="font-bold text-base text-ink">{t.title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-ink-muted hover:bg-black/5"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle className="w-10 h-10 text-status-success mx-auto" />
            <p className="text-xs font-bold text-ink">{t.thankYou}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-ink font-bold mb-2">{t.wasHelpful}</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRating('helpful')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${
                    rating === 'helpful'
                      ? 'border-status-success bg-status-success-soft text-status-success font-bold ring-2 ring-status-success/20'
                      : 'border-editorial-border hover:bg-canvas text-ink'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{t.yes}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRating('unhelpful')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all ${
                    rating === 'unhelpful'
                      ? 'border-status-error bg-status-error-soft text-status-error font-bold ring-2 ring-status-error/20'
                      : 'border-editorial-border hover:bg-canvas text-ink'
                  }`}
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>{t.no}</span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-editorial-border bg-canvas hover:bg-white transition-colors">
                <input
                  type="checkbox"
                  checked={isOutdated}
                  onChange={(e) => setIsOutdated(e.target.checked)}
                  className="w-4 h-4 text-primary rounded"
                />
                <span className="font-semibold text-ink flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-accent-coral" />
                  {t.reportOutdated}
                </span>
              </label>
            </div>

            <div>
              <label className="block text-ink font-bold mb-1.5">Comments & Corrections (Optional)</label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t.commentPlaceholder}
                className="w-full p-3 rounded-xl border border-editorial-border bg-canvas focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-ink hover:bg-black/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-white font-bold shadow-sm active:scale-95 transition-all"
              >
                {t.submit}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

