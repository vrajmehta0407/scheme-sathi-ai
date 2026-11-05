'use client';

import React, { useState, useEffect } from 'react';
import {
  Scheme,
  UserProfile,
  MatchEvaluationResult,
  Language,
  SCHEME_CATEGORIES
} from '@schemesathi/shared';
import { translations } from '../lib/i18n';
import { fetchEligibilityMatches } from '../lib/api';
import {
  getStoredProfile,
  saveStoredProfile,
  clearStoredProfile,
  getSavedSchemeIds,
  toggleSaveSchemeId,
  getStoredLanguage,
  saveStoredLanguage
} from '../lib/storage';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SchemeCard } from '../components/schemes/SchemeCard';
import { ProfileModal } from '../components/profile/ProfileModal';
import { SchemeDetailModal } from '../components/schemes/SchemeDetailModal';
import { CompareModal } from '../components/schemes/CompareModal';
import { AskAiDrawer } from '../components/chat/AskAiDrawer';
import { FeedbackModal } from '../components/feedback/FeedbackModal';
import { AdminReviewModal } from '../components/admin/AdminReviewModal';
import {
  Search,
  Filter,
  Sparkles,
  ArrowRight,
  Shield,
  FileCheck,
  Building,
  RotateCcw,
  SlidersHorizontal,
  Bookmark
} from 'lucide-react';

export default function HomePage() {
  const [language, setLanguage] = useState<Language>('en');
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [savedSchemeIds, setSavedSchemeIds] = useState<string[]>([]);
  const [matchResults, setMatchResults] = useState<MatchEvaluationResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [selectedSchemeForDetail, setSelectedSchemeForDetail] = useState<Scheme | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  // Initialize storage state on client mount
  useEffect(() => {
    const savedLang = getStoredLanguage();
    setLanguage(savedLang);

    const storedProfile = getStoredProfile();
    if (storedProfile) {
      setUserProfile(storedProfile);
    }

    const savedIds = getSavedSchemeIds();
    setSavedSchemeIds(savedIds);
  }, []);

  // Fetch / Evaluate matches whenever profile or category changes
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const results = await fetchEligibilityMatches(
          userProfile,
          selectedCategory || undefined,
          userProfile.state || undefined
        );
        setMatchResults(results);
      } catch (err) {
        console.error('Failed to load matches:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userProfile, selectedCategory]);

  const toggleLanguage = () => {
    const nextLang: Language = language === 'en' ? 'gu' : 'en';
    setLanguage(nextLang);
    saveStoredLanguage(nextLang);
  };

  const handleSaveProfile = (newProfile: UserProfile) => {
    setUserProfile(newProfile);
    saveStoredProfile(newProfile);
  };

  const handleResetProfile = () => {
    setUserProfile({});
    clearStoredProfile();
  };

  const handleToggleSave = (id: string) => {
    const updated = toggleSaveSchemeId(id);
    setSavedSchemeIds(updated);
  };

  const t = translations[language];

  // Client-side search and level filtering
  const filteredResults = matchResults.filter((item) => {
    const s = item.scheme;
    if (selectedLevel && s.level !== selectedLevel) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const inEn = s.name_en.toLowerCase().includes(q) || s.short_description_en.toLowerCase().includes(q);
      const inGu = s.name_gu.toLowerCase().includes(q) || s.short_description_gu.toLowerCase().includes(q);
      const inTags = (s.tags || []).some((tag) => tag.toLowerCase().includes(q));
      if (!inEn && !inGu && !inTags) return false;
    }
    return true;
  });

  const hasActiveProfile = Object.keys(userProfile).length > 0;
  const savedSchemesList = matchResults
    .filter((r) => savedSchemeIds.includes(r.scheme.id))
    .map((r) => r.scheme);

  return (
    <div className="min-h-screen flex flex-col bg-canvas selection:bg-primary/20">
      {/* Sticky Navigation */}
      <Navbar
        language={language}
        onToggleLanguage={toggleLanguage}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenSaved={() => setIsCompareOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        hasProfile={hasActiveProfile}
        savedCount={savedSchemeIds.length}
      />

      <main className="flex-1">
        {/* Editorial Hero Section */}
        <section className="relative overflow-hidden hero-pattern pt-12 pb-16 md:pt-20 md:pb-24 px-4 sm:px-6 lg:px-8 border-b border-editorial-border/60">
          {/* Subtle floating abstract paper illustrations */}
          <div className="absolute top-10 right-6 md:right-24 w-64 h-64 bg-accent-lavender-soft rounded-full filter blur-3xl -z-10 animate-float-slow opacity-70 pointer-events-none" />
          <div className="absolute bottom-6 left-6 md:left-20 w-72 h-72 bg-accent-mango-soft rounded-full filter blur-3xl -z-10 animate-float-medium opacity-60 pointer-events-none" />

          <div className="max-w-5xl mx-auto text-center space-y-6">
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-editorial-border shadow-xs text-xs font-bold text-ink">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>{t.hero.badge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-ink leading-[1.15] max-w-4xl mx-auto">
              {t.hero.title}
            </h1>

            {/* Subcopy */}
            <p className="text-sm sm:text-base md:text-lg text-ink-light max-w-2xl mx-auto leading-relaxed">
              {t.hero.subtitle}
            </p>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setIsProfileOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-bold shadow-paper-hover active:scale-95 transition-all"
              >
                <span>{t.hero.ctaFind}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#discover"
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white hover:bg-canvas text-ink text-sm font-bold border border-editorial-border shadow-xs transition-all text-center"
              >
                {t.hero.ctaBrowse}
              </a>
            </div>

            {/* 3 Trust Pillars */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-semibold text-ink-light">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-editorial-border">
                <Shield className="w-4 h-4 text-primary" />
                <span>{t.hero.trustPill1}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-editorial-border">
                <FileCheck className="w-4 h-4 text-secondary" />
                <span>{t.hero.trustPill2}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-editorial-border">
                <Building className="w-4 h-4 text-accent-coral" />
                <span>{t.hero.trustPill3}</span>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works 3 Steps */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center mb-10 space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-ink">
              {t.howItWorks.title}
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted max-w-xl mx-auto">
              A transparent, rule-grounded approach to public welfare navigation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="editorial-card p-6 bg-white space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-soft text-primary font-display font-extrabold flex items-center justify-center text-sm">
                01
              </div>
              <h3 className="font-bold text-base text-ink">{t.howItWorks.step1Title}</h3>
              <p className="text-xs text-ink-light leading-relaxed">{t.howItWorks.step1Desc}</p>
            </div>

            <div className="editorial-card p-6 bg-white space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-secondary-soft text-secondary font-display font-extrabold flex items-center justify-center text-sm">
                02
              </div>
              <h3 className="font-bold text-base text-ink">{t.howItWorks.step2Title}</h3>
              <p className="text-xs text-ink-light leading-relaxed">{t.howItWorks.step2Desc}</p>
            </div>

            <div className="editorial-card p-6 bg-white space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-accent-coral-soft text-accent-coral font-display font-extrabold flex items-center justify-center text-sm">
                03
              </div>
              <h3 className="font-bold text-base text-ink">{t.howItWorks.step3Title}</h3>
              <p className="text-xs text-ink-light leading-relaxed">{t.howItWorks.step3Desc}</p>
            </div>
          </div>
        </section>

        {/* Scheme Discovery Catalog Section */}
        <section id="discover" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 scroll-mt-20">
          {/* Header + Active Profile Strip */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-editorial-border">
            <div>
              <h2 className="text-2xl font-bold font-display text-ink">
                {t.results.heading}
              </h2>
              <p className="text-xs sm:text-sm text-ink-muted mt-1">
                {t.results.subheading}
              </p>
            </div>

            {/* Profile State Chip */}
            {hasActiveProfile ? (
              <div className="flex items-center gap-2 p-2 px-3 rounded-full bg-white border border-editorial-border shadow-xs text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-status-success animate-pulse" />
                <span className="text-ink font-semibold">
                  {userProfile.state || 'Pan-India'} • {userProfile.occupation || 'Any Role'}
                </span>
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="text-primary hover:underline font-bold ml-1"
                >
                  Edit
                </button>
                <button
                  onClick={handleResetProfile}
                  className="text-status-error hover:bg-status-error-soft p-1 rounded-full ml-1"
                  title="Reset Profile"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-editorial-border hover:border-primary/40 text-xs font-semibold text-ink shadow-xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
                <span>Filter by Personal Profile</span>
              </button>
            )}
          </div>

          {/* Search & Filter Bar */}
          <div className="space-y-4">
            {/* Search Input + Jurisdiction Radio */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.results.searchPlaceholder}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-editorial-border text-xs text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-primary focus:outline-none shadow-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink text-xs px-2 py-1"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Jurisdiction Pill Filters */}
              <div className="flex items-center p-1 rounded-2xl bg-white border border-editorial-border shadow-xs text-xs font-semibold w-full sm:w-auto shrink-0">
                <button
                  onClick={() => setSelectedLevel('')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    selectedLevel === '' ? 'bg-ink text-white' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  All Schemes
                </button>
                <button
                  onClick={() => setSelectedLevel('central')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    selectedLevel === 'central' ? 'bg-ink text-white' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {t.results.centralOnly}
                </button>
                <button
                  onClick={() => setSelectedLevel('state')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    selectedLevel === 'state' ? 'bg-ink text-white' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {t.results.stateOnly}
                </button>
              </div>
            </div>

            {/* Category Chips Scroll */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === ''
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white text-ink border-editorial-border hover:border-editorial-border-hover'
                }`}
              >
                {t.results.allCategories}
              </button>

              {SCHEME_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(isSelected ? '' : cat.id)}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-ink text-white border-ink shadow-xs'
                        : 'bg-white text-ink border-editorial-border hover:border-editorial-border-hover'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{language === 'gu' ? cat.label_gu : cat.label_en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scheme Cards Grid (Pinterest-inspired 3-column editorial layout) */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="editorial-card p-6 h-80 animate-pulse bg-white space-y-4">
                  <div className="h-4 bg-black/5 rounded-full w-1/3" />
                  <div className="h-6 bg-black/5 rounded-md w-3/4" />
                  <div className="h-16 bg-black/5 rounded-xl" />
                  <div className="h-12 bg-black/5 rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="editorial-card p-12 text-center bg-white space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-black/5 text-ink-muted flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-ink">{t.results.noMatches}</h3>
              <p className="text-xs text-ink-muted max-w-md mx-auto">
                {t.results.broadenPrompt}
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setSelectedLevel('');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-full text-xs font-bold text-primary bg-primary-soft hover:bg-primary/20"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {filteredResults.map((result) => {
                const s = result.scheme;
                const isSaved = savedSchemeIds.includes(s.id);
                return (
                  <SchemeCard
                    key={s.id}
                    scheme={s}
                    matchStatus={result.match_status}
                    matchedCount={result.matched_criteria.length}
                    unknownCount={result.unknown_criteria.length}
                    language={language}
                    isSaved={isSaved}
                    onToggleSave={handleToggleSave}
                    onOpenDetails={(sc) => setSelectedSchemeForDetail(sc)}
                  />
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <Footer
        language={language}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
      />

      {/* Guided Profile Questionnaire Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        language={language}
        currentProfile={userProfile}
        onSaveProfile={handleSaveProfile}
        onResetProfile={handleResetProfile}
      />

      {/* Scheme Detail Breakdown Modal */}
      <SchemeDetailModal
        scheme={selectedSchemeForDetail}
        matchEvaluation={
          selectedSchemeForDetail
            ? matchResults.find((r) => r.scheme_id === selectedSchemeForDetail.id) || null
            : null
        }
        isOpen={selectedSchemeForDetail !== null}
        onClose={() => setSelectedSchemeForDetail(null)}
        language={language}
        isSaved={selectedSchemeForDetail ? savedSchemeIds.includes(selectedSchemeForDetail.id) : false}
        onToggleSave={handleToggleSave}
      />

      {/* Saved / Compare Drawer */}
      <CompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        savedSchemes={savedSchemesList}
        onRemoveSaved={handleToggleSave}
        onOpenDetails={(sc) => {
          setIsCompareOpen(false);
          setSelectedSchemeForDetail(sc);
        }}
        language={language}
      />

      {/* Grounded AI Assistant Drawer */}
      <AskAiDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        language={language}
        userProfile={userProfile}
        activeSchemeId={selectedSchemeForDetail?.id}
      />

      {/* User Feedback & Outdated Report Dialog */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        language={language}
      />

      {/* Admin Content & Provenance Review Panel */}
      <AdminReviewModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        language={language}
      />
    </div>
  );
}
