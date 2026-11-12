import { NextRequest, NextResponse } from 'next/server';
import { getCatalogueFromDb } from '@/lib/db/catalogue';
import { runAdminQualityCheck } from '@/lib/admin';
import type { SchemeRecord } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { schemes?: SchemeRecord[] };
    if (!Array.isArray(body.schemes) || body.schemes.length === 0) {
      return NextResponse.json(
        { error: 'Provide a non-empty `schemes` JSON array to validate/import.' },
        { status: 400 }
      );
    }

    const { schemes: current } = getCatalogueFromDb();
    const map = new Map(current.map((s) => [s.id, s]));
    for (const incoming of body.schemes) {
      map.set(incoming.id, incoming);
    }
    const merged = [...map.values()];
    const qualityReport = runAdminQualityCheck(merged);

    return NextResponse.json({
      validatedCount: body.schemes.length,
      totalCatalogue: merged.length,
      qualityReport,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to validate import' },
      { status: 400 }
    );
  }
}

