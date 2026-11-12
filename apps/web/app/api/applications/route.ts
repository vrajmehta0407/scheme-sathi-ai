import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSqliteDb } from '@/lib/db/sqlite';
import { transitionApplication } from '@/lib/tracker';
import type { ApplicationRecord, ApplicationStatus } from '@/lib/types';

const upsertSchema = z.object({
  profileId: z.string().min(1),
  schemeId: z.string().min(1),
  status: z.enum(['not_started', 'documents_ready', 'applied', 'approved', 'rejected']),
  remindOn: z.string().nullable().optional(),
  notes: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId') ?? 'guest-primary';
  const db = getSqliteDb();
  const rows = db
    .prepare('SELECT * FROM applications WHERE profile_id = ? ORDER BY updated_at DESC')
    .all(profileId) as Array<Record<string, unknown>>;

  const applications: ApplicationRecord[] = rows.map((r) => ({
    id: String(r.id),
    profileId: String(r.profile_id),
    schemeId: String(r.scheme_id),
    status: r.status as ApplicationStatus,
    updatedAt: String(r.updated_at),
    remindOn: r.remind_on ? String(r.remind_on) : null,
    notes: String(r.notes ?? ''),
  }));

  return NextResponse.json({ applications });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = upsertSchema.parse(body);
    const db = getSqliteDb();
    const id = `${parsed.profileId}::${parsed.schemeId}`;

    const existing = db
      .prepare('SELECT * FROM applications WHERE id = ?')
      .get(id) as Record<string, unknown> | undefined;

    const nowIso = new Date().toISOString();
    let finalStatus = parsed.status;

    if (existing) {
      const currentRecord: ApplicationRecord = {
        id,
        profileId: parsed.profileId,
        schemeId: parsed.schemeId,
        status: existing.status as ApplicationStatus,
        updatedAt: String(existing.updated_at),
        remindOn: existing.remind_on ? String(existing.remind_on) : null,
        notes: String(existing.notes ?? ''),
      };
      const check = transitionApplication(currentRecord, parsed.status);
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }
      finalStatus = check.record.status;
    }

    db.prepare(
      `INSERT OR REPLACE INTO applications(id, profile_id, scheme_id, status, updated_at, remind_on, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      parsed.profileId,
      parsed.schemeId,
      finalStatus,
      nowIso,
      parsed.remindOn ?? null,
      parsed.notes ?? ''
    );

    return NextResponse.json({
      application: {
        id,
        profileId: parsed.profileId,
        schemeId: parsed.schemeId,
        status: finalStatus,
        updatedAt: nowIso,
        remindOn: parsed.remindOn ?? null,
        notes: parsed.notes ?? '',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid application payload' },
      { status: 400 }
    );
  }
}

