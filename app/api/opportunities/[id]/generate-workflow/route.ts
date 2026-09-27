import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db';
import Opportunity from '@/models/Opportunity';
import Workflow from '@/models/Workflow';
import Task from '@/models/Task';
import { generateWorkflowFromAI } from '@/lib/ai/workflowGenerator';
import TeamMember from '@/models/TeamMember';
import mongoose from 'mongoose';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const orgId = session.user.organizationId;
  const userId = session.user.id;

  try {
    await connectDB();

    const opportunity = await Opportunity.findOne({ _id: id, organizationId: orgId });
    if (!opportunity) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Check if workflow already exists
    if (opportunity.workflowId) {
      const existing = await Workflow.findById(opportunity.workflowId);
      if (existing) {
        const tasks = await Task.find({ workflowId: existing._id }).sort({ order: 1 });
        return NextResponse.json({ workflow: existing, tasks, alreadyExists: true });
      }
    }

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
      description: t.description || '',
      status: 'TODO' as const,
      priority: (t.priority || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      estimatedMinutes: t.estimatedMinutes || 30,
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
  } catch (error) {
    console.error('Generate workflow error:', error);
    return NextResponse.json({ error: 'Failed to generate workflow' }, { status: 500 });
  }
}
