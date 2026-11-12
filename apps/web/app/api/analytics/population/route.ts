import { NextRequest, NextResponse } from 'next/server';
import { getPopulationPage } from '@/lib/analytics';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const offset = Math.max(0, Number(searchParams.get('offset') ?? 0));
  const limit = Math.min(500, Math.max(10, Number(searchParams.get('limit') ?? 100)));

  const page = getPopulationPage(
    {
      state: searchParams.get('state') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      occupation: searchParams.get('occupation') ?? undefined,
      incomeBand: searchParams.get('incomeBand') ?? undefined,
      districtType: searchParams.get('districtType') ?? undefined,
    },
    offset,
    limit
  );

  return NextResponse.json({
    isSynthetic: true,
    ...page,
  });
}

