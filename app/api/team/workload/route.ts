import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import TeamMember from '@/models/TeamMember';
import Task from '@/models/Task';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const members = await TeamMember.find({ organizationId: session.user.organizationId }).lean();

    // Calculate workload from active tasks
    const workloadData = await Promise.all(
      members.map(async (member) => {
        const activeTasks = await Task.countDocuments({
          assigneeId: member._id,
          status: { $in: ['TODO', 'IN_PROGRESS', 'REVIEW'] },
        });
        const totalMinutes = await Task.aggregate([
          { $match: { assigneeId: member._id, status: { $in: ['TODO', 'IN_PROGRESS', 'REVIEW'] } } },
          { $group: { _id: null, total: { $sum: '$estimatedMinutes' } } },
        ]);

        const workloadMinutes = totalMinutes[0]?.total || 0;
        // Assume 8-hour work day = 480 minutes
        const workloadPct = Math.min(100, Math.round((workloadMinutes / 480) * 100));

        return {
          ...member,
          activeTasks,
          workloadMinutes,
          workloadPct,
        };
      })
    );

    return NextResponse.json({ workload: workloadData });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch workload' }, { status: 500 });
  }
}
