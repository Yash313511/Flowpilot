import mongoose, { Schema, Document, Model } from 'mongoose';

export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ITask extends Document {
  organizationId: mongoose.Types.ObjectId;
  workflowId?: mongoose.Types.ObjectId;
  opportunityId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: mongoose.Types.ObjectId;
  estimatedMinutes?: number;
  deadline?: Date;
  dependencies: mongoose.Types.ObjectId[];
  completedAt?: Date;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    workflowId: { type: Schema.Types.ObjectId, ref: 'Workflow' },
    opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity' },
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'],
      default: 'TODO',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'TeamMember' },
    estimatedMinutes: { type: Number },
    deadline: { type: Date },
    dependencies: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    completedAt: { type: Date },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

TaskSchema.index({ organizationId: 1, status: 1 });
TaskSchema.index({ organizationId: 1, deadline: 1 });
TaskSchema.index({ organizationId: 1, assigneeId: 1 });
TaskSchema.index({ workflowId: 1 });

const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
export default Task;
