import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { citizenProfileSchema } from '@/lib/profile';
import { getCatalogueFromDb } from '@/lib/db/catalogue';
import { runCitizenOrchestrator } from '@/lib/orchestrator';
import { explainOverallEligibility } from '@/lib/explain';

const requestSchema = z.object({
  profile: citizenProfileSchema.partial(),
  locale: z.enum(['en', 'hi', 'gu']).default('en'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestSchema.parse(body);
    const { schemes, documents } = getCatalogueFromDb();
    const result = runCitizenOrchestrator(parsed.profile, schemes, documents, parsed.locale);

    const explanations = Object.fromEntries(
      result.ranked.map((r) => [
        r.scheme.id,
        explainOverallEligibility(r.scheme, r.eligibility, parsed.locale),
      ])
    );

    return NextResponse.json({
      ...result,
      explanations,
      notice: 'Sample rules — never guaranteed. Always verify on the official portal.',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid request payload' },
      { status: 400 }
    );
  }
}

