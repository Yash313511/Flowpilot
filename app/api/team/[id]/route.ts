import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import TeamMember from '@/models/TeamMember';
import { z } from 'zod';

const UpdateSchema = z.object({
  name: z.string().optional(),
  role: z.string().optional(),
  skills: z.array(z.string()).optional(),
  availability: z.number().min(0).max(100).optional(),
  workload: z.number().min(0).max(100).optional(),
}).partial();

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const validated = UpdateSchema.parse(body);
    await connectDB();
    const member = await TeamMember.findOneAndUpdate(
      { _id: id, organizationId: session.user.organizationId },
      { $set: validated },
      { new: true }
    );
    if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ member });
  } catch {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    await connectDB();
    const deleted = await TeamMember.findOneAndDelete({ _id: id, organizationId: session.user.organizationId });
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
