import type { ApplicationRecord, ApplicationStatus, SchemeRecord } from '../types';

const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  not_started: ['documents_ready', 'applied'],
  documents_ready: ['not_started', 'applied'],
  applied: ['approved', 'rejected', 'documents_ready'],
  approved: [],
  rejected: ['not_started', 'documents_ready'],
};

export function getAllowedTransitions(status: ApplicationStatus): ApplicationStatus[] {
  return ALLOWED_TRANSITIONS[status] ?? [];
}

export function transitionApplication(
  app: ApplicationRecord,
  nextStatus: ApplicationStatus,
  now = new Date()
): { ok: true; record: ApplicationRecord } | { ok: false; error: string } {
  if (app.status === nextStatus) {
    return { ok: true, record: app };
  }
  const allowed = getAllowedTransitions(app.status);
  if (!allowed.includes(nextStatus)) {
    return {
      ok: false,
      error: `Cannot transition from "${app.status}" to "${nextStatus}".`,
    };
  }
  return {
    ok: true,
    record: {
      ...app,
      status: nextStatus,
      updatedAt: now.toISOString(),
    },
  };
}

export interface TrackerInsight {
  type: 'stuck_over_30_days' | 'deadline_within_14_days';
  schemeId: string;
  schemeName: string;
  daysValue: number;
  message: string;
}

export function computeTrackerInsights(
  applications: ApplicationRecord[],
  schemes: SchemeRecord[],
  now = new Date()
): TrackerInsight[] {
  const schemeMap = new Map(schemes.map((s) => [s.id, s]));
  const insights: TrackerInsight[] = [];

  for (const app of applications) {
    const scheme = schemeMap.get(app.schemeId);
    if (!scheme) continue;

    if (app.status === 'applied') {
      const daysSince = Math.floor(
        (now.getTime() - new Date(app.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince > 30) {
        insights.push({
          type: 'stuck_over_30_days',
          schemeId: scheme.id,
          schemeName: scheme.nameEn,
          daysValue: daysSince,
          message: `${scheme.nameEn} has been in "Applied" status for ${daysSince} days — follow up on the portal.`,
        });
      }
    }
  }

  for (const s of schemes) {
    if (!s.deadline) continue;
    const daysLeft = Math.ceil(
      (new Date(s.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft >= 0 && daysLeft <= 14) {
      insights.push({
        type: 'deadline_within_14_days',
        schemeId: s.id,
        schemeName: s.nameEn,
        daysValue: daysLeft,
        message: `${s.nameEn} closes in ${daysLeft} day(s) (${s.deadline}).`,
      });
    }
  }

  return insights;
}

/**
 * Extra Feature #12: AES-GCM Local Encrypted Snapshot Backup & Restore (100% browser Web Crypto)
 */
async function deriveAesKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 100000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptLocalBackup(
  payload: unknown,
  passphrase: string
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(passphrase, salt);
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  const combined = new Uint8Array(salt.length + iv.length + cipher.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(cipher), salt.length + iv.length);

  let binary = '';
  combined.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return JSON.stringify({
    format: 'scheme-sathi-encrypted-v1',
    data: btoa(binary),
  });
}

export async function decryptLocalBackup<T = unknown>(
  envelopeJson: string,
  passphrase: string
): Promise<T> {
  const parsed = JSON.parse(envelopeJson) as { format?: string; data: string };
  if (parsed.format !== 'scheme-sathi-encrypted-v1' || !parsed.data) {
    throw new Error('Invalid backup file format.');
  }
  const binary = atob(parsed.data);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  const salt = bytes.slice(0, 16);
  const iv = bytes.slice(16, 28);
  const cipher = bytes.slice(28);
  const key = await deriveAesKey(passphrase, salt);
  const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
  return JSON.parse(new TextDecoder().decode(plainBuffer)) as T;
}

