import en from '../../messages/en.json';
import hi from '../../messages/hi.json';
import gu from '../../messages/gu.json';
import type { Locale, SchemeRecord } from '../types';

export const MESSAGES: Record<Locale, typeof en> = { en, hi, gu };

export function getSchemeName(s: SchemeRecord, locale: Locale): string {
  if (locale === 'hi') return s.nameHi || s.nameEn;
  if (locale === 'gu') return s.nameGu || s.nameEn;
  return s.nameEn;
}

export function getSchemeSummary(s: SchemeRecord, locale: Locale): string {
  if (locale === 'hi') return s.summaryHi || s.summaryEn;
  if (locale === 'gu') return s.summaryGu || s.summaryEn;
  return s.summaryEn;
}

export function getSchemeSteps(s: SchemeRecord, locale: Locale): string[] {
  if (locale === 'hi') return s.steps.hi?.length ? s.steps.hi : s.steps.en;
  if (locale === 'gu') return s.steps.gu?.length ? s.steps.gu : s.steps.en;
  return s.steps.en;
}

