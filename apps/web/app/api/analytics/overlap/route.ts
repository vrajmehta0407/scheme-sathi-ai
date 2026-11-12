import { NextRequest, NextResponse } from 'next/server';
import { computeAnalyticsOverview } from '@/lib/analytics';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const overview = computeAnalyticsOverview({
    state: searchParams.get('state') ?? undefined,
    occupation: searchParams.get('occupation') ?? undefined,
  });
  return NextResponse.json({
    isSynthetic: true,
    sampleSize: overview.sampleSize,
    overlap: overview.overlapTop,
  });
}

