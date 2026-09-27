import { ScoreBreakdown } from '@/models/Opportunity';

interface BusinessLeadInput {
  budget?: number;
  deadline?: Date | string;
  probability?: number;
  createdAt?: Date;
  requirement?: string;
  company?: string;
}

interface CreatorInput {
  deadline?: Date | string;
  platform?: string;
  estimatedEffort?: string;
  createdAt?: Date;
  value?: number;
}

interface OpportunityInput {
  type: string;
  value?: number;
  deadline?: Date | string;
  probability?: number;
  createdAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface ScoreResult {
  score: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  breakdown: ScoreBreakdown[];
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function getDaysUntilDeadline(deadline?: Date | string): number | null {
  if (!deadline) return null;
  const d = typeof deadline === 'string' ? new Date(deadline) : deadline;
  if (isNaN(d.getTime())) return null;
  const diff = d.getTime() - Date.now();
  return diff / (1000 * 60 * 60 * 24);
}

function getRecencyScore(createdAt?: Date): number {
  if (!createdAt) return 50;
  const daysSince = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 1) return 100;
  if (daysSince <= 3) return 85;
  if (daysSince <= 7) return 70;
  if (daysSince <= 14) return 50;
  if (daysSince <= 30) return 30;
  return 10;
}

function getUrgencyScore(daysUntilDeadline: number | null): number {
  if (daysUntilDeadline === null) return 40;
  if (daysUntilDeadline < 0) return 100; // overdue!
  if (daysUntilDeadline <= 1) return 95;
  if (daysUntilDeadline <= 3) return 85;
  if (daysUntilDeadline <= 7) return 75;
  if (daysUntilDeadline <= 14) return 60;
  if (daysUntilDeadline <= 30) return 45;
  return 30;
}

export function scoreBusinessLead(input: BusinessLeadInput & { createdAt?: Date }): ScoreResult {
  const breakdown: ScoreBreakdown[] = [];

  // 30% Potential Value
  const budget = input.budget || 0;
  let valueScore = 0;
  if (budget >= 500000) valueScore = 100;
  else if (budget >= 200000) valueScore = 85;
  else if (budget >= 100000) valueScore = 70;
  else if (budget >= 50000) valueScore = 55;
  else if (budget >= 10000) valueScore = 40;
  else if (budget > 0) valueScore = 25;
  else valueScore = 20;

  const valuePoints = Math.round(valueScore * 0.30);
  breakdown.push({
    label: 'Potential Value',
    points: valuePoints,
    maxPoints: 30,
    reason: budget > 0 ? `Budget: ₹${budget.toLocaleString()}` : 'No budget specified',
  });

  // 25% Urgency (deadline)
  const days = getDaysUntilDeadline(input.deadline);
  const urgencyScore = getUrgencyScore(days);
  const urgencyPoints = Math.round(urgencyScore * 0.25);
  breakdown.push({
    label: 'Urgency',
    points: urgencyPoints,
    maxPoints: 25,
    reason: days !== null
      ? days < 0 ? 'Deadline passed'
      : days <= 7 ? `Urgent — ${Math.ceil(days)} days left`
      : `${Math.ceil(days)} days until deadline`
      : 'No deadline set',
  });

  // 20% Customer Fit
  const hasCompany = input.company ? 20 : 0;
  const hasRequirement = input.requirement ? 15 : 0;
  const fitScore = clamp(hasCompany + hasRequirement + 60, 0, 100);
  const fitPoints = Math.round(fitScore * 0.20);
  breakdown.push({
    label: 'Customer Fit',
    points: fitPoints,
    maxPoints: 20,
    reason: input.company ? `Company: ${input.company}` : 'Individual inquiry',
  });

  // 15% Recency
  const recencyScore = getRecencyScore(input.createdAt);
  const recencyPoints = Math.round(recencyScore * 0.15);
  breakdown.push({
    label: 'Recency',
    points: recencyPoints,
    maxPoints: 15,
    reason: input.createdAt ? 'Recent inquiry' : 'Unknown date',
  });

  // 10% Probability
  const prob = input.probability || 50;
  const probPoints = Math.round((prob / 100) * 10);
  breakdown.push({
    label: 'Win Probability',
    points: probPoints,
    maxPoints: 10,
    reason: `${prob}% probability`,
  });

  const score = clamp(
    valuePoints + urgencyPoints + fitPoints + recencyPoints + probPoints,
    0,
    100
  );

  return { score, priority: getPriority(score), breakdown };
}

export function scoreCreatorOpportunity(input: CreatorInput & { createdAt?: Date }): ScoreResult {
  const breakdown: ScoreBreakdown[] = [];

  // 25% Audience Relevance
  const platformScore = input.platform ? 80 : 50;
  const audiencePoints = Math.round(platformScore * 0.25);
  breakdown.push({
    label: 'Audience Relevance',
    points: audiencePoints,
    maxPoints: 25,
    reason: input.platform ? `Platform: ${input.platform}` : 'Platform not specified',
  });

  // 20% Freshness
  const recencyScore = getRecencyScore(input.createdAt);
  const freshnessPoints = Math.round(recencyScore * 0.20);
  breakdown.push({
    label: 'Freshness',
    points: freshnessPoints,
    maxPoints: 20,
    reason: 'Based on how recently this was added',
  });

  // 20% Topic Interest (proxy: value/payment for sponsorships)
  const topicScore = input.value && input.value > 0 ? Math.min(100, (input.value / 50000) * 100) : 65;
  const topicPoints = Math.round(topicScore * 0.20);
  breakdown.push({
    label: 'Topic Interest',
    points: topicPoints,
    maxPoints: 20,
    reason: input.value ? `Value: ₹${input.value.toLocaleString()}` : 'Standard topic interest',
  });

  // 15% Creator Expertise
  const expertisePoints = 10; // default
  breakdown.push({
    label: 'Creator Expertise',
    points: expertisePoints,
    maxPoints: 15,
    reason: 'Based on topic alignment',
  });

  // 10% Production Effort (lower effort = higher score)
  const effortScore = input.estimatedEffort === 'low' ? 90 : input.estimatedEffort === 'high' ? 40 : 65;
  const effortPoints = Math.round(effortScore * 0.10);
  breakdown.push({
    label: 'Production Effort',
    points: effortPoints,
    maxPoints: 10,
    reason: `Effort: ${input.estimatedEffort || 'medium'}`,
  });

  // 10% Timing
  const days = getDaysUntilDeadline(input.deadline);
  const timingScore = getUrgencyScore(days);
  const timingPoints = Math.round(timingScore * 0.10);
  breakdown.push({
    label: 'Timing',
    points: timingPoints,
    maxPoints: 10,
    reason: days !== null ? `${Math.max(0, Math.ceil(days))} days until deadline` : 'No deadline',
  });

  const score = clamp(
    audiencePoints + freshnessPoints + topicPoints + expertisePoints + effortPoints + timingPoints,
    0,
    100
  );

  return { score, priority: getPriority(score), breakdown };
}

export function scoreOpportunity(opportunity: OpportunityInput): ScoreResult {
  const meta = opportunity.metadata || {};
  const createdAt = opportunity.createdAt;

  if (opportunity.type === 'BUSINESS_LEAD' || opportunity.type === 'CUSTOMER_REQUEST') {
    return scoreBusinessLead({
      budget: (meta.budget as number) || opportunity.value,
      deadline: opportunity.deadline,
      probability: meta.probability as number,
      company: meta.company as string,
      requirement: meta.requirement as string,
      createdAt,
    });
  }

  // Creator types
  return scoreCreatorOpportunity({
    deadline: opportunity.deadline,
    platform: meta.platform as string,
    estimatedEffort: meta.estimatedEffort as string,
    value: opportunity.value,
    createdAt,
  });
}

export function getPriority(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score >= 85) return 'CRITICAL';
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}
