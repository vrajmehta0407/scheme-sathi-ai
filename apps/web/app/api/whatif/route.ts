import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { citizenProfileSchema } from '@/lib/profile';
import { getCatalogueFromDb } from '@/lib/db/catalogue';
import { computeSensitivityCurve, simulateWhatIf } from '@/lib/rules';

const whatIfSchema = z.object({
  profile: citizenProfileSchema.partial(),
  deltas: citizenProfileSchema.partial(),
  axis: z.enum(['income', 'age', 'land_hectares']).default('income'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile, deltas, axis } = whatIfSchema.parse(body);
    const { schemes } = getCatalogueFromDb();
    const diff = simulateWhatIf(schemes, profile, deltas);
    const curve = computeSensitivityCurve(schemes, profile, axis);

    return NextResponse.json({
      ...diff,
      sensitivityCurve: curve,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid what-if payload' },
      { status: 400 }
    );
  }
}

