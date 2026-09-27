import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Opportunity from '@/models/Opportunity';
import { scoreOpportunity } from '@/lib/scoring/opportunityScoring';
import { z } from 'zod';

const CreateOpportunitySchema = z.object({
  type: z.enum(['BUSINESS_LEAD', 'CONTENT_TOPIC', 'SPONSORSHIP', 'COLLABORATION', 'CUSTOMER_REQUEST', 'AUDIENCE_REQUEST', 'OTHER']),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  source: z.string().optional(),
  value: z.number().optional(),
  currency: z.string().optional(),
  deadline: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const query: Record<string, unknown> = { organizationId: session.user.organizationId };
    if (type) query.type = type;
    if (status) query.status = status;

    const opportunities = await Opportunity.find(query)
      .sort({ score: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ opportunities });
  } catch (error) {
    console.error('GET /api/opportunities error:', error);
    return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = CreateOpportunitySchema.parse(body);

    await connectDB();

    // Calculate score deterministically
    const scoreResult = scoreOpportunity({
      type: validated.type,
      value: validated.value,
      deadline: validated.deadline ? new Date(validated.deadline) : undefined,
      metadata: validated.metadata || {},
      createdAt: new Date(),
    });

    const opportunity = await Opportunity.create({
      organizationId: session.user.organizationId,
      type: validated.type,
      title: validated.title,
      description: validated.description,
      source: validated.source,
      value: validated.value,
      currency: validated.currency || 'INR',
      deadline: validated.deadline ? new Date(validated.deadline) : undefined,
      metadata: validated.metadata || {},
      score: scoreResult.score,
      scoreBreakdown: scoreResult.breakdown,
      priority: scoreResult.priority,
      status: 'NEW',
      createdBy: session.user.id,
    });

    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    console.error('POST /api/opportunities error:', error);
    return NextResponse.json({ error: 'Failed to create opportunity' }, { status: 500 });
  }
}
