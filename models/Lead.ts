import mongoose, { Schema, Document, Model } from 'mongoose';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';

export interface ILead extends Document {
  organizationId: mongoose.Types.ObjectId;
  opportunityId: mongoose.Types.ObjectId;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  requirement?: string;
  budget?: number;
  currency: string;
  source?: string;
  status: LeadStatus;
  probability: number;
  deadline?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity', required: true },
    name: { type: String, required: true },
    company: { type: String },
    email: { type: String },
    phone: { type: String },
    requirement: { type: String },
    budget: { type: Number },
    currency: { type: String, default: 'INR' },
    source: { type: String },
    status: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'],
      default: 'NEW',
    },
    probability: { type: Number, default: 50, min: 0, max: 100 },
    deadline: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

LeadSchema.index({ organizationId: 1, status: 1 });

const Lead: Model<ILead> = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
export default Lead;
