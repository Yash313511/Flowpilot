import mongoose, { Schema, Document, Model } from 'mongoose';

export type OpportunityType =
  | 'BUSINESS_LEAD'
  | 'CONTENT_TOPIC'
  | 'SPONSORSHIP'
  | 'COLLABORATION'
  | 'CUSTOMER_REQUEST'
  | 'AUDIENCE_REQUEST'
  | 'OTHER';

export type OpportunityStatus =
  | 'NEW'
  | 'ACTIVE'
  | 'IN_PROGRESS'
  | 'WON'
  | 'LOST'
  | 'ARCHIVED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ScoreBreakdown {
  label: string;
  points: number;
  maxPoints: number;
  reason: string;
}

export interface IOpportunity extends Document {
  organizationId: mongoose.Types.ObjectId;
  type: OpportunityType;
  title: string;
  description?: string;
  source?: string;
  score: number;
  scoreBreakdown: ScoreBreakdown[];
  priority: Priority;
  value?: number;
  currency?: string;
  deadline?: Date;
  status: OpportunityStatus;
  metadata: Record<string, unknown>;
  workflowId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ScoreBreakdownSchema = new Schema<ScoreBreakdown>({
  label: String,
  points: Number,
  maxPoints: Number,
  reason: String,
});

const OpportunitySchema = new Schema<IOpportunity>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    type: {
      type: String,
      enum: ['BUSINESS_LEAD', 'CONTENT_TOPIC', 'SPONSORSHIP', 'COLLABORATION', 'CUSTOMER_REQUEST', 'AUDIENCE_REQUEST', 'OTHER'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    source: { type: String },
    score: { type: Number, default: 0 },
    scoreBreakdown: [ScoreBreakdownSchema],
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    value: { type: Number },
    currency: { type: String, default: 'INR' },
    deadline: { type: Date },
    status: {
      type: String,
      enum: ['NEW', 'ACTIVE', 'IN_PROGRESS', 'WON', 'LOST', 'ARCHIVED'],
      default: 'NEW',
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

OpportunitySchema.index({ organizationId: 1, status: 1 });
OpportunitySchema.index({ organizationId: 1, score: -1 });

const Opportunity: Model<IOpportunity> =
  mongoose.models.Opportunity || mongoose.model<IOpportunity>('Opportunity', OpportunitySchema);
export default Opportunity;
