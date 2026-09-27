import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  type: 'BUSINESS' | 'CREATOR';
  ownerId: mongoose.Types.ObjectId;
  slug: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['BUSINESS', 'CREATOR'], required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    slug: { type: String, unique: true },
    description: { type: String },
  },
  { timestamps: true }
);

const Organization: Model<IOrganization> =
  mongoose.models.Organization || mongoose.model<IOrganization>('Organization', OrganizationSchema);
export default Organization;
