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
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
      organizationId: session.user.organizationId,
      deadline: { $gte: now, $lte: endOfDay },
      status: { $ne: 'COMPLETED' },
    })
      .populate('assigneeId', 'name avatar')
      .sort({ priority: -1, deadline: 1 })
      .lean();

    return NextResponse.json({ tasks });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch today tasks' }, { status: 500 });
  }
}
