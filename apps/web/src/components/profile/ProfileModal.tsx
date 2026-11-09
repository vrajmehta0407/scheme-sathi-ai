'use client';

import React, { useState } from 'react';
import { UserProfile, Language } from '@schemesathi/shared';
import { translations } from '../../lib/i18n';
import {
  INDIAN_STATES,
  GUJARAT_DISTRICTS,
  OCCUPATIONS,
  AGE_BANDS,
  INCOME_BRACKETS
} from '@schemesathi/shared';
import { X, ArrowRight, ArrowLeft, RotateCcw, Check, HelpCircle } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onResetProfile: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  language,
  currentProfile,
  onSaveProfile,
  onResetProfile,
}) => {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<UserProfile>(currentProfile || {});

  if (!isOpen) return null;

  const t = translations[language].profile;
  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onSaveProfile(formData);
      onClose();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleReset = () => {
    setFormData({});
    onResetProfile();
    setStep(1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/40 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-xl bg-white/95 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-[0_25px_60px_-15px_rgba(11,25,44,0.25)] border border-editorial-border relative overflow-hidden flex flex-col max-h-[90vh] transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-heading"
      >
        {/* Luminous Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-navy via-coral to-coral-light" />

        {/* Top Header with Progress */}
        <div className="flex items-center justify-between pb-4 border-b border-editorial-border mt-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-coral px-2.5 py-0.5 rounded-full bg-coral-soft border border-coral/30">
                {t.step} {step} {t.of} {totalSteps}
              </span>
              <span className="text-xs text-ink-muted">Optional Guided Profile</span>
            </div>
            <h2 id="profile-heading" className="text-lg md:text-xl font-bold font-display text-navy mt-1.5">
              {step === 1 && t.q1Title}
              {step === 2 && t.q2Title}
              {step === 3 && t.q3Title}
              {step === 4 && t.q4Title}
              {step === 5 && t.q5Title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 text-ink-muted hover:text-navy transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-editorial-border/40 h-2 rounded-full mt-3 overflow-hidden p-0.5">
          <div
            className="bg-gradient-to-r from-navy to-coral h-full transition-all duration-500 rounded-full shadow-glow-coral"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step Body */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {/* Step 1: Location */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-ink-muted flex items-start gap-1.5 bg-canvas p-3 rounded-xl border border-editorial-border">
                <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{t.q1Desc}</span>
              </p>

              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">State</label>
                <div className="grid grid-cols-2 gap-2">
                  {INDIAN_STATES.map((st) => (
                    <button
                      key={st.code}
                      type="button"
                      onClick={() => setFormData({ ...formData, state: st.code })}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold text-left border transition-all ${
                        formData.state === st.code
                          ? 'border-primary bg-primary-soft text-primary ring-2 ring-primary/20'
                          : 'border-editorial-border hover:border-editorial-border-hover bg-white'
                      }`}
                    >
                      {language === 'gu' ? st.name_gu : st.name_en}
                    </button>
                  ))}
                </div>
              </div>

              {formData.state === 'GJ' && (
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5">District in Gujarat</label>
                  <select
                    value={formData.district || ''}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-editorial-border bg-white text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="">Select your district (Optional)</option>
                    {GUJARAT_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Occupation */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-ink-muted flex items-start gap-1.5 bg-canvas p-3 rounded-xl border border-editorial-border">
                <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{t.q2Desc}</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {OCCUPATIONS.map((occ) => {
                  const isSelected = formData.occupation === occ.id;
                  return (
                    <button
                      key={occ.id}
                      type="button"
                      onClick={() => {
                        const isStudent = occ.id === 'student';
                        const isFarmer = occ.id === 'farmer';
                        setFormData({
                          ...formData,
                          occupation: occ.id,
                          student_status: isStudent,
                          farmer_status: isFarmer,
                        });
                      }}
                      className={`p-3 rounded-2xl text-xs font-semibold text-left border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-primary bg-primary-soft text-primary ring-2 ring-primary/20 shadow-xs'
                          : 'border-editorial-border hover:border-editorial-border-hover bg-white'
                      }`}
                    >
                      <span>{language === 'gu' ? occ.label_gu : occ.label_en}</span>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Age Band */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-ink-muted flex items-start gap-1.5 bg-canvas p-3 rounded-xl border border-editorial-border">
                <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{t.q3Desc}</span>
              </p>

              <div className="grid grid-cols-1 gap-2">
                {AGE_BANDS.map((ab) => {
                  const isSelected = formData.age_band === ab.id;
                  return (
                    <button
                      key={ab.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, age_band: ab.id })}
                      className={`p-3 rounded-xl text-xs font-semibold text-left border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-primary bg-primary-soft text-primary ring-2 ring-primary/20'
                          : 'border-editorial-border hover:border-editorial-border-hover bg-white'
                      }`}
                    >
                      <span>{language === 'gu' ? ab.label_gu : ab.label_en}</span>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Income Bracket */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-xs text-ink-muted flex items-start gap-1.5 bg-canvas p-3 rounded-xl border border-editorial-border">
                <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{t.q4Desc}</span>
              </p>

              <div className="grid grid-cols-1 gap-2">
                {INCOME_BRACKETS.map((ib) => {
                  const isSelected = formData.income_bracket === ib.id;
                  return (
                    <button
                      key={ib.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, income_bracket: ib.id })}
                      className={`p-3 rounded-xl text-xs font-semibold text-left border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-primary bg-primary-soft text-primary ring-2 ring-primary/20'
                          : 'border-editorial-border hover:border-editorial-border-hover bg-white'
                      }`}
                    >
                      <span>{language === 'gu' ? ib.label_gu : ib.label_en}</span>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 5: Special categories / Summary */}
          {step === 5 && (
            <div className="space-y-4">
              <p className="text-xs text-ink-muted flex items-start gap-1.5 bg-canvas p-3 rounded-xl border border-editorial-border">
                <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{t.q5Desc}</span>
              </p>

              <div className="space-y-2">
                <label className="text-xs font-bold text-ink">Gender Identity</label>
                <div className="flex gap-2">
                  {['female', 'male', 'other'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: g })}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize border ${
                        formData.gender === g
                          ? 'border-primary bg-primary-soft text-primary ring-2 ring-primary/20'
                          : 'border-editorial-border bg-white'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-editorial-border bg-white hover:bg-canvas transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.farmer_status || false}
                    onChange={(e) => setFormData({ ...formData, farmer_status: e.target.checked })}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="text-xs font-medium text-ink">
                    My family holds cultivable agricultural land (જમીન ધારક ખેડૂત)
                  </span>
                </label>
              </div>

              {/* Summary Box */}
              <div className="p-4 rounded-2xl bg-canvas border border-editorial-border space-y-1.5 text-xs">
                <div className="font-bold text-ink mb-1">{t.summaryTitle}</div>
                <div className="text-ink-muted flex justify-between">
                  <span>State:</span> <strong className="text-ink">{formData.state || 'Any / All India'}</strong>
                </div>
                <div className="text-ink-muted flex justify-between">
                  <span>Occupation:</span> <strong className="text-ink">{formData.occupation || 'Not specified'}</strong>
                </div>
                <div className="text-ink-muted flex justify-between">
                  <span>Age Group:</span> <strong className="text-ink">{formData.age_band || 'Not specified'}</strong>
                </div>
                <div className="text-ink-muted flex justify-between">
                  <span>Income:</span> <strong className="text-ink">{formData.income_bracket || 'Not specified'}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="pt-4 border-t border-editorial-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-ink hover:bg-black/5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.back}</span>
              </button>
            )}
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-status-error hover:bg-status-error-soft"
              title="Clear all saved profile inputs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.reset}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSkip}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink"
            >
              {t.skip}
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold bg-gradient-to-r from-coral to-rose-600 hover:from-coral-hover hover:to-rose-700 text-white shadow-glow-coral active:scale-95 transition-all duration-300"
            >
              <span>{step === totalSteps ? t.finish : t.next}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

