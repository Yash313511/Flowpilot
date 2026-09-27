import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Task from '@/models/Task';
import Opportunity from '@/models/Opportunity';
import TeamMember from '@/models/TeamMember';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgId = session.user.organizationId;

  try {
    await connectDB();

    const [tasks, opportunities, teamMembers] = await Promise.all([
      Task.find({ organizationId: orgId }).lean(),
      Opportunity.find({ organizationId: orgId }).sort({ score: -1 }).limit(8).lean(),
      TeamMember.find({ organizationId: orgId }).lean(),
    ]);

    // Tasks by status
    const statusCounts = { BACKLOG: 0, TODO: 0, IN_PROGRESS: 0, REVIEW: 0, COMPLETED: 0 };
    tasks.forEach((t) => { if (statusCounts[t.status as keyof typeof statusCounts] !== undefined) statusCounts[t.status as keyof typeof statusCounts]++; });
    const tasksByStatus = Object.entries(statusCounts).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

    // Tasks by priority
    const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    tasks.forEach((t) => { if (priorityCounts[t.priority as keyof typeof priorityCounts] !== undefined) priorityCounts[t.priority as keyof typeof priorityCounts]++; });
    const tasksByPriority = Object.entries(priorityCounts).map(([name, value]) => ({ name, value }));

    // Opportunity types
    const typeCounts: Record<string, number> = {};
    opportunities.forEach((o) => { typeCounts[o.type] = (typeCounts[o.type] || 0) + 1; });
    const opportunityTypes = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

    // Team workload
    const teamWorkload = teamMembers.map((m) => ({ name: m.name.split(' ')[0], workload: m.workload || 0 }));

    // Top opportunity scores
    const topOpportunityScores = opportunities.slice(0, 6).map((o) => ({
      name: o.title.length > 12 ? o.title.slice(0, 12) + '…' : o.title,
      score: o.score,
    }));

    return NextResponse.json({
      tasksByStatus,
      tasksByPriority,
      opportunityTypes,
      teamWorkload,
      topOpportunityScores,
      weeklyTaskCompletion: [], // placeholder
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
