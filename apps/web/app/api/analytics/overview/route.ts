import { NextRequest, NextResponse } from 'next/server';
import { computeAnalyticsOverview, type AnalyticsFilter } from '@/lib/analytics';

function parseFilter(req: NextRequest): AnalyticsFilter {
  const { searchParams } = new URL(req.url);
  return {
    state: searchParams.get('state') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    occupation: searchParams.get('occupation') ?? undefined,
    incomeBand: searchParams.get('incomeBand') ?? undefined,
    districtType: searchParams.get('districtType') ?? undefined,
    schemeId: searchParams.get('schemeId') ?? undefined,
  };
}

export async function GET(req: NextRequest) {
  const overview = computeAnalyticsOverview(parseFilter(req));
  return NextResponse.json(overview);
}

