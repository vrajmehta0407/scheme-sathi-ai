'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  CheckCircle,
  LockKey,
  Sparkle,
  Tractor,
  GraduationCap,
  GenderFemale,
  Heart,
  Briefcase,
  Storefront,
  FirstAid,
  House,
  SlidersHorizontal,
} from '@phosphor-icons/react';
import { useSathiStore } from '@/lib/store/useSathiStore';
import { MESSAGES, getSchemeName } from '@/lib/i18n/messages';
import { LIFE_EVENT_BUNDLES } from '@/lib/profile';
import { evaluateAllSchemes } from '@/lib/rules';
import { formatINR } from '@/lib/benefits';
import { BrandConfetti } from '@/components/glass/BrandConfetti';

gsap.registerPlugin(ScrollTrigger);

const CATEGORY_CARDS = [
  { key: 'farmers', label: 'Farmers & Dairy', count: '8 sample schemes', icon: Tractor },
  { key: 'students', label: 'Students & Youth', count: '7 sample schemes', icon: GraduationCap },
  { key: 'women', label: 'Women & Mothers', count: '8 sample schemes', icon: GenderFemale },
  { key: 'seniors', label: 'Senior Citizens', count: '6 sample schemes', icon: Heart },
  { key: 'workers', label: 'Workers & Artisans', count: '7 sample schemes', icon: Briefcase },
  { key: 'entrepreneurs', label: 'Entrepreneurs', count: '6 sample schemes', icon: Storefront },
  { key: 'health', label: 'Health Cover', count: '6 sample schemes', icon: FirstAid },
  { key: 'housing', label: 'Housing & Solar', count: '6 sample schemes', icon: House },
];

export default function LandingPage() {
  const { locale, catalogue, addProfile } = useSathiStore();
  const t = MESSAGES[locale];

  const [demoIncome, setDemoIncome] = useState(180000);
  const [demoOcc, setDemoOcc] = useState<'farmer' | 'student' | 'worker' | 'entrepreneur'>('farmer');
  const [countedUnclaimed, setCountedUnclaimed] = useState(0);
  const [confettiBurst, setConfettiBurst] = useState(false);
  const storyRef = useRef<HTMLDivElement>(null);

  // Count-up ticker (1.2s cubic-bezier feel)
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = 124000;
    if (reduced) {
      setCountedUnclaimed(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 1200);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCountedUnclaimed(Math.round(target * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setConfettiBurst(true);
        setTimeout(() => setConfettiBurst(false), 1200);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // GSAP ScrollTrigger staggered story reveal
  useEffect(() => {
    if (!storyRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => {
      gsap.from('.story-step', {
        y: 26,
        opacity: 0,
        duration: 0.65,
        stagger: 0.14,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: storyRef.current,
          start: 'top 82%',
          once: true,
        },
      });
    }, storyRef);
    return () => ctx.revert();
  }, []);

  // Interactive income slider live demo
  const demoMatches = useMemo(() => {
    if (!catalogue.schemes.length) return [];
    const profile = {
      id: 'demo',
      label: 'Demo',
      state: 'Gujarat',
      district_type: 'rural' as const,
      age: demoOcc === 'student' ? 19 : 42,
      gender: 'female' as const,
      income: demoIncome,
      occupation: demoOcc,
      category: 'OBC' as const,
      land_hectares: demoOcc === 'farmer' ? 1.5 : 0,
      education: 'higher_secondary' as const,
      is_bpl: demoIncome <= 150000,
      is_income_tax_payer: demoIncome > 700000,
      owns_pucca_house: false,
      held_documents: ['aadhaar', 'bank_passbook'],
    };
    const evalMap = evaluateAllSchemes(catalogue.schemes, profile);
    return catalogue.schemes
      .filter((s) => evalMap.get(s.id)?.status === 'eligible')
      .slice(0, 6);
  }, [catalogue.schemes, demoIncome, demoOcc]);

  const marqueeSchemes = catalogue.schemes.slice(0, 12);

  return (
    <div className="space-y-16 md:space-y-24">
      {/* 1. HERO SECTION */}
      <section className="grid items-center gap-8 pt-2 lg:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-7 space-y-6"
        >
          <span className="inline-flex items-center gap-2 rounded-pill bg-yellow px-4 py-1.5 text-xs font-bold text-ink shadow-sm">
            <Sparkle size={16} weight="duotone" />
            Offline PWA • English • हिन्दी • ગુજરાતી
          </span>

          <h1 className="font-display text-4xl font-bold leading-[1.06] text-ink sm:text-6xl">
            {t.hero.headline}
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-ink/80 sm:text-lg">
            {t.hero.sub}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/wizard"
              className="inline-flex min-h-[50px] items-center gap-2 rounded-pill bg-blue px-6 py-3 text-base font-bold text-white shadow-glass transition hover:bg-blue-700"
            >
              {t.hero.ctaStart}
              <ArrowRight size={18} weight="bold" />
            </Link>
            <Link
              href="/schemes"
              className="glass inline-flex min-h-[50px] items-center gap-2 rounded-pill px-6 py-3 text-base font-bold text-ink transition hover:bg-white"
            >
              {t.hero.ctaBrowse}
            </Link>
          </div>

          <div className="glass-yellow inline-flex items-center gap-4 rounded-card px-5 py-3.5">
            <div className="relative">
              <BrandConfetti active={confettiBurst} />
              <div className="font-mono-num text-2xl font-bold text-ink sm:text-3xl">
                {formatINR(countedUnclaimed)} / yr
              </div>
            </div>
            <div className="text-xs font-semibold text-ink/85">
              {t.hero.unclaimedLabel}
              <div className="text-[11px] opacity-75">Sample estimate • verify on official portals</div>
            </div>
          </div>
        </motion.div>

        {/* Floating Glass Wizard Quick-Start Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="lg:col-span-5"
        >
          <div className="glass p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="rounded-pill bg-green/15 px-3 py-1 text-xs font-bold text-green-700">
                1-Tap Life-Event Bundles
              </span>
              <span className="font-mono-num text-xs font-semibold text-ink/70">
                {catalogue.schemes.length || 54} Sample Schemes
              </span>
            </div>
            <h2 className="font-display text-xl font-bold text-ink">
              Jump straight to your situation
            </h2>
            <div className="space-y-2.5">
              {LIFE_EVENT_BUNDLES.map((b) => (
                <Link
                  key={b.id}
                  href="/schemes"
                  onClick={() => addProfile(b.titleEn, b.preset)}
                  className="flex min-h-[52px] items-center justify-between rounded-input border border-blue/15 bg-white/85 px-4 py-2.5 transition hover:border-blue hover:bg-blue-50"
                >
                  <div>
                    <div className="text-sm font-bold text-ink">
                      {locale === 'hi' ? b.titleHi : locale === 'gu' ? b.titleGu : b.titleEn}
                    </div>
                    <div className="text-xs text-ink/70">
                      {locale === 'hi' ? b.descHi : locale === 'gu' ? b.descGu : b.descEn}
                    </div>
                  </div>
                  <ArrowRight size={16} weight="bold" className="text-blue shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* 2. TRILINGUAL MARQUEE */}
      <section aria-label="Featured sample schemes" className="overflow-hidden rounded-card border border-white/80 bg-white/60 py-3.5 backdrop-blur-md">
        <div className="animate-marquee flex w-max items-center gap-6 px-4">
          {[...marqueeSchemes, ...marqueeSchemes].map((s, idx) => (
            <Link
              key={`${s.id}-${idx}`}
              href={`/schemes/${s.slug}`}
              className="inline-flex items-center gap-2 rounded-pill border border-blue/15 bg-white/90 px-4 py-1.5 text-xs font-bold text-ink hover:border-blue"
            >
              <span className="h-2 w-2 rounded-full bg-green" />
              <span>{getSchemeName(s, locale)}</span>
              <span className="rounded-pill bg-yellow px-2 py-0.5 font-mono-num text-[11px] text-ink">
                {formatINR(s.benefitAmount)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. HOW IT WORKS (3 STEPS) */}
      <section ref={storyRef} className="space-y-6">
        <div className="text-center">
          <span className="rounded-pill bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            How Scheme Sathi Works
          </span>
          <h2 className="mt-2 font-display text-3xl font-bold text-ink">
            Tell. Match. Apply — Zero guesswork.
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              step: '01',
              title: 'Tell Sathi about you',
              desc: 'Answer under 10 friendly questions (or skip any). Missing answers become "Likely", never hidden or guessed.',
            },
            {
              step: '02',
              title: 'Instant local rules match',
              desc: 'Our pure-TypeScript rules engine checks 54 sample Central & Gujarat schemes in under 5 ms with plain "Why?" reasons.',
            },
            {
              step: '03',
              title: 'Checklist, PDF & Track',
              desc: 'Get one deduped document checklist, export a printable PDF dossier, and track every application locally.',
            },
          ].map((item) => (
            <div key={item.step} className="story-step glass p-6 space-y-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-chip bg-yellow font-mono-num text-sm font-bold text-ink">
                {item.step}
              </span>
              <h3 className="font-display text-xl font-bold text-ink">{item.title}</h3>
              <p className="text-sm leading-relaxed text-ink/80">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. INTERACTIVE INCOME SLIDER DEMO */}
      <section className="glass p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1 rounded-pill bg-yellow px-3 py-1 text-xs font-bold text-ink">
              <SlidersHorizontal size={14} weight="duotone" />
              Live Interactive Rules Demo
            </span>
            <h2 className="mt-2 font-display text-2xl font-bold text-ink">
              Drag the income slider & watch eligible schemes update live
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['farmer', 'student', 'worker', 'entrepreneur'] as const).map((occ) => (
              <button
                key={occ}
                type="button"
                onClick={() => setDemoOcc(occ)}
                className={`min-h-[40px] rounded-pill px-4 py-1.5 text-xs font-bold capitalize transition ${
                  demoOcc === occ
                    ? 'bg-blue text-white'
                    : 'border border-blue/20 bg-white text-ink hover:bg-blue-50'
                }`}
              >
                {occ}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-input border border-blue/15 bg-white/80 p-4">
          <div className="flex items-center justify-between text-sm font-bold text-ink">
            <span>Annual Household Income (Gujarat sample profile)</span>
            <span className="font-mono-num text-lg text-blue">{formatINR(demoIncome)}</span>
          </div>
          <input
            aria-label="Demo household income slider"
            type="range"
            min={50000}
            max={900000}
            step={25000}
            value={demoIncome}
            onChange={(e) => setDemoIncome(Number(e.target.value))}
            className="mt-3 h-3 w-full cursor-pointer accent-blue"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {demoMatches.map((s) => (
            <Link
              key={s.id}
              href={`/schemes/${s.slug}`}
              className="rounded-card border border-green/30 bg-white/90 p-4 transition hover:-translate-y-1 hover:shadow-glass"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-pill bg-green px-2.5 py-0.5 text-[11px] font-bold text-white">
                  Eligible
                </span>
                <span className="font-mono-num text-xs font-bold text-ink">
                  {formatINR(s.benefitAmount)}
                </span>
              </div>
              <div className="mt-2 font-display text-base font-bold text-ink">
                {getSchemeName(s, locale)}
              </div>
              <div className="mt-1 text-xs text-ink/70">{s.category} • {s.state}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. MASONRY CATEGORY CARDS */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-ink">
              Explore by citizen category
            </h2>
            <p className="text-sm text-ink/75">
              Central & Gujarat sample welfare schemes across 8 sectors
            </p>
          </div>
          <Link href="/schemes" className="text-sm font-bold text-blue hover:underline">
            View full masonry board →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORY_CARDS.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.key}
                href={`/schemes?category=${cat.key}`}
                className="glass flex items-center gap-4 p-5 transition hover:-translate-y-1 hover:shadow-glass-hover"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue">
                  <Icon size={24} weight="duotone" />
                </span>
                <div>
                  <div className="font-display text-base font-bold text-ink">{cat.label}</div>
                  <div className="text-xs font-semibold text-ink/70">{cat.count}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 6. ANALYTICS & DASHBOARD PREVIEW FRAME */}
      <section className="glass p-6 md:p-8">
        <div className="grid items-center gap-8 lg:grid-cols-12">
          <div className="lg:col-span-6 space-y-4">
            <span className="rounded-pill bg-yellow px-3 py-1 text-xs font-bold text-ink">
              NGO & Policy Analytics Workbench
            </span>
            <h2 className="font-display text-3xl font-bold text-ink">
              20,000 synthetic households analysed locally
            </h2>
            <p className="text-sm leading-relaxed text-ink/80">
              Explore state-by-state coverage gaps on our bundled India TopoJSON map, inspect top
              blocking rules, run two-proportion z-tests across custom cohorts, and export CSVs —
              with strict minimum cell size 30 suppression.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/analytics"
                className="inline-flex min-h-[46px] items-center gap-2 rounded-pill bg-blue px-5 py-2.5 text-sm font-bold text-white"
              >
                Open Analytics Workbench
                <ArrowRight size={16} weight="bold" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex min-h-[46px] items-center gap-2 rounded-pill border border-blue/25 bg-white px-5 py-2.5 text-sm font-bold text-ink"
              >
                Citizen Dashboard
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-card border border-blue/20 bg-white/90 p-5 shadow-glass space-y-4">
              <div className="flex items-center justify-between border-b border-blue/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue" />
                  <span className="h-3 w-3 rounded-full bg-yellow" />
                  <span className="h-3 w-3 rounded-full bg-green" />
                </div>
                <span className="rounded-pill bg-yellow px-2.5 py-0.5 text-[11px] font-bold text-ink">
                  Synthetic data
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-chip bg-blue-50 p-3">
                  <div className="text-[11px] font-semibold text-ink/70">Synthetic Sample</div>
                  <div className="font-mono-num text-xl font-bold text-ink">20,000</div>
                </div>
                <div className="rounded-chip bg-green-50 p-3">
                  <div className="text-[11px] font-semibold text-ink/70">States Covered</div>
                  <div className="font-mono-num text-xl font-bold text-green-700">22</div>
                </div>
                <div className="rounded-chip bg-yellow-50 p-3">
                  <div className="text-[11px] font-semibold text-ink/70">Min Cell Rule</div>
                  <div className="font-mono-num text-xl font-bold text-ink">n ≥ 30</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7 & 8. PRIVACY PROMISE + FINAL CTA */}
      <section className="glass-blue rounded-card p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue text-white">
          <LockKey size={24} weight="duotone" />
        </div>
        <h2 className="font-display text-3xl font-bold text-ink">
          No login. No API keys. No tracking.
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-ink/80">
          Your answers stay in your browser&apos;s local storage or local SQLite database. Export an
          AES-GCM encrypted backup or erase everything in one click anytime.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/wizard"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-pill bg-blue px-6 py-3 text-sm font-bold text-white"
          >
            <CheckCircle size={18} weight="duotone" />
            Find My Schemes Now
          </Link>
        </div>
      </section>
    </div>
  );
}

