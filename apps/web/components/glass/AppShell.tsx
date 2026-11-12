'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  MagicWand,
  SlidersHorizontal,
  FolderOpen,
  ChartPieSlice,
  ChartLineUp,
  GearSix,
  ShieldCheck,
  UsersThree,
  WifiSlash,
  WifiHigh,
  BookOpen,
} from '@phosphor-icons/react';
import { useSathiStore } from '@/lib/store/useSathiStore';
import { MESSAGES } from '@/lib/i18n/messages';
import { OFFLINE_GLOSSARY } from '@/lib/explain';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    locale,
    setLocale,
    hydrate,
    loadCatalogue,
    profiles,
    activeProfileId,
    switchProfile,
    cscKioskMode,
    setCscKioskMode,
  } = useSathiStore();

  const [isOffline, setIsOffline] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [glossaryQuery, setGlossaryQuery] = useState('');
  const [readingMode, setReadingMode] = useState(false);

  useEffect(() => {
    hydrate();
    loadCatalogue();
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const updateNet = () => setIsOffline(!navigator.onLine);
    updateNet();
    window.addEventListener('online', updateNet);
    window.addEventListener('offline', updateNet);
    return () => {
      window.removeEventListener('online', updateNet);
      window.removeEventListener('offline', updateNet);
    };
  }, [hydrate, loadCatalogue]);

  const t = MESSAGES[locale];

  const navItems = [
    { href: '/', label: t.nav.home, icon: Compass },
    { href: '/wizard', label: t.nav.wizard, icon: MagicWand },
    { href: '/schemes', label: t.nav.schemes, icon: FolderOpen },
    { href: '/what-if', label: t.nav.whatIf, icon: SlidersHorizontal },
    { href: '/documents', label: t.nav.documents, icon: ShieldCheck },
    { href: '/dashboard', label: t.nav.dashboard, icon: ChartPieSlice },
    { href: '/analytics', label: t.nav.analytics, icon: ChartLineUp },
    { href: '/admin', label: t.nav.admin, icon: GearSix },
    { href: '/settings', label: t.nav.settings, icon: UsersThree },
  ];

  return (
    <div className={`min-h-screen flex flex-col ${readingMode ? 'text-[17px] leading-relaxed tracking-wide' : ''}`}>
      {/* Persistent sample & offline safety strip */}
      <div className="border-b border-blue/15 bg-white/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-xs font-medium text-ink">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-pill bg-yellow px-2.5 py-0.5 font-semibold text-ink">
              {t.badges.sample}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-pill bg-blue-50 px-2.5 py-0.5 text-blue-700">
              {isOffline ? <WifiSlash size={14} weight="duotone" /> : <WifiHigh size={14} weight="duotone" />}
              {t.badges.offline}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReadingMode((v) => !v)}
              className={`inline-flex min-h-[32px] items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-semibold transition ${
                readingMode
                  ? 'bg-green text-white'
                  : 'border border-blue/25 bg-white text-ink hover:bg-blue-50'
              }`}
              title="Toggle Accessible Large-Text Reading Mode"
            >
              Aa {readingMode ? 'Large' : 'Std'}
            </button>

            <button
              type="button"
              onClick={() => setGlossaryOpen((v) => !v)}
              className="inline-flex min-h-[32px] items-center gap-1 rounded-pill border border-blue/25 bg-white px-2.5 py-1 text-xs font-semibold text-ink hover:bg-blue-50"
            >
              <BookOpen size={14} weight="duotone" className="text-blue" />
              Glossary
            </button>

            <button
              type="button"
              onClick={() => setCscKioskMode(!cscKioskMode)}
              className={`inline-flex min-h-[32px] items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-semibold transition ${
                cscKioskMode
                  ? 'bg-blue text-white'
                  : 'border border-blue/25 bg-white text-ink hover:bg-blue-50'
              }`}
              title="Toggle CSC / Volunteer Multi-Citizen Kiosk Mode"
            >
              <UsersThree size={14} weight="duotone" />
              {cscKioskMode ? 'CSC Kiosk: ON' : 'CSC Mode'}
            </button>

            <select
              aria-label="Active citizen profile"
              value={activeProfileId}
              onChange={(e) => switchProfile(e.target.value)}
              className="min-h-[32px] rounded-pill border border-blue/25 bg-white px-2.5 py-1 text-xs font-semibold text-ink"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>

            <div className="flex items-center rounded-pill border border-blue/25 bg-white p-0.5">
              {(['en', 'hi', 'gu'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLocale(lang)}
                  className={`rounded-pill px-2.5 py-0.5 text-xs font-bold uppercase transition ${
                    locale === lang ? 'bg-blue text-white' : 'text-ink hover:bg-blue-50'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header Navigation */}
      <header className="sticky top-0 z-30 border-b border-white/80 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue text-white shadow-glass">
              <span className="h-4 w-4 rounded-full bg-yellow ring-4 ring-white/30" />
            </span>
            <div>
              <span className="font-display text-lg font-bold text-ink">{t.appName}</span>
              <p className="hidden text-[11px] font-medium text-ink/70 sm:block">
                Local Rules Engine • Zero Tracking
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-1 overflow-x-auto py-1" aria-label="Primary">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-pill px-3.5 py-2 text-sm font-semibold transition ${
                    active
                      ? 'bg-blue text-white shadow-sm'
                      : 'text-ink hover:bg-blue-50'
                  }`}
                >
                  <Icon size={17} weight="duotone" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Extra Feature #7: Offline Jargon Glossary Drawer */}
      {glossaryOpen && (
        <div className="mx-auto mt-3 w-full max-w-7xl px-4">
          <div className="glass p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-base font-bold text-ink">
                Plain-Language Scheme Glossary ({locale.toUpperCase()})
              </h2>
              <div className="flex items-center gap-2">
                <input
                  type="search"
                  value={glossaryQuery}
                  onChange={(e) => setGlossaryQuery(e.target.value)}
                  placeholder="Filter terms (BPL, EWS, NPCI)..."
                  className="min-h-[34px] rounded-pill border border-blue/25 bg-white px-3 text-xs font-semibold text-ink"
                />
                <button
                  type="button"
                  onClick={() => setGlossaryOpen(false)}
                  className="min-h-[36px] rounded-pill bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {OFFLINE_GLOSSARY.filter((g) => {
                if (!glossaryQuery.trim()) return true;
                const q = glossaryQuery.toLowerCase();
                return (
                  g.term.toLowerCase().includes(q) ||
                  g.en.toLowerCase().includes(q) ||
                  g.hi.toLowerCase().includes(q) ||
                  g.gu.toLowerCase().includes(q)
                );
              }).map((g) => (
                <div key={g.term} className="rounded-chip border border-blue/15 bg-white/80 p-3">
                  <div className="text-sm font-bold text-blue-700">{g.term}</div>
                  <p className="mt-1 text-xs leading-relaxed text-ink/85">
                    {locale === 'hi' ? g.hi : locale === 'gu' ? g.gu : g.en}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:py-8">
        {children}
      </main>

      <footer className="mt-12 border-t border-blue/15 bg-white/70 py-6 text-center text-xs text-ink/75 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 space-y-1">
          <p className="font-semibold text-ink">
            Scheme Sathi AI — Local-First Prototype • Zero API Keys • Works Offline
          </p>
          <p>
            All scheme rules are <strong>SAMPLE data</strong> and analytics use a seeded{' '}
            <strong>20,000-household Synthetic Dataset</strong>. Always verify eligibility on the official government portal before applying.
          </p>
        </div>
      </footer>
    </div>
  );
}

