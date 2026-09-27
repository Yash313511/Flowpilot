import { generateJSON } from './client';

interface DashboardData {
  organizationName: string;
  organizationType: string;
  activeTasksCount: number;
  todayTasksCount: number;
  overdueTasksCount: number;
  highPriorityOpportunities: Array<{ title: string; type: string; score: number; value?: number }>;
  upcomingDeadlines: Array<{ title: string; deadline: string; type: string }>;
  teamWorkload: Array<{ name: string; workload: number; role: string }>;
  recentActivities: Array<{ message: string }>;
}

export async function generateDailyBrief(data: DashboardData): Promise<string> {
  const prompt = `
You are the AI assistant for FlowPilot. Generate a concise, professional daily brief.

DATA:
- Organization: ${data.organizationName} (${data.organizationType})
- Active tasks: ${data.activeTasksCount}
- Tasks due today: ${data.todayTasksCount}
- Overdue tasks: ${data.overdueTasksCount}
- High priority opportunities: ${JSON.stringify(data.highPriorityOpportunities.slice(0, 5))}
- Upcoming deadlines: ${JSON.stringify(data.upcomingDeadlines.slice(0, 5))}
- Team workload: ${JSON.stringify(data.teamWorkload)}

Generate a brief response (150-200 words max) that:
1. Greets briefly (Good morning/afternoon based on context)
2. States 2-3 most important action items
3. Highlights any critical attention items (overdue, high workload)
4. One suggested focus for the day

Be direct, professional, and actionable. No fluff.

Return JSON: { "brief": "Your text here" }
`;

  const result = await generateJSON<{ brief: string }>(prompt, {
    brief: generateFallbackBrief(data),
  });

  return result.brief || generateFallbackBrief(data);
}

function generateFallbackBrief(data: DashboardData): string {
  const lines: string[] = [];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  lines.push(`${greeting}. Here's your FlowPilot summary.`);
  lines.push('');

  if (data.overdueTasksCount > 0) {
    lines.push(`⚠️ ${data.overdueTasksCount} overdue task${data.overdueTasksCount > 1 ? 's' : ''} need attention.`);
  }

  if (data.todayTasksCount > 0) {
    lines.push(`📋 ${data.todayTasksCount} task${data.todayTasksCount > 1 ? 's' : ''} due today.`);
  }

  if (data.highPriorityOpportunities.length > 0) {
    lines.push(`🎯 Top opportunity: ${data.highPriorityOpportunities[0].title}`);
  }

  const overloaded = data.teamWorkload.filter((m) => m.workload > 80);
  if (overloaded.length > 0) {
    lines.push(`👥 ${overloaded[0].name} has high workload (${overloaded[0].workload}%). Consider redistributing tasks.`);
  }

  return lines.join('\n');
}

export async function generateAssignmentRecommendation(
  taskTitle: string,
  taskDescription: string,
  teamMembers: Array<{ name: string; role: string; skills: string[]; workload: number; availability: number }>
): Promise<{
  recommendedMemberId?: string;
  recommendedMemberName?: string;
  confidence: number;
  reasons: string[];
}> {
  if (teamMembers.length === 0) {
    return { confidence: 0, reasons: ['No team members available'] };
  }

  const prompt = `
Match this task to the best team member:

Task: "${taskTitle}"
Description: "${taskDescription}"

Team members:
${teamMembers.map((m, i) => `${i}. ${m.name} - Role: ${m.role}, Skills: ${m.skills.join(', ')}, Workload: ${m.workload}%, Availability: ${m.availability}%`).join('\n')}

Return JSON:
{
  "recommendedIndex": number (index in the team array),
  "confidence": 0.0-1.0,
  "reasons": ["reason 1", "reason 2"]
}
`;

  const result = await generateJSON(prompt, { recommendedIndex: 0, confidence: 0.5, reasons: ['Default assignment'] });

  const member = teamMembers[result.recommendedIndex as number] || teamMembers[0];
  return {
    recommendedMemberName: member?.name,
    confidence: result.confidence as number,
    reasons: result.reasons as string[],
  };
}
