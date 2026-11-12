import { NextRequest, NextResponse } from 'next/server';
import { computeAnalyticsOverview } from '@/lib/analytics';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const overview = computeAnalyticsOverview({
    category: searchParams.get('category') ?? undefined,
    occupation: searchParams.get('occupation') ?? undefined,
    incomeBand: searchParams.get('incomeBand') ?? undefined,
  });

  return NextResponse.json({
    isSynthetic: true,
    sampleSize: overview.sampleSize,
    states: overview.byState,
  });
}

