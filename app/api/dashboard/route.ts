import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Opportunity from '@/models/Opportunity';
import Task from '@/models/Task';
import Workflow from '@/models/Workflow';
import TeamMember from '@/models/TeamMember';
import { generateDailyBrief } from '@/lib/ai/dailyBrief';
import Organization from '@/models/Organization';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = session.user.organizationId;

  try {
    await connectDB();
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [
      org,
      activeTasks,
      todayTasks,
      overdueTasks,
      topOpportunities,
      workflows,
      teamMembers,
    ] = await Promise.all([
      Organization.findById(orgId).lean(),
      Task.countDocuments({ organizationId: orgId, status: { $nin: ['COMPLETED'] } }),
      Task.find({ organizationId: orgId, deadline: { $gte: now, $lte: endOfDay }, status: { $ne: 'COMPLETED' } })
        .populate('assigneeId', 'name')
        .sort({ priority: -1 })
        .limit(5)
        .lean(),
      Task.find({ organizationId: orgId, deadline: { $lt: now }, status: { $nin: ['COMPLETED'] } })
        .populate('assigneeId', 'name')
        .sort({ deadline: 1 })
        .limit(5)
        .lean(),
      Opportunity.find({ organizationId: orgId, status: { $nin: ['WON', 'LOST', 'ARCHIVED'] } })
        .sort({ score: -1 })
        .limit(5)
        .lean(),
      Workflow.find({ organizationId: orgId, status: 'ACTIVE' }).limit(5).lean(),
      TeamMember.find({ organizationId: orgId }).lean(),
    ]);

    const overdueCount = await Task.countDocuments({
      organizationId: orgId,
      deadline: { $lt: now },
      status: { $nin: ['COMPLETED'] },
    });

    // Upcoming deadlines (next 7 days)
    const weekAhead = new Date();
    weekAhead.setDate(weekAhead.getDate() + 7);
    const upcomingDeadlines = await Task.find({
      organizationId: orgId,
      deadline: { $gte: now, $lte: weekAhead },
      status: { $ne: 'COMPLETED' },
    })
      .sort({ deadline: 1 })
      .limit(5)
      .lean();

    // Generate AI daily brief
    let aiSummary = '';
    try {
      aiSummary = await generateDailyBrief({
        organizationName: org?.name || 'Your Organization',
        organizationType: org?.type || 'BUSINESS',
        activeTasksCount: activeTasks,
        todayTasksCount: todayTasks.length,
        overdueTasksCount: overdueCount,
        highPriorityOpportunities: topOpportunities.slice(0, 3).map((o) => ({
          title: o.title,
          type: o.type,
          score: o.score,
          value: o.value,
        })),
        upcomingDeadlines: upcomingDeadlines.map((t) => ({
          title: t.title,
          deadline: t.deadline?.toISOString() || '',
          type: 'task',
        })),
        teamWorkload: teamMembers.map((m) => ({
          name: m.name,
          workload: m.workload,
          role: m.role,
        })),
        recentActivities: [],
      });
    } catch (e) {
      console.warn('Daily brief generation failed:', e);
    }

    return NextResponse.json({
      summary: {
        activeTasks,
        todayTasks: todayTasks.length,
        overdueTasks: overdueCount,
        activeWorkflows: workflows.length,
        highPriorityOpportunities: topOpportunities.filter((o) => o.priority === 'HIGH' || o.priority === 'CRITICAL').length,
      },
      topOpportunities,
      todayTasks,
      overdueTasks,
      teamMembers,
      upcomingDeadlines,
      aiSummary,
      organizationType: org?.type || 'BUSINESS',
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
