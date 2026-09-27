import mongoose, { Schema, Document, Model } from 'mongoose';

export type ActivityType =
  | 'LEAD_CREATED'
  | 'OPPORTUNITY_CREATED'
  | 'TASK_CREATED'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'WORKFLOW_GENERATED'
  | 'STATUS_CHANGED'
  | 'COMMENT_ADDED'
  | 'MEMBER_ADDED';

export interface IActivity extends Document {
  organizationId: mongoose.Types.ObjectId;
  type: ActivityType;
  userId: mongoose.Types.ObjectId;
  targetId?: mongoose.Types.ObjectId;
  targetType?: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    type: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetId: { type: Schema.Types.ObjectId },
    targetType: { type: String },
    message: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ActivitySchema.index({ organizationId: 1, createdAt: -1 });

const Activity: Model<IActivity> =
  mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);
export default Activity;
