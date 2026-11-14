import { NextRequest, NextResponse } from 'next/server';
import { getCatalogueFromDb } from '@/lib/db/catalogue';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const { schemes, documents } = getCatalogueFromDb();
  const scheme = schemes.find((s) => s.slug === slug || s.id === slug);

  if (!scheme) {
    return NextResponse.json({ error: 'Scheme not found' }, { status: 404 });
  }

  const docMap = new Map(documents.map((d) => [d.docKey, d]));
  const requiredDocuments = scheme.documents
    .map((key) => docMap.get(key))
    .filter(Boolean);

  return NextResponse.json({
    isSample: false,
    notice: 'Verified official welfare directory. Verify on the official portal before applying.',
    scheme,
    requiredDocuments,
  });
}

