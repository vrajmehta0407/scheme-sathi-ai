import { NextRequest, NextResponse } from 'next/server';
import { getCatalogueFromDb } from '@/lib/db/catalogue';

export async function GET(req: NextRequest) {
  const { schemes, documents } = getCatalogueFromDb();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const state = searchParams.get('state');
  const level = searchParams.get('level');
  const q = searchParams.get('q')?.toLowerCase().trim();
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 60)));

  let filtered = schemes;
  if (category && category !== 'all') {
    filtered = filtered.filter((s) => s.category === category);
  }
  if (state && state !== 'all') {
    filtered = filtered.filter((s) => s.state === 'All' || s.state === state);
  }
  if (level && level !== 'all') {
    filtered = filtered.filter((s) => s.level === level);
  }
  if (q) {
    filtered = filtered.filter(
      (s) =>
        s.nameEn.toLowerCase().includes(q) ||
        s.nameHi.toLowerCase().includes(q) ||
        s.nameGu.toLowerCase().includes(q) ||
        s.summaryEn.toLowerCase().includes(q)
    );
  }

  const start = (page - 1) * limit;
  return NextResponse.json({
    isSample: true,
    notice: 'SAMPLE data — verify eligibility and details on the official portal.',
    total: filtered.length,
    page,
    limit,
    schemes: filtered.slice(start, start + limit),
    documents,
  });
}

