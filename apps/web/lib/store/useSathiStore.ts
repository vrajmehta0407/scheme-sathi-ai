'use client';

import { create } from 'zustand';
import type {
  ApplicationRecord,
  ApplicationStatus,
  CitizenProfile,
  DocumentRecord,
  Locale,
  SchemeRecord,
} from '../types';
import { localDexie } from './db';
import { transitionApplication } from '../tracker';

export const DEFAULT_PROFILE: CitizenProfile = {
  id: 'guest-primary',
  label: 'Ramesh (Self)',
  held_documents: ['aadhaar', 'bank_passbook'],
  doc_expiries: {},
};

interface SathiStoreState {
  hydrated: boolean;
  locale: Locale;
  profiles: CitizenProfile[];
  activeProfileId: string;
  bookmarksByProfile: Record<string, string[]>;
  applicationsByProfile: Record<string, ApplicationRecord[]>;
  compareIds: string[];
  cscKioskMode: boolean;
  catalogue: {
    schemes: SchemeRecord[];
    documents: DocumentRecord[];
    loaded: boolean;
  };
  hydrate: () => Promise<void>;
  loadCatalogue: () => Promise<void>;
  setLocale: (locale: Locale) => void;
  setCscKioskMode: (enabled: boolean) => void;
  updateActiveProfile: (patch: Partial<CitizenProfile>) => void;
  switchProfile: (id: string) => void;
  addProfile: (label: string, preset?: Partial<CitizenProfile>) => string;
  deleteProfile: (id: string) => void;
  toggleHeldDocument: (docKey: string) => void;
  setDocExpiry: (docKey: string, isoDate: string) => void;
  toggleBookmark: (schemeId: string) => void;
  toggleCompare: (schemeId: string) => void;
  clearCompare: () => void;
  setApplicationStatus: (
    schemeId: string,
    status: ApplicationStatus,
    remindOn?: string | null,
    notes?: string,
    referenceNo?: string
  ) => void;
  importFullWorkspace: (data: {
    profiles: CitizenProfile[];
    activeProfileId: string;
    bookmarksByProfile: Record<string, string[]>;
    applicationsByProfile: Record<string, ApplicationRecord[]>;
  }) => void;
  clearAllData: () => Promise<void>;
}

function persistState(state: SathiStoreState) {
  if (!localDexie) return;
  localDexie.workspace
    .put({
      key: 'singleton',
      locale: state.locale,
      activeProfileId: state.activeProfileId,
      profiles: state.profiles,
      bookmarksByProfile: state.bookmarksByProfile,
      applicationsByProfile: state.applicationsByProfile,
      cscKioskMode: state.cscKioskMode,
    })
    .catch(() => {});
}

export const useSathiStore = create<SathiStoreState>((set, get) => ({
  hydrated: false,
  locale: 'en',
  profiles: [DEFAULT_PROFILE],
  activeProfileId: DEFAULT_PROFILE.id,
  bookmarksByProfile: {},
  applicationsByProfile: {},
  compareIds: [],
  cscKioskMode: false,
  catalogue: { schemes: [], documents: [], loaded: false },

  hydrate: async () => {
    if (get().hydrated) return;
    if (localDexie) {
      try {
        const saved = await localDexie.workspace.get('singleton');
        if (saved && saved.profiles?.length) {
          set({
            hydrated: true,
            locale: saved.locale ?? 'en',
            profiles: saved.profiles,
            activeProfileId: saved.activeProfileId ?? saved.profiles[0].id,
            bookmarksByProfile: saved.bookmarksByProfile ?? {},
            applicationsByProfile: saved.applicationsByProfile ?? {},
            cscKioskMode: Boolean(saved.cscKioskMode),
          });
          return;
        }
      } catch {
        // fallback to defaults
      }
    }
    set({ hydrated: true });
  },

  loadCatalogue: async () => {
    if (get().catalogue.loaded) return;
    try {
      const res = await fetch('/api/schemes?limit=100');
      if (res.ok) {
        const data = await res.json();
        set({
          catalogue: {
            schemes: data.schemes ?? [],
            documents: data.documents ?? [],
            loaded: true,
          },
        });
      }
    } catch {
      // keep empty if offline before SW cached
    }
  },

  setLocale: (locale) => {
    set({ locale });
    persistState(get());
  },

  setCscKioskMode: (cscKioskMode) => {
    set({ cscKioskMode });
    persistState(get());
  },

  updateActiveProfile: (patch) => {
    set((state) => ({
      profiles: state.profiles.map((p) =>
        p.id === state.activeProfileId ? { ...p, ...patch } : p
      ),
    }));
    persistState(get());
  },

  switchProfile: (id) => {
    set({ activeProfileId: id });
    persistState(get());
  },

  addProfile: (label, preset = {}) => {
    const id = `prof-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const next: CitizenProfile = {
      id,
      label: label.trim() || 'Family Member',
      held_documents: ['aadhaar'],
      doc_expiries: {},
      ...preset,
    };
    set((state) => ({
      profiles: [...state.profiles, next],
      activeProfileId: id,
    }));
    persistState(get());
    return id;
  },

  deleteProfile: (id) => {
    set((state) => {
      const remaining = state.profiles.filter((p) => p.id !== id);
      const nextProfiles = remaining.length > 0 ? remaining : [DEFAULT_PROFILE];
      const nextActive =
        state.activeProfileId === id ? nextProfiles[0].id : state.activeProfileId;
      return {
        profiles: nextProfiles,
        activeProfileId: nextActive,
      };
    });
    persistState(get());
  },

  toggleHeldDocument: (docKey) => {
    const active = get().profiles.find((p) => p.id === get().activeProfileId);
    if (!active) return;
    const held = new Set(active.held_documents);
    if (held.has(docKey)) held.delete(docKey);
    else held.add(docKey);
    get().updateActiveProfile({ held_documents: [...held] });
  },

  setDocExpiry: (docKey, isoDate) => {
    const active = get().profiles.find((p) => p.id === get().activeProfileId);
    if (!active) return;
    get().updateActiveProfile({
      doc_expiries: { ...(active.doc_expiries ?? {}), [docKey]: isoDate },
    });
  },

  toggleBookmark: (schemeId) => {
    set((state) => {
      const pid = state.activeProfileId;
      const current = new Set(state.bookmarksByProfile[pid] ?? []);
      if (current.has(schemeId)) current.delete(schemeId);
      else current.add(schemeId);
      return {
        bookmarksByProfile: {
          ...state.bookmarksByProfile,
          [pid]: [...current],
        },
      };
    });
    persistState(get());
  },

  toggleCompare: (schemeId) => {
    set((state) => {
      const exists = state.compareIds.includes(schemeId);
      if (exists) {
        return { compareIds: state.compareIds.filter((id) => id !== schemeId) };
      }
      if (state.compareIds.length >= 3) {
        return { compareIds: [...state.compareIds.slice(1), schemeId] };
      }
      return { compareIds: [...state.compareIds, schemeId] };
    });
  },

  clearCompare: () => set({ compareIds: [] }),

  setApplicationStatus: (schemeId, status, remindOn, notes, referenceNo) => {
    const pid = get().activeProfileId;
    const list = get().applicationsByProfile[pid] ?? [];
    const existing = list.find((a) => a.schemeId === schemeId);
    const nowIso = new Date().toISOString();

    let nextRecord: ApplicationRecord;
    if (existing) {
      const res = existing.status === status ? { ok: true as const, record: existing } : transitionApplication(existing, status);
      if (!res.ok) return;
      nextRecord = {
        ...res.record,
        remindOn: remindOn !== undefined ? remindOn : existing.remindOn,
        notes: notes !== undefined ? notes : existing.notes,
        referenceNo: referenceNo !== undefined ? referenceNo : existing.referenceNo,
      };
    } else {
      nextRecord = {
        id: `${pid}::${schemeId}`,
        profileId: pid,
        schemeId,
        status,
        updatedAt: nowIso,
        remindOn: remindOn ?? null,
        notes: notes ?? '',
        referenceNo: referenceNo ?? '',
      };
    }

    set((state) => ({
      applicationsByProfile: {
        ...state.applicationsByProfile,
        [pid]: [
          ...list.filter((a) => a.schemeId !== schemeId),
          nextRecord,
        ],
      },
    }));
    persistState(get());

    // Best-effort local SQLite sync (ignore if offline)
    fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId: pid,
        schemeId,
        status: nextRecord.status,
        remindOn: nextRecord.remindOn,
        notes: nextRecord.notes,
      }),
    }).catch(() => {});
  },

  importFullWorkspace: (data) => {
    set({
      profiles: data.profiles.length ? data.profiles : [DEFAULT_PROFILE],
      activeProfileId: data.activeProfileId || DEFAULT_PROFILE.id,
      bookmarksByProfile: data.bookmarksByProfile ?? {},
      applicationsByProfile: data.applicationsByProfile ?? {},
    });
    persistState(get());
  },

  clearAllData: async () => {
    set({
      profiles: [{ ...DEFAULT_PROFILE, held_documents: [] }],
      activeProfileId: DEFAULT_PROFILE.id,
      bookmarksByProfile: {},
      applicationsByProfile: {},
      compareIds: [],
    });
    if (localDexie) {
      await localDexie.workspace.clear().catch(() => {});
    }
    await fetch('/api/account', { method: 'DELETE' }).catch(() => {});
  },
}));

