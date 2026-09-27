import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Organization from '@/models/Organization';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  orgName: z.string().min(2).max(100),
  orgType: z.enum(['BUSINESS', 'CREATOR']),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, orgName, orgType } = RegisterSchema.parse(body);

    await connectDB();

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'OWNER',
    });

    // Create organization
    const slug = `org-${user._id.toString().slice(-8)}-${Date.now().toString(36)}`;
    const org = await Organization.create({
      name: orgName,
      type: orgType,
      ownerId: user._id,
      slug,
    });

    // Link org to user
    await User.findByIdAndUpdate(user._id, { organizationId: org._id });

    return NextResponse.json({ success: true, userId: user._id.toString() }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
