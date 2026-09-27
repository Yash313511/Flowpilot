const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flowpilot';

async function seed() {
  console.log('Connecting to MongoDB:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const db = mongoose.connection.db;

  // Clear existing collections if desired
  await db.collection('users').deleteMany({ email: 'demo@flowpilot.com' });
  
  // Find or create Demo Organization
  let org = await db.collection('organizations').findOne({ slug: 'apex-digital' });
  if (!org) {
    const orgRes = await db.collection('organizations').insertOne({
      name: 'Apex Digital Solutions',
      slug: 'apex-digital',
      type: 'BUSINESS',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    org = { _id: orgRes.insertedId, name: 'Apex Digital Solutions' };
  }

  const orgId = org._id;

  // Create demo user
  const passwordHash = await bcrypt.hash('password123', 12);
  const userRes = await db.collection('users').insertOne({
    name: 'Alex Rivera',
    email: 'demo@flowpilot.com',
    passwordHash: passwordHash,
    role: 'OWNER',
    organizationId: orgId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const userId = userRes.insertedId;

  await db.collection('organizations').updateOne(
    { _id: orgId },
    { $set: { ownerId: userId } }
  );

  console.log('Created demo user: demo@flowpilot.com / password123');

  // Check if team members exist
  const existingTeam = await db.collection('teammembers').find({ organizationId: orgId }).toArray();
  let teamMembers = existingTeam;
  if (teamMembers.length === 0) {
    const teamRes = await db.collection('teammembers').insertMany([
      {
        organizationId: orgId,
        name: 'Aarav Patel',
        email: 'aarav@apexdigital.com',
        role: 'Content Lead',
        skills: ['Scripting', 'Video Production', 'Creative Direction'],
        availability: 85,
        workload: 65,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        organizationId: orgId,
        name: 'Priya Nair',
        email: 'priya@apexdigital.com',
        role: 'Growth & Partnerships',
        skills: ['Sponsorships', 'Client Relations', 'Sales Negotiation'],
        availability: 90,
        workload: 45,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        organizationId: orgId,
        name: 'Rohan Mehta',
        email: 'rohan@apexdigital.com',
        role: 'Technical Specialist',
        skills: ['Web Development', 'Automation', 'Analytics'],
        availability: 70,
        workload: 80,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    teamMembers = await db.collection('teammembers').find({ organizationId: orgId }).toArray();
    console.log(`Created ${teamMembers.length} team members`);
  }

  // Clear existing demo opportunities & tasks
  await db.collection('opportunities').deleteMany({ organizationId: orgId });
  await db.collection('workflows').deleteMany({ organizationId: orgId });
  await db.collection('tasks').deleteMany({ organizationId: orgId });

  const now = new Date();
  const todayDue = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now
  const tomorrowDue = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeekDue = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Opportunity 1: TechCorp Q3 Sponsorship
  const opp1 = await db.collection('opportunities').insertOne({
    organizationId: orgId,
    type: 'SPONSORSHIP',
    title: 'TechCorp Q3 Cloud Platform Campaign',
    description: 'TechCorp reached out for a 2-episode integrated sponsorship covering cloud DevOps workflows.',
    source: 'Inbound Email',
    score: 92,
    scoreBreakdown: [
      { label: 'Revenue Value', points: 30, maxPoints: 30, reason: 'High contract value ₹4,50,000' },
      { label: 'Audience Fit', points: 25, maxPoints: 25, reason: 'DevOps audience aligns with core niche' },
      { label: 'Execution Feasibility', points: 22, maxPoints: 25, reason: 'Standard integration format' },
      { label: 'Strategic Partnership', points: 15, maxPoints: 20, reason: 'Potential for recurring annual retainer' },
    ],
    priority: 'CRITICAL',
    value: 450000,
    currency: 'INR',
    deadline: nextWeekDue,
    status: 'IN_PROGRESS',
    metadata: { brand: 'TechCorp', payment: 450000, campaign: 'Cloud DevOps Q3' },
    createdBy: userId,
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  });

  // Workflow 1
  const wf1 = await db.collection('workflows').insertOne({
    organizationId: orgId,
    opportunityId: opp1.insertedId,
    templateId: 'SPONSORED_VIDEO',
    name: 'TechCorp Q3 Sponsorship Workflow',
    status: 'ACTIVE',
    progress: 40,
    deadline: nextWeekDue,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.collection('opportunities').updateOne(
    { _id: opp1.insertedId },
    { $set: { workflowId: wf1.insertedId } }
  );

  // Tasks for Workflow 1
  await db.collection('tasks').insertMany([
    {
      organizationId: orgId,
      opportunityId: opp1.insertedId,
      workflowId: wf1.insertedId,
      title: 'Review TechCorp Brand Guidelines & Talking Points',
      description: 'Go through mandatory talking points, DOs and DONTs sent by TechCorp marketing.',
      status: 'COMPLETED',
      priority: 'HIGH',
      assigneeId: teamMembers[1]._id,
      estimatedMinutes: 30,
      completedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      organizationId: orgId,
      opportunityId: opp1.insertedId,
      workflowId: wf1.insertedId,
      title: 'Draft Script with Integrated 60s Sponsor Segment',
      description: 'Write complete script weaving TechCorp Cloud seamlessly into the architectural design section.',
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      assigneeId: teamMembers[0]._id,
      estimatedMinutes: 120,
      deadline: todayDue,
      order: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      organizationId: orgId,
      opportunityId: opp1.insertedId,
      workflowId: wf1.insertedId,
      title: 'Submit Video Script to Sponsor for Approval',
      description: 'Send script draft via portal for compliance sign-off.',
      status: 'TODO',
      priority: 'HIGH',
      assigneeId: teamMembers[1]._id,
      estimatedMinutes: 20,
      deadline: tomorrowDue,
      order: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      organizationId: orgId,
      opportunityId: opp1.insertedId,
      workflowId: wf1.insertedId,
      title: 'Film & Edit Episode with B-roll Graphics',
      description: 'Record 4K studio footage and assemble graphics and sponsor title card.',
      status: 'TODO',
      priority: 'HIGH',
      assigneeId: teamMembers[0]._id,
      estimatedMinutes: 240,
      deadline: nextWeekDue,
      order: 4,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  // Opportunity 2: Business Lead
  const opp2 = await db.collection('opportunities').insertOne({
    organizationId: orgId,
    type: 'BUSINESS_LEAD',
    title: 'Nexus Fintech App Architecture Consultation',
    description: 'CTO of Nexus Fintech requested architecture audit and recommendation report.',
    source: 'Website Form',
    score: 84,
    scoreBreakdown: [
      { label: 'Budget Size', points: 28, maxPoints: 30, reason: 'Budget ₹2,20,000 confirmed' },
      { label: 'Timeline', points: 20, maxPoints: 25, reason: 'Needs completion within 2 weeks' },
      { label: 'Capability Match', points: 24, maxPoints: 25, reason: 'Matches Rohan and Alex core strengths' },
      { label: 'Referral Probability', points: 12, maxPoints: 20, reason: 'Strong industry network' },
    ],
    priority: 'HIGH',
    value: 220000,
    currency: 'INR',
    deadline: tomorrowDue,
    status: 'ACTIVE',
    metadata: { company: 'Nexus Fintech', budget: 220000, contact: 'Vikram Seth' },
    createdBy: userId,
    createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  });

  // Tasks for Opportunity 2
  await db.collection('tasks').insertMany([
    {
      organizationId: orgId,
      opportunityId: opp2.insertedId,
      title: 'Discovery Call with Vikram (CTO Nexus Fintech)',
      description: 'Discuss current infrastructure bottlenecks and security audit requirements.',
      status: 'TODO',
      priority: 'HIGH',
      assigneeId: teamMembers[2]._id,
      estimatedMinutes: 45,
      deadline: todayDue,
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      organizationId: orgId,
      opportunityId: opp2.insertedId,
      title: 'Prepare Scope of Work & Fixed-Bid Proposal',
      description: 'Outline deliverables: audit report, architecture diagram, and remediation roadmap.',
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeId: teamMembers[1]._id,
      estimatedMinutes: 90,
      deadline: tomorrowDue,
      order: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  // Opportunity 3: Content Topic
  await db.collection('opportunities').insertOne({
    organizationId: orgId,
    type: 'CONTENT_TOPIC',
    title: 'Building Production Autonomous AI Agents in 2026',
    description: 'In-depth tutorial explaining multi-agent architectures, tool calling, and memory systems.',
    source: 'Audience Poll',
    score: 88,
    scoreBreakdown: [
      { label: 'Trending Interest', points: 30, maxPoints: 30, reason: 'Top requested topic on community channel' },
      { label: 'Content Depth', points: 25, maxPoints: 25, reason: 'High engagement and retention potential' },
      { label: 'Sponsor Appeal', points: 20, maxPoints: 25, reason: 'Attracts AI tooling sponsors' },
      { label: 'Effort Ratio', points: 13, maxPoints: 20, reason: 'Requires coding a live prototype' },
    ],
    priority: 'HIGH',
    deadline: nextWeekDue,
    status: 'NEW',
    metadata: { platform: 'YouTube', category: 'AI & Engineering', audience: 'Developers' },
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('Database seeded successfully!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
