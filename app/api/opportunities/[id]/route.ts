import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Opportunity from '@/models/Opportunity';
import Workflow from '@/models/Workflow';
import Task from '@/models/Task';
import { generateWorkflowFromAI } from '@/lib/ai/workflowGenerator';
import TeamMember from '@/models/TeamMember';
import { z } from 'zod';
import mongoose from 'mongoose';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    await connectDB();
    const opportunity = await Opportunity.findOne({
      _id: id,
      organizationId: session.user.organizationId,
    }).lean();

    if (!opportunity) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Fetch linked workflow and tasks
    const workflow = opportunity.workflowId
      ? await Workflow.findById(opportunity.workflowId).lean()
      : null;

    const tasks = workflow
      ? await Task.find({ workflowId: workflow._id }).sort({ order: 1 }).lean()
      : [];

    return NextResponse.json({ opportunity, workflow, tasks });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch opportunity' }, { status: 500 });
  }
}

const UpdateSchema = z.object({
  status: z.enum(['NEW', 'ACTIVE', 'IN_PROGRESS', 'WON', 'LOST', 'ARCHIVED']).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  value: z.number().optional(),
  deadline: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
}).partial();

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const validated = UpdateSchema.parse(body);

    await connectDB();
    const updated = await Opportunity.findOneAndUpdate(
      { _id: id, organizationId: session.user.organizationId },
      { $set: validated },
      { new: true }
    );

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ opportunity: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.organizationId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    await connectDB();
    const deleted = await Opportunity.findOneAndDelete({
      _id: id,
      organizationId: session.user.organizationId,
    });
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

// POST /api/opportunities/[id]/generate-workflow
export { generateWorkflowHandler as POST_generate };

async function generateWorkflowHandler(req: NextRequest, id: string, orgId: string, userId: string) {
  await connectDB();

  const opportunity = await Opportunity.findOne({ _id: id, organizationId: orgId });
  if (!opportunity) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Get team roles for context
  const teamMembers = await TeamMember.find({ organizationId: orgId }).lean();
  const roles = teamMembers.map((m) => m.role);

  // Generate workflow via AI (with fallback)
  const workflowSuggestion = await generateWorkflowFromAI(
    opportunity.type,
    opportunity.title,
    opportunity.description || '',
    roles
  );

  // Create workflow in DB
  const workflow = await Workflow.create({
    organizationId: orgId,
    opportunityId: opportunity._id,
    templateId: workflowSuggestion.templateId,
    name: workflowSuggestion.workflowName,
    status: 'ACTIVE',
    progress: 0,
    startDate: new Date(),
    deadline: opportunity.deadline,
    createdBy: userId,
  });

  // Create tasks
  const taskDocs = workflowSuggestion.tasks.map((t) => ({
    organizationId: new mongoose.Types.ObjectId(orgId),
    workflowId: workflow._id,
    opportunityId: opportunity._id,
    title: t.title,
    description: t.description,
    status: 'TODO' as const,
    priority: t.priority || 'MEDIUM',
    estimatedMinutes: t.estimatedMinutes,
    order: t.order,
    deadline: opportunity.deadline,
  }));

  const tasks = await Task.insertMany(taskDocs);

  // Link workflow to opportunity
  await Opportunity.findByIdAndUpdate(opportunity._id, {
    workflowId: workflow._id,
    status: 'ACTIVE',
  });

  return NextResponse.json({ workflow, tasks }, { status: 201 });
}

export { generateWorkflowHandler };
