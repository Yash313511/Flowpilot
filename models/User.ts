import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  avatar?: string;
  organizationId?: mongoose.Types.ObjectId;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  emailVerified?: Date;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    avatar: { type: String },
    image: { type: String },
    emailVerified: { type: Date },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    role: { type: String, enum: ['OWNER', 'ADMIN', 'MEMBER'], default: 'OWNER' },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
