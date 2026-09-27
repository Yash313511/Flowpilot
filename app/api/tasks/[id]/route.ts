import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Task from '@/models/Task';
import Workflow from '@/models/Workflow';
import { z } from 'zod';

const UpdateTaskSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  deadline: z.string().nullable().optional(),
  estimatedMinutes: z.number().optional(),
  assigneeId: z.string().nullable().optional(),
}).partial();

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const validated = UpdateTaskSchema.parse(body);

    await connectDB();

    const updateData: Record<string, unknown> = { ...validated };
    if (validated.deadline) updateData.deadline = new Date(validated.deadline);
    if (validated.status === 'COMPLETED') updateData.completedAt = new Date();
    if (validated.status && validated.status !== 'COMPLETED') updateData.completedAt = null;

    const task = await Task.findOneAndUpdate(
      { _id: id, organizationId: session.user.organizationId },
      { $set: updateData },
      { new: true }
    ).populate('assigneeId', 'name avatar role');

    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Update workflow progress
    if (task.workflowId) {
      const tasks = await Task.find({ workflowId: task.workflowId });
      const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
      const progress = Math.round((completed / tasks.length) * 100);
      await Workflow.findByIdAndUpdate(task.workflowId, {
        progress,
        status: progress === 100 ? 'COMPLETED' : 'ACTIVE',
      });
    }

    return NextResponse.json({ task });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    await connectDB();
    const deleted = await Task.findOneAndDelete({ _id: id, organizationId: session.user.organizationId });
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
