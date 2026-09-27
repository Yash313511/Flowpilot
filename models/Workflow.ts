import mongoose, { Schema, Document, Model } from 'mongoose';

export type WorkflowStatus = 'PENDING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface IWorkflow extends Document {
  organizationId: mongoose.Types.ObjectId;
  opportunityId: mongoose.Types.ObjectId;
  templateId?: string;
  name: string;
  status: WorkflowStatus;
  progress: number;
  startDate?: Date;
  deadline?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowSchema = new Schema<IWorkflow>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity', required: true },
    templateId: { type: String },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'],
      default: 'ACTIVE',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    startDate: { type: Date },
    deadline: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

WorkflowSchema.index({ organizationId: 1, status: 1 });

const Workflow: Model<IWorkflow> =
  mongoose.models.Workflow || mongoose.model<IWorkflow>('Workflow', WorkflowSchema);
export default Workflow;
