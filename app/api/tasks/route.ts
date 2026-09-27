import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Task from '@/models/Task';
import Workflow from '@/models/Workflow';
import { z } from 'zod';

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  workflowId: z.string().optional(),
  opportunityId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  deadline: z.string().optional(),
  estimatedMinutes: z.number().optional(),
  assigneeId: z.string().optional(),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const workflowId = searchParams.get('workflowId');
    const status = searchParams.get('status');
    const assigneeId = searchParams.get('assigneeId');

    const query: Record<string, unknown> = { organizationId: session.user.organizationId };
    if (workflowId) query.workflowId = workflowId;
    if (status) query.status = status;
    if (assigneeId) query.assigneeId = assigneeId;

    const tasks = await Task.find(query)
      .populate('assigneeId', 'name avatar role')
      .sort({ priority: -1, deadline: 1, order: 1 })
      .lean();

    return NextResponse.json({ tasks });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const validated = CreateTaskSchema.parse(body);

    await connectDB();

    const task = await Task.create({
      organizationId: session.user.organizationId,
      ...validated,
      deadline: validated.deadline ? new Date(validated.deadline) : undefined,
      status: validated.status || 'TODO',
    });

    // Update workflow progress if task belongs to one
    if (task.workflowId) {
      await updateWorkflowProgress(task.workflowId.toString());
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

async function updateWorkflowProgress(workflowId: string) {
  const tasks = await Task.find({ workflowId });
  if (tasks.length === 0) return;
  const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
  const progress = Math.round((completed / tasks.length) * 100);
  await Workflow.findByIdAndUpdate(workflowId, {
    progress,
    status: progress === 100 ? 'COMPLETED' : 'ACTIVE',
  });
}
