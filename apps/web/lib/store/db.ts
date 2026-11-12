import Dexie, { type Table } from 'dexie';
import type { ApplicationRecord, CitizenProfile, Locale } from '../types';

export interface StoredWorkspaceState {
  key: string;
  locale: Locale;
  activeProfileId: string;
  profiles: CitizenProfile[];
  bookmarksByProfile: Record<string, string[]>;
  applicationsByProfile: Record<string, ApplicationRecord[]>;
  cscKioskMode: boolean;
}

class SchemeSathiDexie extends Dexie {
  workspace!: Table<StoredWorkspaceState, string>;

  constructor() {
    super('scheme_sathi_local_v1');
    this.version(1).stores({
      workspace: 'key',
    });
  }
}

export const localDexie = typeof window !== 'undefined' ? new SchemeSathiDexie() : null;

