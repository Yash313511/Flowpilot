import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeamMember extends Document {
  organizationId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  role: string;
  skills: string[];
  availability: number; // 0-100 percentage
  workload: number; // 0-100 percentage
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
    skills: [{ type: String }],
    availability: { type: Number, default: 100, min: 0, max: 100 },
    workload: { type: Number, default: 0, min: 0, max: 100 },
    avatar: { type: String },
  },
  { timestamps: true }
);

TeamMemberSchema.index({ organizationId: 1 });

const TeamMember: Model<ITeamMember> =
  mongoose.models.TeamMember || mongoose.model<ITeamMember>('TeamMember', TeamMemberSchema);
export default TeamMember;
