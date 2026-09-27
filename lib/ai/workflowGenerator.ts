import { generateJSON } from './client';
import { z } from 'zod';

export interface WorkflowTask {
  title: string;
  description?: string;
  estimatedMinutes?: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  suggestedRole?: string;
  order: number;
}

export interface WorkflowSuggestion {
  workflowName: string;
  templateId: string;
  tasks: WorkflowTask[];
  estimatedTotalMinutes?: number;
}

const ValidPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

const WorkflowTaskSchema = z.object({
  title: z.string().default('Workflow Task'),
  description: z.string().optional().nullable().transform((v) => v || ''),
  estimatedMinutes: z.coerce.number().optional().nullable().transform((v) => (v != null && !isNaN(v) ? v : 30)),
  priority: z.string().optional().nullable().transform((v) => {
    const upper = (v || '').toUpperCase();
    return ValidPriorities.includes(upper as any) ? (upper as (typeof ValidPriorities)[number]) : 'MEDIUM';
  }),
  suggestedRole: z.string().optional().nullable().transform((v) => v || undefined),
  order: z.coerce.number().default(1),
});

const WorkflowSuggestionSchema = z.object({
  workflowName: z.string().default('Generated Workflow'),
  templateId: z.string().default('CUSTOM'),
  tasks: z.array(WorkflowTaskSchema).default([]),
  estimatedTotalMinutes: z.coerce.number().optional().nullable().transform((v) => (v != null && !isNaN(v) ? v : 120)),
});

// Predefined workflow templates as fallback
export const WORKFLOW_TEMPLATES: Record<string, Omit<WorkflowSuggestion, 'workflowName'>> = {
  LEAD_FOLLOW_UP: {
    templateId: 'LEAD_FOLLOW_UP',
    tasks: [
      { title: 'Initial contact', description: 'Reach out to the lead', estimatedMinutes: 30, priority: 'HIGH', order: 1 },
      { title: 'Requirements call', description: 'Understand their needs', estimatedMinutes: 60, priority: 'HIGH', order: 2 },
      { title: 'Prepare quotation', description: 'Create a detailed quote', estimatedMinutes: 90, priority: 'HIGH', order: 3 },
      { title: 'Send quotation', description: 'Email the proposal', estimatedMinutes: 15, priority: 'HIGH', order: 4 },
      { title: 'Follow-up call', description: 'Check if they received it', estimatedMinutes: 30, priority: 'MEDIUM', order: 5 },
      { title: 'Negotiate terms', description: 'Finalize deal terms', estimatedMinutes: 60, priority: 'HIGH', order: 6 },
      { title: 'Close deal', description: 'Get confirmation and sign-off', estimatedMinutes: 30, priority: 'CRITICAL', order: 7 },
    ],
    estimatedTotalMinutes: 315,
  },
  SALES_PROPOSAL: {
    templateId: 'SALES_PROPOSAL',
    tasks: [
      { title: 'Research client', description: 'Understand client business', estimatedMinutes: 45, priority: 'HIGH', order: 1 },
      { title: 'Prepare proposal', description: 'Create detailed proposal document', estimatedMinutes: 120, priority: 'HIGH', order: 2 },
      { title: 'Review proposal', description: 'Internal review', estimatedMinutes: 30, priority: 'MEDIUM', order: 3 },
      { title: 'Send proposal', description: 'Send to client', estimatedMinutes: 15, priority: 'HIGH', order: 4 },
      { title: 'Schedule presentation', description: 'Book meeting', estimatedMinutes: 15, priority: 'MEDIUM', order: 5 },
      { title: 'Present proposal', description: 'Walk through proposal', estimatedMinutes: 60, priority: 'CRITICAL', order: 6 },
      { title: 'Address feedback', description: 'Handle objections', estimatedMinutes: 45, priority: 'HIGH', order: 7 },
    ],
    estimatedTotalMinutes: 330,
  },
  YOUTUBE_VIDEO: {
    templateId: 'YOUTUBE_VIDEO',
    tasks: [
      { title: 'Research topic', description: 'Deep dive into the subject', estimatedMinutes: 90, priority: 'HIGH', order: 1 },
      { title: 'Collect references', description: 'Gather sources and examples', estimatedMinutes: 45, priority: 'MEDIUM', order: 2 },
      { title: 'Create outline', description: 'Structure the video', estimatedMinutes: 30, priority: 'HIGH', order: 3 },
      { title: 'Write script', description: 'Full video script', estimatedMinutes: 120, priority: 'HIGH', order: 4 },
      { title: 'Review script', description: 'Edit and polish', estimatedMinutes: 45, priority: 'MEDIUM', order: 5 },
      { title: 'Record video', description: 'Film the content', estimatedMinutes: 120, priority: 'CRITICAL', order: 6 },
      { title: 'Edit video', description: 'Post-production', estimatedMinutes: 180, priority: 'HIGH', order: 7 },
      { title: 'Create thumbnail', description: 'Design click-worthy thumbnail', estimatedMinutes: 45, priority: 'HIGH', order: 8 },
      { title: 'Write title & description', description: 'SEO-optimized metadata', estimatedMinutes: 30, priority: 'MEDIUM', order: 9 },
      { title: 'Publish video', description: 'Upload and schedule', estimatedMinutes: 20, priority: 'CRITICAL', order: 10 },
      { title: 'Analyze performance', description: 'Review metrics after 24h', estimatedMinutes: 30, priority: 'LOW', order: 11 },
    ],
    estimatedTotalMinutes: 755,
  },
  SPONSORED_VIDEO: {
    templateId: 'SPONSORED_VIDEO',
    tasks: [
      { title: 'Review requirements', description: 'Read sponsor brief', estimatedMinutes: 30, priority: 'HIGH', order: 1 },
      { title: 'Confirm campaign details', description: 'Align with sponsor', estimatedMinutes: 30, priority: 'HIGH', order: 2 },
      { title: 'Research topic', description: 'Research video content', estimatedMinutes: 90, priority: 'HIGH', order: 3 },
      { title: 'Write script', description: 'Include sponsor segment', estimatedMinutes: 120, priority: 'HIGH', order: 4 },
      { title: 'Record video', description: 'Film with sponsor segment', estimatedMinutes: 120, priority: 'CRITICAL', order: 5 },
      { title: 'Edit video', description: 'Include sponsor graphics', estimatedMinutes: 180, priority: 'HIGH', order: 6 },
      { title: 'Submit for review', description: 'Send to sponsor for approval', estimatedMinutes: 15, priority: 'HIGH', order: 7 },
      { title: 'Make revisions', description: 'Address sponsor feedback', estimatedMinutes: 60, priority: 'HIGH', order: 8 },
      { title: 'Publish', description: 'Upload and go live', estimatedMinutes: 20, priority: 'CRITICAL', order: 9 },
    ],
    estimatedTotalMinutes: 665,
  },
  SHORT_VIDEO: {
    templateId: 'SHORT_VIDEO',
    tasks: [
      { title: 'Concept hook', description: 'Create engaging hook', estimatedMinutes: 15, priority: 'HIGH', order: 1 },
      { title: 'Record short', description: 'Film 60-second content', estimatedMinutes: 30, priority: 'CRITICAL', order: 2 },
      { title: 'Quick edit', description: 'Fast-paced edit', estimatedMinutes: 45, priority: 'HIGH', order: 3 },
      { title: 'Add captions', description: 'Accessibility captions', estimatedMinutes: 20, priority: 'MEDIUM', order: 4 },
      { title: 'Post short', description: 'Publish to platform', estimatedMinutes: 10, priority: 'CRITICAL', order: 5 },
    ],
    estimatedTotalMinutes: 120,
  },
  CUSTOMER_ONBOARDING: {
    templateId: 'CUSTOMER_ONBOARDING',
    tasks: [
      { title: 'Welcome message', description: 'Send welcome email', estimatedMinutes: 15, priority: 'HIGH', order: 1 },
      { title: 'Setup call', description: 'Kickoff meeting', estimatedMinutes: 60, priority: 'HIGH', order: 2 },
      { title: 'Account setup', description: 'Configure their account', estimatedMinutes: 45, priority: 'HIGH', order: 3 },
      { title: 'Training session', description: 'Walkthrough of features', estimatedMinutes: 90, priority: 'MEDIUM', order: 4 },
      { title: 'Documentation', description: 'Share relevant docs', estimatedMinutes: 20, priority: 'LOW', order: 5 },
      { title: '7-day check-in', description: 'Follow up after first week', estimatedMinutes: 30, priority: 'MEDIUM', order: 6 },
    ],
    estimatedTotalMinutes: 260,
  },
};

export async function generateWorkflowFromAI(
  opportunityType: string,
  opportunityTitle: string,
  opportunityDescription: string,
  teamRoles: string[]
): Promise<WorkflowSuggestion> {
  const prompt = `
You are a workflow planning expert for FlowPilot.

Generate a detailed workflow for this opportunity:
Type: ${opportunityType}
Title: ${opportunityTitle}
Description: ${opportunityDescription}
Available team roles: ${teamRoles.join(', ') || 'General'}

Return JSON:
{
  "workflowName": "...",
  "templateId": "CUSTOM_${opportunityType}",
  "tasks": [
    {
      "title": "Task title",
      "description": "What to do",
      "estimatedMinutes": 30,
      "priority": "HIGH",
      "suggestedRole": "role from team",
      "order": 1
    }
  ],
  "estimatedTotalMinutes": 300
}

Rules:
- 5-12 tasks typically
- Order them logically
- Set realistic time estimates
- For creator content: include research, script, record, edit, publish
- For business leads: include contact, qualify, propose, follow up, close
`;

  const fallbackTemplate = getDefaultTemplate(opportunityType, opportunityTitle);
  const raw = await generateJSON(prompt, fallbackTemplate);

  try {
    return WorkflowSuggestionSchema.parse(raw);
  } catch {
    return fallbackTemplate;
  }
}

function getDefaultTemplate(type: string, title: string): WorkflowSuggestion {
  const templates: Record<string, string> = {
    BUSINESS_LEAD: 'LEAD_FOLLOW_UP',
    SPONSORSHIP: 'SPONSORED_VIDEO',
    CONTENT_TOPIC: 'YOUTUBE_VIDEO',
    COLLABORATION: 'YOUTUBE_VIDEO',
    CUSTOMER_REQUEST: 'CUSTOMER_ONBOARDING',
    AUDIENCE_REQUEST: 'SHORT_VIDEO',
    OTHER: 'LEAD_FOLLOW_UP',
  };

  const templateKey = templates[type] || 'LEAD_FOLLOW_UP';
  const template = WORKFLOW_TEMPLATES[templateKey];

  return {
    workflowName: `${title} Workflow`,
    ...template,
  };
}
