import { generateJSON } from './client';
import { z } from 'zod';

const ValidTypes = [
  'BUSINESS_LEAD',
  'CONTENT_TOPIC',
  'SPONSORSHIP',
  'COLLABORATION',
  'CUSTOMER_REQUEST',
  'AUDIENCE_REQUEST',
  'OTHER',
] as const;

const ExtractionSchema = z.object({
  type: z.string().transform((v) => {
    const upper = (v || '').toUpperCase();
    return ValidTypes.includes(upper as (typeof ValidTypes)[number])
      ? (upper as (typeof ValidTypes)[number])
      : 'OTHER';
  }),
  confidence: z.coerce.number().min(0).max(1).default(0.85),
  title: z.string().default('New Opportunity'),
  description: z.string().optional().nullable().transform((v) => v || ''),
  metadata: z.record(z.string(), z.any()).optional().nullable().transform((v) => v || {}),
  deadline: z.string().optional().nullable().transform((v) => v || undefined),
  value: z.coerce.number().optional().nullable().transform((v) => (v != null && !isNaN(v) ? v : undefined)),
  currency: z.string().optional().nullable().transform((v) => v || undefined),
});

export type ExtractionResult = z.infer<typeof ExtractionSchema>;

const FALLBACK: ExtractionResult = {
  type: 'OTHER',
  confidence: 0,
  title: 'New Opportunity',
  description: '',
  metadata: {},
  deadline: undefined,
  value: undefined,
  currency: undefined,
};

export async function extractOpportunity(input: string): Promise<ExtractionResult> {
  const prompt = `
You are an AI assistant for FlowPilot, a business and creator workflow platform.

Analyze this input and extract structured opportunity information:

INPUT: "${input}"

Extract the following and return as JSON:
{
  "type": one of ["BUSINESS_LEAD", "CONTENT_TOPIC", "SPONSORSHIP", "COLLABORATION", "CUSTOMER_REQUEST", "AUDIENCE_REQUEST", "OTHER"],
  "confidence": number 0-1 (e.g. 0.9),
  "title": "Short descriptive title",
  "description": "Brief description",
  "metadata": {
    // For BUSINESS_LEAD: name, company, email, phone, requirement, budget (number), currency (e.g., INR, USD), probability (0-100)
    // For CONTENT_TOPIC: platform, category, audience, estimatedEffort
    // For SPONSORSHIP: brand, contact, campaign, payment (number), currency, requirements
    // For COLLABORATION: person, topic, proposedActivity, contact
  },
  "deadline": "ISO date string or null if not mentioned",
  "value": number or null (monetary value if mentioned),
  "currency": "INR" or "USD" etc
}

Rules:
- Extract monetary amounts as pure numbers only (no symbols)
- For INR: recognize ₹, Rs, INR, lakhs (1 lakh = 100000), etc.
- Deadline: if "20 days", calculate from today (${new Date().toISOString()})
- Be precise with company/person names
`;

  const raw = await generateJSON<Record<string, unknown>>(prompt, FALLBACK);

  try {
    return ExtractionSchema.parse(raw);
  } catch (err) {
    console.warn('Extraction schema parsing warning:', err, raw);
    if (raw && typeof raw === 'object') {
      return {
        type: typeof raw.type === 'string' && ValidTypes.includes(raw.type.toUpperCase() as any)
          ? (raw.type.toUpperCase() as any)
          : 'OTHER',
        confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.8,
        title: typeof raw.title === 'string' ? raw.title : 'New Opportunity',
        description: typeof raw.description === 'string' ? raw.description : '',
        metadata: (raw.metadata as Record<string, any>) || {},
        deadline: typeof raw.deadline === 'string' ? raw.deadline : undefined,
        value: typeof raw.value === 'number' ? raw.value : undefined,
        currency: typeof raw.currency === 'string' ? raw.currency : undefined,
      };
    }
    return FALLBACK;
  }
}

export async function classifyOpportunity(input: string): Promise<{
  type: ExtractionResult['type'];
  confidence: number;
  reasoning: string;
}> {
  const prompt = `
Classify this input into one of these opportunity types:
BUSINESS_LEAD, CONTENT_TOPIC, SPONSORSHIP, COLLABORATION, CUSTOMER_REQUEST, AUDIENCE_REQUEST, OTHER

INPUT: "${input}"

Return JSON:
{
  "type": "...",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation"
}
`;

  const fallback = { type: 'OTHER' as const, confidence: 0.5, reasoning: 'Could not classify' };
  const raw = await generateJSON(prompt, fallback);
  return raw;
}
