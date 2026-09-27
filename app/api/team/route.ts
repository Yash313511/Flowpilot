import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import TeamMember from '@/models/TeamMember';
import { z } from 'zod';

const CreateMemberSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.string().min(1),
  skills: z.array(z.string()).optional(),
  availability: z.number().min(0).max(100).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const members = await TeamMember.find({ organizationId: session.user.organizationId })
      .sort({ name: 1 })
      .lean();
    return NextResponse.json({ members });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const validated = CreateMemberSchema.parse(body);

    await connectDB();

    const member = await TeamMember.create({
      organizationId: session.user.organizationId,
      ...validated,
      skills: validated.skills || [],
      availability: validated.availability ?? 100,
      workload: 0,
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
  }
}
