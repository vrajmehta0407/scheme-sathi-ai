import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { compareCohorts } from '@/lib/analytics';

const filterSchema = z.object({
  label: z.string().optional(),
  state: z.string().optional(),
  category: z.string().optional(),
  occupation: z.string().optional(),
  incomeBand: z.string().optional(),
  districtType: z.string().optional(),
});

const cohortReqSchema = z.object({
  cohortA: filterSchema,
  cohortB: filterSchema,
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const res = compareCohorts(
    {
      label: searchParams.get('labelA') ?? 'SC/ST Rural Farmers',
      category: searchParams.get('catA') ?? 'SC',
      occupation: searchParams.get('occA') ?? 'farmer',
    },
    {
      label: searchParams.get('labelB') ?? 'All Farmers',
      occupation: searchParams.get('occB') ?? 'farmer',
    }
  );
  return NextResponse.json(res);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cohortA, cohortB } = cohortReqSchema.parse(body);
    return NextResponse.json(compareCohorts(cohortA, cohortB));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid cohort query' },
      { status: 400 }
    );
  }
}

