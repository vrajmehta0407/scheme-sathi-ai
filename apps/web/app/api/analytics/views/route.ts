import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSqliteDb } from '@/lib/db/sqlite';

const viewSchema = z.object({
  name: z.string().min(1).max(80),
  filters: z.record(z.string(), z.string()),
});

export async function GET() {
  const db = getSqliteDb();
  const rows = db
    .prepare('SELECT id, name, filters_json, created_at FROM saved_views ORDER BY created_at DESC')
    .all() as Array<{ id: string; name: string; filters_json: string; created_at: string }>;

  return NextResponse.json({
    views: rows.map((r) => ({
      id: r.id,
      name: r.name,
      filters: JSON.parse(r.filters_json),
      createdAt: r.created_at,
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = viewSchema.parse(body);
    const db = getSqliteDb();
    const id = `view-${Date.now()}`;
    const createdAt = new Date().toISOString();
    db.prepare(
      'INSERT INTO saved_views(id, name, filters_json, created_at) VALUES (?, ?, ?, ?)'
    ).run(id, parsed.name, JSON.stringify(parsed.filters), createdAt);

    return NextResponse.json({
      view: { id, name: parsed.name, filters: parsed.filters, createdAt },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid view payload' },
      { status: 400 }
    );
  }
}

