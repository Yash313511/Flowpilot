import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Task from '@/models/Task';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const now = new Date();

    const tasks = await Task.find({
      organizationId: session.user.organizationId,
      deadline: { $lt: now },
      status: { $nin: ['COMPLETED'] },
    })
      .populate('assigneeId', 'name avatar')
      .sort({ deadline: 1 })
      .lean();

    return NextResponse.json({ tasks, count: tasks.length });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch overdue tasks' }, { status: 500 });
  }
}
