import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Workflow from '@/models/Workflow';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const workflows = await Workflow.find({ organizationId: session.user.organizationId })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ workflows });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}
