import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getSqliteDb } from '@/lib/db/sqlite';

const authSchema = z.object({
  mode: z.enum(['register', 'login']),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = authSchema.parse(body);
    const db = getSqliteDb();

    if (parsed.mode === 'register') {
      const existing = db
        .prepare('SELECT id FROM users WHERE email = ?')
        .get(parsed.email.toLowerCase());
      if (existing) {
        return NextResponse.json({ error: 'Account already exists locally.' }, { status: 409 });
      }
      const id = `usr-${Date.now()}`;
      const hash = await bcrypt.hash(parsed.password, 10);
      db.prepare(
        'INSERT INTO users(id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run(id, parsed.email.toLowerCase(), hash, 'citizen', new Date().toISOString());

      const res = NextResponse.json({ user: { id, email: parsed.email.toLowerCase() } });
      res.cookies.set('ss_local_user', id, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      });
      return res;
    }

    const row = db
      .prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
      .get(parsed.email.toLowerCase()) as
      | { id: string; email: string; password_hash: string }
      | undefined;

    if (!row || !(await bcrypt.compare(parsed.password, row.password_hash))) {
      return NextResponse.json({ error: 'Invalid local credentials.' }, { status: 401 });
    }

    const res = NextResponse.json({ user: { id: row.id, email: row.email } });
    res.cookies.set('ss_local_user', row.id, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid request' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get('profileId');
  const db = getSqliteDb();

  if (profileId) {
    db.prepare('DELETE FROM applications WHERE profile_id = ?').run(profileId);
    db.prepare('DELETE FROM bookmarks WHERE profile_id = ?').run(profileId);
    db.prepare('DELETE FROM profiles WHERE id = ?').run(profileId);
  } else {
    db.exec('DELETE FROM applications; DELETE FROM bookmarks; DELETE FROM profiles; DELETE FROM users;');
  }

  const res = NextResponse.json({ deleted: true });
  res.cookies.delete('ss_local_user');
  return res;
}

