'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Microphone,
  Plus,
  QrCode,
  SkipForward,
  Sparkle,
  Trash,
  UsersThree,
} from '@phosphor-icons/react';
import { useSathiStore } from '@/lib/store/useSathiStore';
import {
  INCOME_BANDS,
  INDIAN_STATES,
  WIZARD_QUESTIONS,
  decodeProfileSnapshot,
  encodeProfileSnapshot,
  normalizeProfile,
  pickNextBestQuestion,
} from '@/lib/profile';
import { runCitizenOrchestrator } from '@/lib/orchestrator';
import { formatINR } from '@/lib/benefits';
import type {
  CategoryType,
  CitizenProfile,
  DistrictType,
  EducationLevel,
  IncomeBandId,
  OccupationType,
} from '@/lib/types';

export default function WizardPage() {
  const {
    locale,
    profiles,
    activeProfileId,
    updateActiveProfile,
    switchProfile,
    addProfile,
    deleteProfile,
    toggleHeldDocument,
    catalogue,
    cscKioskMode,
  } = useSathiStore();

  const activeProfile =
    profiles.find((p) => p.id === activeProfileId) ?? profiles[0];

  const [answeredSteps, setAnsweredSteps] = useState<Set<string>>(new Set());
  const [newMemberName, setNewMemberName] = useState('');
  const [snapshotToken, setSnapshotToken] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState('');

  const orchestrated = useMemo(
    () =>
      runCitizenOrchestrator(
        activeProfile,
        catalogue.schemes,
        catalogue.documents,
        locale
      ),
    [activeProfile, catalogue.schemes, catalogue.documents, locale]
  );

  const viableRuleTrees = useMemo(() => {
    return orchestrated.ranked
      .filter((r) => r.eligibility.status !== 'not_eligible' && r.scheme.ruleTree)
      .map((r) => r.scheme.ruleTree!);
  }, [orchestrated.ranked]);

  const currentQuestion = useMemo(() => {
    const normalized = normalizeProfile(activeProfile);
    return (
      pickNextBestQuestion(normalized, viableRuleTrees, answeredSteps) ??
      WIZARD_QUESTIONS[0]
    );
  }, [activeProfile, viableRuleTrees, answeredSteps]);

  const progressPct = Math.min(
    100,
    Math.round((answeredSteps.size / WIZARD_QUESTIONS.length) * 100)
  );

  const markNext = (stepId: string) => {
    setAnsweredSteps((prev) => {
      const next = new Set(prev);
      next.add(stepId);
      return next;
    });
  };

  // Extra Feature #1: Offline Browser Web Speech API Voice Input
  const handleVoiceAssist = () => {
    const win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        start: () => void;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        start: () => void;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
      };
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setVoiceNote('Offline browser speech recognition is not supported in this browser; please tap the chips below.');
      return;
    }
    const rec = new SpeechRec();
    rec.lang = locale === 'hi' ? 'hi-IN' : locale === 'gu' ? 'gu-IN' : 'en-IN';
    setListening(true);
    setVoiceNote('Listening locally (no cloud API)... say e.g. "farmer Gujarat 45"');
    rec.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript?.toLowerCase() ?? '';
      setVoiceNote(`Heard: "${text}"`);
      const patch: Partial<CitizenProfile> = {};
      if (text.includes('farmer') || text.includes('किसान') || text.includes('ખેડૂત')) patch.occupation = 'farmer';
      if (text.includes('student') || text.includes('छात्र') || text.includes('વિદ્યાર્થી')) patch.occupation = 'student';
      if (text.includes('worker') || text.includes('श्रमिक')) patch.occupation = 'worker';
      if (text.includes('gujarat') || text.includes('गुजरात') || text.includes('ગુજરાત')) patch.state = 'Gujarat';
      if (text.includes('female') || text.includes('woman') || text.includes('महिला')) patch.gender = 'female';
      const ageMatch = text.match(/\b(\d{2})\b/);
      if (ageMatch) patch.age = Number(ageMatch[1]);
      if (Object.keys(patch).length > 0) updateActiveProfile(patch);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  return (
    <div className="space-y-6">
      {/* Top Wizard Header + Live Counter + Sathi Companion */}
      <div className="glass p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Simple geometric two-colour Sathi companion */}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue text-white shadow-sm">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-yellow" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow" />
              </div>
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">
                Sathi Smart Profile Wizard
              </h1>
              <p className="text-xs font-medium text-ink/75">
                Information-gain questioning • Skip any field anytime • Evaluated in {orchestrated.computeMs} ms
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-card bg-green-50 border border-green/30 px-4 py-2 text-center">
              <div className="font-mono-num text-xl font-bold text-green-700">
                {orchestrated.eligibleCount} Eligible • {orchestrated.likelyCount} Likely
              </div>
              <div className="text-[11px] font-semibold text-ink/75">
                Optimal stack: {formatINR(orchestrated.optimalBundle.annualTotal)}/yr (est.)
              </div>
            </div>

            <button
              type="button"
              onClick={handleVoiceAssist}
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-pill px-4 py-2 text-xs font-bold transition ${
                listening ? 'bg-yellow text-ink' : 'border border-blue/25 bg-white text-ink hover:bg-blue-50'
              }`}
            >
              <Microphone size={16} weight="duotone" className="text-blue" />
              {listening ? 'Listening...' : 'Voice Assist'}
            </button>
          </div>
        </div>

        {voiceNote && (
          <div className="mt-3 rounded-chip bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
            {voiceNote}
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs font-bold text-ink/70">
            <span>Question {Math.min(answeredSteps.size + 1, WIZARD_QUESTIONS.length)} of {WIZARD_QUESTIONS.length}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-pill bg-blue-50">
            <div
              className="h-full rounded-pill bg-blue transition-all duration-300"
              style={{ width: `${Math.max(10, progressPct)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Question Card */}
        <div className="lg:col-span-8 space-y-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="glass p-6 md:p-8 space-y-6"
            >
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">
                  {locale === 'hi'
                    ? currentQuestion.titleHi
                    : locale === 'gu'
                    ? currentQuestion.titleGu
                    : currentQuestion.titleEn}
                </h2>
                <p className="mt-1 text-sm text-ink/75">
                  {locale === 'hi'
                    ? currentQuestion.subHi
                    : locale === 'gu'
                    ? currentQuestion.subGu
                    : currentQuestion.subEn}
                </p>
              </div>

              {/* Dynamic Question Controls */}
              {currentQuestion.id === 'occupation' && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(
                    [
                      'farmer',
                      'student',
                      'worker',
                      'artisan',
                      'entrepreneur',
                      'salaried',
                      'unemployed',
                      'retired',
                    ] as OccupationType[]
                  ).map((occ) => (
                    <button
                      key={occ}
                      type="button"
                      onClick={() => updateActiveProfile({ occupation: occ })}
                      className={`min-h-[52px] rounded-input border px-4 py-3 text-sm font-bold capitalize transition ${
                        activeProfile.occupation === occ
                          ? 'border-blue bg-blue text-white'
                          : 'border-blue/20 bg-white/90 text-ink hover:bg-blue-50'
                      }`}
                    >
                      {occ}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.id === 'state' && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-bold text-ink/75">State / UT</label>
                      <select
                        value={activeProfile.state ?? ''}
                        onChange={(e) =>
                          updateActiveProfile({ state: e.target.value || undefined })
                        }
                        className="mt-1 min-h-[48px] w-full rounded-input border border-blue/25 bg-white px-4 text-sm font-semibold text-ink"
                      >
                        <option value="">Select state (optional)</option>
                        {INDIAN_STATES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-ink/75">District / Town</label>
                      <input
                        type="text"
                        placeholder="e.g. Anand, Surat, Pune"
                        value={activeProfile.district ?? ''}
                        onChange={(e) => updateActiveProfile({ district: e.target.value })}
                        className="mt-1 min-h-[48px] w-full rounded-input border border-blue/25 bg-white px-4 text-sm font-semibold text-ink"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {(['rural', 'semi_urban', 'urban'] as DistrictType[]).map((dt) => (
                      <button
                        key={dt}
                        type="button"
                        onClick={() => updateActiveProfile({ district_type: dt })}
                        className={`min-h-[48px] rounded-pill border px-5 py-2 text-sm font-bold capitalize ${
                          activeProfile.district_type === dt
                            ? 'border-blue bg-blue text-white'
                            : 'border-blue/20 bg-white text-ink hover:bg-blue-50'
                        }`}
                      >
                        {dt.replace('_', '-')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentQuestion.id === 'income_band' && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(Object.keys(INCOME_BANDS) as IncomeBandId[]).map((bandId) => {
                      const band = INCOME_BANDS[bandId];
                      return (
                        <button
                          key={bandId}
                          type="button"
                          onClick={() =>
                            updateActiveProfile({ income_band: bandId, income: undefined })
                          }
                          className={`min-h-[54px] rounded-input border px-4 py-3 text-left text-sm font-bold transition ${
                            activeProfile.income_band === bandId
                              ? 'border-blue bg-blue text-white'
                              : 'border-blue/20 bg-white text-ink hover:bg-blue-50'
                          }`}
                        >
                          {locale === 'hi'
                            ? band.labelHi
                            : locale === 'gu'
                            ? band.labelGu
                            : band.labelEn}
                        </button>
                      );
                    })}
                  </div>
                  <div className="rounded-input border border-blue/15 bg-white/80 p-4">
                    <label className="text-xs font-bold text-ink/75">
                      Or enter exact annual income (Rs.):
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={5000}
                      placeholder="e.g. 180000"
                      value={activeProfile.income ?? ''}
                      onChange={(e) =>
                        updateActiveProfile({
                          income: e.target.value ? Number(e.target.value) : undefined,
                          income_band: undefined,
                        })
                      }
                      className="mt-1 min-h-[46px] w-full rounded-input border border-blue/25 bg-white px-4 font-mono-num text-sm font-bold text-ink"
                    />
                  </div>
                </div>
              )}

              {currentQuestion.id === 'age' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-ink">Selected Age</span>
                    <span className="rounded-pill bg-yellow px-4 py-1 font-mono-num text-lg font-bold text-ink">
                      {activeProfile.age ?? 'Not set'} {activeProfile.age !== undefined ? 'yrs' : ''}
                    </span>
                  </div>
                  <input
                    aria-label="Citizen age slider"
                    type="range"
                    min={1}
                    max={95}
                    value={activeProfile.age ?? 30}
                    onChange={(e) => updateActiveProfile({ age: Number(e.target.value) })}
                    className="h-3 w-full cursor-pointer accent-blue"
                  />
                  <div className="flex flex-wrap gap-2">
                    {[9, 19, 28, 45, 62, 72].map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => updateActiveProfile({ age: a })}
                        className="min-h-[40px] rounded-pill border border-blue/20 bg-white px-4 text-xs font-bold text-ink hover:bg-blue-50"
                      >
                        {a} yrs
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentQuestion.id === 'gender' && (
                <div className="grid grid-cols-3 gap-3">
                  {(['female', 'male', 'other'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => updateActiveProfile({ gender: g })}
                      className={`min-h-[54px] rounded-input border px-4 py-3 text-sm font-bold capitalize ${
                        activeProfile.gender === g
                          ? 'border-blue bg-blue text-white'
                          : 'border-blue/20 bg-white text-ink hover:bg-blue-50'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.id === 'category' && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {(['General', 'OBC', 'SC', 'ST', 'EWS'] as CategoryType[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => updateActiveProfile({ category: cat })}
                      className={`min-h-[54px] rounded-input border px-4 py-3 text-sm font-bold ${
                        activeProfile.category === cat
                          ? 'border-blue bg-blue text-white'
                          : 'border-blue/20 bg-white text-ink hover:bg-blue-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.id === 'land_hectares' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-ink">Agricultural Land Owned</span>
                    <span className="rounded-pill bg-yellow px-4 py-1 font-mono-num text-base font-bold text-ink">
                      {activeProfile.land_hectares ?? 0} ha
                    </span>
                  </div>
                  <input
                    aria-label="Agricultural land hectares slider"
                    type="range"
                    min={0}
                    max={10}
                    step={0.1}
                    value={activeProfile.land_hectares ?? 0}
                    onChange={(e) =>
                      updateActiveProfile({ land_hectares: Number(e.target.value) })
                    }
                    className="h-3 w-full cursor-pointer accent-blue"
                  />
                  <div className="flex flex-wrap gap-2">
                    {[0, 0.5, 1.0, 1.8, 3.0].map((ha) => (
                      <button
                        key={ha}
                        type="button"
                        onClick={() => updateActiveProfile({ land_hectares: ha })}
                        className="min-h-[40px] rounded-pill border border-blue/20 bg-white px-4 text-xs font-bold text-ink hover:bg-blue-50"
                      >
                        {ha === 0 ? 'Landless (0 ha)' : `${ha} ha`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentQuestion.id === 'household_flags' && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { key: 'is_bpl', label: 'BPL / Antyodaya Ration Card holder' },
                      { key: 'disability', label: 'Person with 40%+ disability (UDID)' },
                      { key: 'owns_pucca_house', label: 'Family already owns a pucca house' },
                      { key: 'is_income_tax_payer', label: 'Income-tax payer in household' },
                      { key: 'is_widow', label: 'Widow applicant' },
                    ].map((flag) => {
                      const val = Boolean(
                        activeProfile[flag.key as keyof CitizenProfile]
                      );
                      return (
                        <button
                          key={flag.key}
                          type="button"
                          onClick={() =>
                            updateActiveProfile({ [flag.key]: !val } as Partial<CitizenProfile>)
                          }
                          className={`flex min-h-[50px] items-center justify-between rounded-input border px-4 py-2 text-left text-xs font-bold ${
                            val
                              ? 'border-green bg-green-50 text-green-700'
                              : 'border-blue/20 bg-white text-ink'
                          }`}
                        >
                          <span>{flag.label}</span>
                          <span>{val ? 'YES' : 'NO'}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-ink/75">Highest Education</label>
                    <select
                      value={activeProfile.education ?? ''}
                      onChange={(e) =>
                        updateActiveProfile({
                          education: (e.target.value || undefined) as EducationLevel | undefined,
                        })
                      }
                      className="mt-1 min-h-[46px] w-full rounded-input border border-blue/25 bg-white px-4 text-sm font-semibold text-ink"
                    >
                      <option value="">Select education (optional)</option>
                      <option value="none">No formal schooling</option>
                      <option value="primary">Primary (up to 8th)</option>
                      <option value="secondary">10th / Secondary</option>
                      <option value="higher_secondary">12th / Higher Secondary</option>
                      <option value="diploma">ITI / Diploma</option>
                      <option value="graduate">Graduate</option>
                      <option value="postgraduate">Postgraduate</option>
                    </select>
                  </div>
                </div>
              )}

              {currentQuestion.id === 'held_documents' && (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {catalogue.documents.map((d) => {
                    const held = activeProfile.held_documents.includes(d.docKey);
                    return (
                      <button
                        key={d.docKey}
                        type="button"
                        onClick={() => toggleHeldDocument(d.docKey)}
                        className={`flex min-h-[48px] items-center justify-between rounded-input border px-4 py-2 text-left text-xs font-bold transition ${
                          held
                            ? 'border-green bg-green-50 text-green-700'
                            : 'border-blue/20 bg-white text-ink hover:bg-blue-50'
                        }`}
                      >
                        <span>
                          {locale === 'hi' ? d.nameHi : locale === 'gu' ? d.nameGu : d.nameEn}
                        </span>
                        <CheckCircle size={18} weight={held ? 'fill' : 'regular'} />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Step Navigation */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-blue/10 pt-4">
                <button
                  type="button"
                  onClick={() => setAnsweredSteps(new Set())}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-pill border border-blue/20 bg-white px-4 py-2 text-xs font-bold text-ink"
                >
                  <ArrowLeft size={14} weight="bold" />
                  Restart Steps
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => markNext(currentQuestion.id)}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-pill border border-blue/25 bg-white px-4 py-2 text-xs font-bold text-ink hover:bg-blue-50"
                  >
                    <SkipForward size={14} weight="duotone" />
                    Skip (keep Likely)
                  </button>
                  <button
                    type="button"
                    onClick={() => markNext(currentQuestion.id)}
                    className="inline-flex min-h-[46px] items-center gap-2 rounded-pill bg-blue px-6 py-2 text-sm font-bold text-white hover:bg-blue-700"
                  >
                    Save & Next
                    <ArrowRight size={16} weight="bold" />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Jump to any question pill strip */}
          <div className="glass p-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-ink/70 mr-1">Jump to:</span>
            {WIZARD_QUESTIONS.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() =>
                  setAnsweredSteps((prev) => {
                    const next = new Set(prev);
                    next.delete(q.id);
                    return next;
                  })
                }
                className={`min-h-[34px] rounded-pill px-3 py-1 text-xs font-bold ${
                  currentQuestion.id === q.id
                    ? 'bg-blue text-white'
                    : answeredSteps.has(q.id)
                    ? 'bg-green-50 text-green-700'
                    : 'bg-white text-ink border border-blue/15'
                }`}
              >
                {q.id.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Right Sidebar: Family Profiles / CSC Kiosk + Snapshot Share + Live Preview */}
        <div className="lg:col-span-4 space-y-5">
          {/* Family / CSC Citizen Profiles */}
          <div className="glass p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink">
                <UsersThree size={18} weight="duotone" className="text-blue" />
                {cscKioskMode ? 'CSC Citizen Queue' : 'Saved Family Profiles'}
              </h3>
              <span className="rounded-pill bg-blue-50 px-2.5 py-0.5 font-mono-num text-xs font-bold text-blue-700">
                {profiles.length}
              </span>
            </div>

            <div className="space-y-2">
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between rounded-chip border px-3 py-2 ${
                    p.id === activeProfileId
                      ? 'border-blue bg-blue-50'
                      : 'border-blue/15 bg-white/85'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => switchProfile(p.id)}
                    className="flex-1 text-left text-xs font-bold text-ink"
                  >
                    {p.label}
                    <span className="ml-2 text-[11px] font-normal text-ink/65">
                      {p.occupation ?? 'Any'} • {p.state ?? 'All India'}
                    </span>
                  </button>
                  {profiles.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Delete ${p.label}`}
                      onClick={() => deleteProfile(p.id)}
                      className="p-1 text-ink/60 hover:text-blue"
                    >
                      <Trash size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add family member / citizen..."
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="min-h-[42px] flex-1 rounded-pill border border-blue/25 bg-white px-3.5 text-xs font-semibold text-ink"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newMemberName.trim()) return;
                  addProfile(newMemberName);
                  setNewMemberName('');
                }}
                className="inline-flex min-h-[42px] items-center gap-1 rounded-pill bg-blue px-4 text-xs font-bold text-white"
              >
                <Plus size={14} weight="bold" />
                Add
              </button>
            </div>
          </div>

          {/* Live Results Summary & CTA */}
          <div className="glass p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-ink">
              <Sparkle size={18} weight="duotone" className="text-yellow-700" />
              Instant Preview
            </div>
            <div className="space-y-2">
              {orchestrated.ranked.slice(0, 4).map((r) => (
                <Link
                  key={r.scheme.id}
                  href={`/schemes/${r.scheme.slug}`}
                  className="block rounded-chip border border-blue/15 bg-white/85 px-3 py-2 text-xs hover:border-blue"
                >
                  <div className="flex items-center justify-between font-bold text-ink">
                    <span className="truncate pr-2">{r.scheme.nameEn}</span>
                    <span
                      className={`shrink-0 rounded-pill px-2 py-0.5 text-[10px] ${
                        r.eligibility.status === 'eligible'
                          ? 'bg-green text-white'
                          : r.eligibility.status === 'likely'
                          ? 'bg-yellow text-ink'
                          : 'border border-blue text-blue-700'
                      }`}
                    >
                      {r.eligibility.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <Link
              href="/schemes"
              className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-pill bg-blue px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
            >
              Open Full Masonry Board
              <ArrowRight size={16} weight="bold" />
            </Link>
          </div>

          {/* Extra Feature #2: Offline Snapshot Token / Share Card */}
          <div className="glass p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-ink">
              <QrCode size={18} weight="duotone" className="text-blue" />
              Offline Profile Snapshot
            </div>
            <p className="text-xs text-ink/75">
              Copy or import a compact offline profile code (zero server upload).
            </p>
            <button
              type="button"
              onClick={() => setSnapshotToken(encodeProfileSnapshot(activeProfile))}
              className="min-h-[40px] w-full rounded-pill border border-blue/25 bg-white px-3 text-xs font-bold text-ink hover:bg-blue-50"
            >
              Generate Snapshot Token
            </button>
            <textarea
              rows={2}
              placeholder="Paste snapshot token to import..."
              value={snapshotToken}
              onChange={(e) => setSnapshotToken(e.target.value)}
              className="w-full rounded-chip border border-blue/20 bg-white p-2 font-mono-num text-[11px] text-ink"
            />
            <button
              type="button"
              onClick={() => {
                const decoded = decodeProfileSnapshot(snapshotToken);
                if (decoded) {
                  addProfile(`${decoded.label} (Imported)`, decoded);
                  setImportMsg('Imported profile successfully!');
                } else {
                  setImportMsg('Invalid snapshot token.');
                }
              }}
              className="min-h-[38px] w-full rounded-pill bg-yellow px-3 text-xs font-bold text-ink"
            >
              Import Token
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[38px] w-full rounded-pill border border-blue/25 bg-white px-3 text-xs font-bold text-blue-700 hover:bg-blue-50"
            >
              Print Paper Intake Sheet
            </button>
            {importMsg && <p className="text-[11px] font-bold text-blue-700">{importMsg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

