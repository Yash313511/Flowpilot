import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import { extractOpportunity } from '@/lib/ai/extraction';
import { z } from 'zod';

const ExtractSchema = z.object({
  input: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { input } = ExtractSchema.parse(body);

    await connectDB();
    const result = await extractOpportunity(input);

    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    return NextResponse.json({ error: 'AI extraction failed', fallback: true }, { status: 200 });
  }
}
