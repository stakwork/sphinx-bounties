/* eslint-disable no-console */
import {
  PrismaClient,
  type BountyStatus,
  type ProgrammingLanguage,
  type ProofStatus,
  type NotificationType,
  type WorkspaceActivityAction,
} from "@prisma/client";

const db = new PrismaClient();

const TEST_USERS = [
  {
    pubkey: "02a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    username: "alice",
    alias: "Alice the Builder",
    description: "Full-stack developer with 5 years of experience. Love building Lightning apps!",
    githubUsername: "alice-dev",
    twitterUsername: "alice_builds",
  },
  {
    pubkey: "03b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2",
    username: "bob",
    alias: "Bob the Contributor",
    description: "React specialist and UI/UX enthusiast. Always ready for a new challenge.",
    githubUsername: "bob-codes",
    twitterUsername: "bob_ux",
  },
  {
    pubkey: "04c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
    username: "charlie",
    alias: "Charlie the Designer",
    description: "Product designer focused on clean, intuitive interfaces.",
    githubUsername: "charlie-design",
  },
  {
    pubkey: "05d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2",
    username: "diana",
    alias: "Diana the Reviewer",
    description: "Senior developer and code reviewer. Passionate about quality and best practices.",
  },
  {
    pubkey: "06e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2",
    username: "eve",
    alias: "Eve the Viewer",
    description: "Community member interested in bounty hunting and learning.",
  },
];

async function main() {
  console.log("🌱 Starting database seed...");

  console.log("🧹 Cleaning existing data...");
  await db.notification.deleteMany();
  await db.workspaceActivity.deleteMany();
  await db.bountyActivity.deleteMany();
  await db.bountyComment.deleteMany();
  await db.bountyProof.deleteMany();
  await db.transaction.deleteMany();
  await db.invoice.deleteMany();
  await db.connectionCode.deleteMany();
  await db.workspaceInvite.deleteMany();
  await db.bounty.deleteMany();
  await db.workspaceBudget.deleteMany();
  await db.workspaceMember.deleteMany();
  await db.workspace.deleteMany();
  await db.authChallenge.deleteMany();
  await db.user.deleteMany();

  console.log("👥 Creating test users...");
  for (const userData of TEST_USERS) {
    await db.user.create({
      data: {
        ...userData,
        lastLogin: new Date(),
      },
    });
    console.log(`  ✓ Created user: ${userData.username} (${userData.alias})`);
  }

  console.log("\n🏢 Creating workspaces...");

  const workspace1 = await db.workspace.create({
    data: {
      name: "Lightning Labs",
      ownerPubkey: TEST_USERS[0].pubkey,
      description: "Building the future of Bitcoin payments",
      mission:
        "We're creating Lightning Network tools and infrastructure to make Bitcoin payments fast, cheap, and accessible to everyone.",
      websiteUrl: "https://lightning-labs.example.com",
      githubUrl: "https://github.com/lightning-labs",
    },
  });
  console.log(`  ✓ Created workspace: ${workspace1.name}`);

  await db.workspaceMember.createMany({
    data: [
      { workspaceId: workspace1.id, userPubkey: TEST_USERS[0].pubkey, role: "OWNER" },
      { workspaceId: workspace1.id, userPubkey: TEST_USERS[1].pubkey, role: "CONTRIBUTOR" },
      { workspaceId: workspace1.id, userPubkey: TEST_USERS[2].pubkey, role: "CONTRIBUTOR" },
      { workspaceId: workspace1.id, userPubkey: TEST_USERS[3].pubkey, role: "ADMIN" },
    ],
  });

  await db.workspaceBudget.create({
    data: {
      workspaceId: workspace1.id,
      totalBudget: 5000000,
      availableBudget: 5000000,
      reservedBudget: 0,
      paidBudget: 0,
    },
  });

  const workspace2 = await db.workspace.create({
    data: {
      name: "Nostr Devs",
      ownerPubkey: TEST_USERS[1].pubkey,
      description: "Decentralized social protocol development",
      mission:
        "Building clients and tools for the Nostr protocol to enable censorship-resistant social media.",
      websiteUrl: "https://nostr-devs.example.com",
    },
  });
  console.log(`  ✓ Created workspace: ${workspace2.name}`);

  await db.workspaceMember.createMany({
    data: [
      { workspaceId: workspace2.id, userPubkey: TEST_USERS[1].pubkey, role: "OWNER" },
      { workspaceId: workspace2.id, userPubkey: TEST_USERS[0].pubkey, role: "CONTRIBUTOR" },
      { workspaceId: workspace2.id, userPubkey: TEST_USERS[4].pubkey, role: "VIEWER" },
    ],
  });

  await db.workspaceBudget.create({
    data: {
      workspaceId: workspace2.id,
      totalBudget: 2000000,
      availableBudget: 2000000,
      reservedBudget: 0,
      paidBudget: 0,
    },
  });

  const workspace3 = await db.workspace.create({
    data: {
      name: "Bitcoin Design",
      ownerPubkey: TEST_USERS[2].pubkey,
      description: "Making Bitcoin beautiful and accessible",
      mission: "We're dedicated to improving Bitcoin UX/UI through open design collaboration.",
    },
  });
  console.log(`  ✓ Created workspace: ${workspace3.name}`);

  await db.workspaceMember.createMany({
    data: [
      { workspaceId: workspace3.id, userPubkey: TEST_USERS[2].pubkey, role: "OWNER" },
      { workspaceId: workspace3.id, userPubkey: TEST_USERS[3].pubkey, role: "CONTRIBUTOR" },
    ],
  });

  await db.workspaceBudget.create({
    data: {
      workspaceId: workspace3.id,
      totalBudget: 1000000,
      availableBudget: 1000000,
      reservedBudget: 0,
      paidBudget: 0,
    },
  });

  console.log("\n💰 Creating bounties...");

  const bounties = [
    {
      workspaceId: workspace1.id,
      creatorPubkey: TEST_USERS[0].pubkey,
      title: "Build Lightning Invoice QR Code Component",
      description:
        "Create a React component that displays Lightning invoices as scannable QR codes with copy functionality.",
      deliverables:
        "- React component with TypeScript\n- QR code generation\n- Copy to clipboard button\n- Mobile responsive\n- Unit tests",
      amount: 25000,
      status: "OPEN" as BountyStatus,
      codingLanguages: ["TYPESCRIPT" as ProgrammingLanguage, "REACT" as ProgrammingLanguage],
      tags: ["frontend", "react", "lightning"],
      estimatedHours: 8,
    },
    {
      workspaceId: workspace1.id,
      creatorPubkey: TEST_USERS[3].pubkey,
      assigneePubkey: TEST_USERS[1].pubkey,
      title: "Implement Payment Verification Service",
      description:
        "Backend service to verify Lightning Network payment confirmations and update payment status.",
      deliverables:
        "- Node.js service\n- LND integration\n- Payment webhook handling\n- Error handling & retry logic\n- Integration tests",
      amount: 50000,
      status: "ASSIGNED" as BountyStatus,
      codingLanguages: ["TYPESCRIPT" as ProgrammingLanguage, "NODEJS" as ProgrammingLanguage],
      tags: ["backend", "lightning", "payments"],
      estimatedHours: 16,
      assignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      workspaceId: workspace1.id,
      creatorPubkey: TEST_USERS[0].pubkey,
      assigneePubkey: TEST_USERS[1].pubkey,
      title: "Create User Dashboard with Balance Widget",
      description:
        "Design and implement a user dashboard showing Lightning balance, recent transactions, and quick actions.",
      deliverables:
        "- Next.js page component\n- Balance display widget\n- Transaction history list\n- Quick send/receive buttons\n- Responsive design",
      amount: 35000,
      status: "IN_REVIEW" as BountyStatus,
      codingLanguages: [
        "TYPESCRIPT" as ProgrammingLanguage,
        "REACT" as ProgrammingLanguage,
        "NEXTJS" as ProgrammingLanguage,
      ],
      tags: ["frontend", "dashboard", "ui"],
      estimatedHours: 12,
      assignedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      workStartedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      workspaceId: workspace1.id,
      creatorPubkey: TEST_USERS[3].pubkey,
      assigneePubkey: TEST_USERS[2].pubkey,
      title: "Design Lightning Wallet Onboarding Flow",
      description: "Create an intuitive onboarding experience for new Lightning wallet users.",
      deliverables:
        "- Figma designs\n- User flow diagrams\n- Mobile & desktop mockups\n- Micro-interactions\n- Design system integration",
      amount: 30000,
      status: "COMPLETED" as BountyStatus,
      codingLanguages: [],
      tags: ["design", "ux", "onboarding"],
      estimatedHours: 10,
      assignedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      workStartedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      workspaceId: workspace2.id,
      creatorPubkey: TEST_USERS[1].pubkey,
      title: "Nostr Relay Implementation in Rust",
      description: "Build a high-performance Nostr relay server in Rust with WebSocket support.",
      deliverables:
        "- Rust relay server\n- WebSocket connections\n- Event filtering\n- Database persistence\n- Docker deployment",
      amount: 45000,
      status: "OPEN" as BountyStatus,
      codingLanguages: ["RUST" as ProgrammingLanguage],
      tags: ["nostr", "backend", "websockets"],
      estimatedHours: 20,
    },
    {
      workspaceId: workspace2.id,
      creatorPubkey: TEST_USERS[1].pubkey,
      assigneePubkey: TEST_USERS[0].pubkey,
      title: "Build Nostr Client UI Components",
      description:
        "Create reusable React components for Nostr client applications (feed, profiles, messages).",
      deliverables:
        "- React component library\n- TypeScript definitions\n- Storybook documentation\n- Unit tests\n- NPM package",
      amount: 40000,
      status: "ASSIGNED" as BountyStatus,
      codingLanguages: ["TYPESCRIPT" as ProgrammingLanguage, "REACT" as ProgrammingLanguage],
      tags: ["frontend", "nostr", "components"],
      estimatedHours: 18,
      assignedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      workspaceId: workspace2.id,
      creatorPubkey: TEST_USERS[1].pubkey,
      title: "Nostr Event Validation Library",
      description: "TypeScript library for validating Nostr events and signatures.",
      deliverables:
        "- TypeScript library\n- Event schema validation\n- Signature verification\n- Comprehensive tests\n- Documentation",
      amount: 20000,
      status: "OPEN" as BountyStatus,
      codingLanguages: ["TYPESCRIPT" as ProgrammingLanguage],
      tags: ["library", "nostr", "validation"],
      estimatedHours: 8,
    },
    {
      workspaceId: workspace2.id,
      creatorPubkey: TEST_USERS[1].pubkey,
      title: "Mobile-First Nostr Client Design",
      description:
        "Design a beautiful mobile-first Nostr client with focus on simplicity and speed.",
      deliverables:
        "- Mobile UI designs\n- Component specifications\n- Color system\n- Typography guidelines\n- Icon set",
      amount: 28000,
      status: "OPEN" as BountyStatus,
      codingLanguages: [],
      tags: ["design", "mobile", "nostr"],
      estimatedHours: 12,
    },
    {
      workspaceId: workspace3.id,
      creatorPubkey: TEST_USERS[2].pubkey,
      title: "Bitcoin Wallet Icon Set",
      description: "Create a comprehensive icon set for Bitcoin wallet applications.",
      deliverables:
        "- 50+ icons in SVG format\n- Multiple sizes\n- Light & dark variants\n- Figma source files\n- Usage guidelines",
      amount: 15000,
      status: "OPEN" as BountyStatus,
      codingLanguages: [],
      tags: ["design", "icons", "bitcoin"],
      estimatedHours: 6,
    },
    {
      workspaceId: workspace3.id,
      creatorPubkey: TEST_USERS[2].pubkey,
      assigneePubkey: TEST_USERS[3].pubkey,
      title: "Lightning Network Explainer Animations",
      description: "Create animated explainer videos showing how Lightning Network works.",
      deliverables:
        "- 3 short animations (30-60s each)\n- Source files\n- Multiple export formats\n- Narration scripts",
      amount: 35000,
      status: "IN_REVIEW" as BountyStatus,
      codingLanguages: [],
      tags: ["design", "animation", "education"],
      estimatedHours: 14,
      assignedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      workStartedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      workspaceId: workspace3.id,
      creatorPubkey: TEST_USERS[2].pubkey,
      title: "Redesign Bitcoin Payment Flow UX",
      description:
        "Research and redesign the user experience for making Bitcoin payments in mobile wallets.",
      deliverables:
        "- User research findings\n- Journey maps\n- Wireframes\n- High-fidelity mockups\n- Prototype",
      amount: 42000,
      status: "OPEN" as BountyStatus,
      codingLanguages: [],
      tags: ["design", "ux-research", "payments"],
      estimatedHours: 16,
    },
    {
      workspaceId: workspace1.id,
      creatorPubkey: TEST_USERS[0].pubkey,
      title: "Lightning Channel Management API",
      description:
        "Build REST API for managing Lightning Network channels (open, close, rebalance).",
      deliverables:
        "- REST API endpoints\n- OpenAPI documentation\n- Channel management logic\n- Error handling\n- Integration tests",
      amount: 48000,
      status: "OPEN" as BountyStatus,
      codingLanguages: ["TYPESCRIPT" as ProgrammingLanguage, "NODEJS" as ProgrammingLanguage],
      tags: ["backend", "api", "lightning"],
      estimatedHours: 20,
    },
    {
      workspaceId: workspace1.id,
      creatorPubkey: TEST_USERS[3].pubkey,
      assigneePubkey: TEST_USERS[1].pubkey,
      title: "Build Webhook System for Payment Events",
      description:
        "Implement a reliable webhook system to notify external services of payment events.",
      deliverables:
        "- Webhook delivery system\n- Retry mechanism\n- Signature verification\n- Admin dashboard\n- Documentation",
      amount: 38000,
      status: "COMPLETED" as BountyStatus,
      codingLanguages: ["TYPESCRIPT" as ProgrammingLanguage, "NODEJS" as ProgrammingLanguage],
      tags: ["backend", "webhooks", "events"],
      estimatedHours: 15,
      assignedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      workStartedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      workspaceId: workspace2.id,
      creatorPubkey: TEST_USERS[1].pubkey,
      title: "Nostr DM Encryption Implementation",
      description: "Implement secure direct messaging with NIP-04 encryption in TypeScript.",
      deliverables:
        "- Encryption/decryption functions\n- Key management\n- Message padding\n- Security audit report\n- Example usage",
      amount: 32000,
      status: "OPEN" as BountyStatus,
      codingLanguages: ["TYPESCRIPT" as ProgrammingLanguage],
      tags: ["nostr", "encryption", "security"],
      estimatedHours: 12,
    },
    {
      workspaceId: workspace3.id,
      creatorPubkey: TEST_USERS[2].pubkey,
      assigneePubkey: TEST_USERS[3].pubkey,
      title: "Bitcoin Branding Guidelines Document",
      description: "Create comprehensive branding guidelines for Bitcoin-focused applications.",
      deliverables:
        "- Brand guidelines PDF\n- Logo usage rules\n- Color palettes\n- Typography system\n- Do's and Don'ts",
      amount: 22000,
      status: "COMPLETED" as BountyStatus,
      codingLanguages: [],
      tags: ["design", "branding", "documentation"],
      estimatedHours: 8,
      assignedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      workStartedAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ];

  const createdBounties = [];
  for (const bountyData of bounties) {
    const bounty = await db.bounty.create({ data: bountyData });
    createdBounties.push(bounty);
    console.log(`  ✓ Created bounty: ${bounty.title}`);
  }

  console.log("\n💬 Adding comments and proofs...");

  await db.bountyComment.create({
    data: {
      bountyId: createdBounties[0].id,
      authorPubkey: TEST_USERS[1].pubkey,
      content:
        "This looks interesting! I have experience with QR code generation. What's the timeline?",
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
  });

  await db.bountyComment.create({
    data: {
      bountyId: createdBounties[0].id,
      authorPubkey: TEST_USERS[0].pubkey,
      content: "Great! We need this by end of month. Let me know if you want to take it on.",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  });

  await db.bountyComment.create({
    data: {
      bountyId: createdBounties[1].id,
      authorPubkey: TEST_USERS[1].pubkey,
      content: "Started working on the LND integration. Should have an update by end of week.",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await db.bountyComment.create({
    data: {
      bountyId: createdBounties[1].id,
      authorPubkey: TEST_USERS[3].pubkey,
      content: "Awesome! Make sure to include retry logic for failed payments.",
      createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    },
  });

  await db.bountyProof.create({
    data: {
      bountyId: createdBounties[2].id,
      submittedByPubkey: TEST_USERS[1].pubkey,
      description:
        "Dashboard implementation complete. All requirements met:\n- Balance widget with real-time updates\n- Transaction history with pagination\n- Quick send/receive modals\n- Fully responsive on mobile\n\nDeployed to staging for review.",
      proofUrl: "https://github.com/example/dashboard-pr/123",
      status: "PENDING" as ProofStatus,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
  });

  await db.bountyComment.create({
    data: {
      bountyId: createdBounties[2].id,
      authorPubkey: TEST_USERS[1].pubkey,
      content: "Submitted for review! Check out the staging link in the proof.",
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
  });

  await db.bountyProof.create({
    data: {
      bountyId: createdBounties[3].id,
      submittedByPubkey: TEST_USERS[2].pubkey,
      description:
        "Completed onboarding flow design:\n- Full user journey mapped\n- High-fidelity Figma prototypes for mobile and desktop\n- Micro-interactions documented\n- Design tokens exported for development\n\nFigma link in the proof URL.",
      proofUrl: "https://figma.com/file/example-onboarding-flow",
      status: "ACCEPTED" as ProofStatus,
      reviewedByPubkey: TEST_USERS[3].pubkey,
      reviewNotes:
        "Excellent work! The flow is intuitive and the animations are smooth. Approved for implementation.",
      reviewedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await db.bountyComment.create({
    data: {
      bountyId: createdBounties[3].id,
      authorPubkey: TEST_USERS[2].pubkey,
      content: "Final designs are ready! Let me know if any adjustments needed.",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await db.bountyComment.create({
    data: {
      bountyId: createdBounties[3].id,
      authorPubkey: TEST_USERS[3].pubkey,
      content: "Perfect! These look amazing. Approved and marked as complete.",
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  });

  await db.bountyComment.create({
    data: {
      bountyId: createdBounties[4].id,
      authorPubkey: TEST_USERS[0].pubkey,
      content: "Looking for a Rust developer for this relay implementation. High priority!",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await db.bountyComment.create({
    data: {
      bountyId: createdBounties[5].id,
      authorPubkey: TEST_USERS[0].pubkey,
      content: "Just started on this. Planning to use Radix UI for the base components.",
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
  });

  await db.bountyProof.create({
    data: {
      bountyId: createdBounties[9].id,
      submittedByPubkey: TEST_USERS[3].pubkey,
      description:
        "Animation work in progress. Completed:\n- Script for first two animations\n- Storyboards for all three\n- First animation rendered at 80%\n\nNeed feedback before finalizing.",
      proofUrl: "https://drive.google.com/animations-wip",
      status: "CHANGES_REQUESTED" as ProofStatus,
      reviewedByPubkey: TEST_USERS[2].pubkey,
      reviewNotes:
        "Great start! The first animation looks good. Can you adjust the timing on the channel opening sequence? It feels a bit rushed. Also, let's make the Lightning bolt more prominent.",
      reviewedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    },
  });

  await db.bountyComment.create({
    data: {
      bountyId: createdBounties[9].id,
      authorPubkey: TEST_USERS[3].pubkey,
      content: "Uploaded WIP animations. Looking forward to your feedback!",
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    },
  });

  await db.bountyComment.create({
    data: {
      bountyId: createdBounties[9].id,
      authorPubkey: TEST_USERS[2].pubkey,
      content:
        "Looks promising! Left some notes in the review. Adjust the timing and we're good to go.",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  });

  await db.bountyProof.create({
    data: {
      bountyId: createdBounties[12].id,
      submittedByPubkey: TEST_USERS[1].pubkey,
      description:
        "Webhook system completed and deployed:\n- Event-driven architecture with message queue\n- Automatic retry with exponential backoff\n- HMAC signature verification\n- Admin UI for monitoring deliveries\n- Full documentation and examples\n\nAll tests passing, ready for production.",
      proofUrl: "https://github.com/example/webhooks-pr/456",
      status: "ACCEPTED" as ProofStatus,
      reviewedByPubkey: TEST_USERS[3].pubkey,
      reviewNotes:
        "Excellent implementation! Exactly what we needed. The retry mechanism is solid and the admin UI is very useful. Approving for payment.",
      reviewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await db.bountyComment.create({
    data: {
      bountyId: createdBounties[12].id,
      authorPubkey: TEST_USERS[1].pubkey,
      content: "Webhook system is complete! Check out the PR for full details.",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await db.bountyProof.create({
    data: {
      bountyId: createdBounties[14].id,
      submittedByPubkey: TEST_USERS[3].pubkey,
      description:
        "Branding guidelines document completed:\n- 40-page comprehensive guide\n- Logo variations and usage rules\n- Complete color system with accessibility notes\n- Typography hierarchy\n- Examples of correct and incorrect usage\n\nReady for distribution.",
      proofUrl: "https://drive.google.com/branding-guidelines.pdf",
      status: "ACCEPTED" as ProofStatus,
      reviewedByPubkey: TEST_USERS[2].pubkey,
      reviewNotes: "This is exactly what we needed! Very thorough and professional. Approved.",
      reviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  });

  const commentCount = await db.bountyComment.count();
  const proofCount = await db.bountyProof.count();
  console.log(`  ✓ Created ${commentCount} comments`);
  console.log(`  ✓ Created ${proofCount} proofs`);

  console.log("\n🔔 Creating notifications...");

  const now = Date.now();
  const notifications = [
    {
      userPubkey: TEST_USERS[0].pubkey,
      type: "MEMBER_ADDED" as NotificationType,
      title: "New member joined Lightning Labs",
      message: "Bob has joined your workspace as a Contributor",
      relatedEntityType: "WORKSPACE",
      relatedEntityId: workspace1.id,
      read: false,
      createdAt: new Date(now - 5 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[0].pubkey,
      type: "PROOF_REVIEWED" as NotificationType,
      title: "New submission on Dashboard Widget",
      message: "Bob submitted proof for User Dashboard with Balance Widget",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[2].id,
      read: false,
      createdAt: new Date(now - 1 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[0].pubkey,
      type: "BOUNTY_COMPLETED" as NotificationType,
      title: "Bounty completed",
      message: "Bob completed the Webhook System bounty",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[12].id,
      read: false,
      createdAt: new Date(now - 3 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[0].pubkey,
      type: "PROOF_REVIEWED" as NotificationType,
      title: "New comment on your bounty",
      message: "Bob commented on Lightning Invoice QR Code Component",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[0].id,
      read: false,
      createdAt: new Date(now - 5 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[0].pubkey,
      type: "BOUNTY_ASSIGNED" as NotificationType,
      title: "Bounty updated",
      message: "Payment Verification Service bounty was updated",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[1].id,
      read: false,
      createdAt: new Date(now - 8 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[0].pubkey,
      type: "PROOF_REVIEWED" as NotificationType,
      title: "Submission approved",
      message: "Your submission for Webhook System was approved",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[12].id,
      read: false,
      createdAt: new Date(now - 12 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[0].pubkey,
      type: "BOUNTY_ASSIGNED" as NotificationType,
      title: "New bounty in Lightning Labs",
      message: "Diana created Lightning Channel Management API bounty",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[11].id,
      read: false,
      createdAt: new Date(now - 18 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[0].pubkey,
      type: "MEMBER_REMOVED" as NotificationType,
      title: "Member left workspace",
      message: "A member left Lightning Labs workspace",
      relatedEntityType: "WORKSPACE",
      relatedEntityId: workspace1.id,
      read: false,
      createdAt: new Date(now - 24 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[0].pubkey,
      type: "BOUNTY_ASSIGNED" as NotificationType,
      title: "Bounty assigned",
      message: "Payment Verification Service was assigned to Bob",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[1].id,
      read: true,
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[0].pubkey,
      type: "PROOF_REVIEWED" as NotificationType,
      title: "New comment",
      message: "Diana replied to your comment on Payment Verification",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[1].id,
      read: true,
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[0].pubkey,
      type: "BOUNTY_COMPLETED" as NotificationType,
      title: "Design project completed",
      message: "Charlie completed the Onboarding Flow Design",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[3].id,
      read: true,
      createdAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[0].pubkey,
      type: "MEMBER_ADDED" as NotificationType,
      title: "New admin joined",
      message: "Diana joined Lightning Labs as an Admin",
      relatedEntityType: "WORKSPACE",
      relatedEntityId: workspace1.id,
      read: true,
      createdAt: new Date(now - 6 * 24 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[1].pubkey,
      type: "BOUNTY_ASSIGNED" as NotificationType,
      title: "You've been assigned a bounty",
      message: "You've been assigned to Payment Verification Service",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[1].id,
      read: false,
      createdAt: new Date(now - 1 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[1].pubkey,
      type: "PROOF_REVIEWED" as NotificationType,
      title: "Comment on your submission",
      message: "Alice commented on your dashboard submission",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[2].id,
      read: false,
      createdAt: new Date(now - 30 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[1].pubkey,
      type: "PROOF_REVIEWED" as NotificationType,
      title: "Submission approved!",
      message: "Your submission for Webhook System was approved",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[12].id,
      read: false,
      createdAt: new Date(now - 2 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[1].pubkey,
      type: "BOUNTY_COMPLETED" as NotificationType,
      title: "Bounty marked as completed",
      message: "Webhook System bounty has been completed",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[12].id,
      read: false,
      createdAt: new Date(now - 4 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[1].pubkey,
      type: "PAYMENT_RECEIVED" as NotificationType,
      title: "New bounty available",
      message: "New bounty: Lightning Invoice QR Code Component",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[0].id,
      read: false,
      createdAt: new Date(now - 6 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[1].pubkey,
      type: "BOUNTY_ASSIGNED" as NotificationType,
      title: "Bounty details updated",
      message: "Dashboard Widget bounty requirements were updated",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[2].id,
      read: true,
      createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[1].pubkey,
      type: "PROOF_REVIEWED" as NotificationType,
      title: "New comment",
      message: "Diana commented on Payment Verification Service",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[1].id,
      read: true,
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[1].pubkey,
      type: "WORKSPACE_INVITE" as NotificationType,
      title: "Workspace invitation",
      message: "You've been invited to join Lightning Labs",
      relatedEntityType: "WORKSPACE",
      relatedEntityId: workspace1.id,
      read: true,
      createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[1].pubkey,
      type: "MEMBER_ADDED" as NotificationType,
      title: "Welcome to Lightning Labs",
      message: "You joined Lightning Labs workspace",
      relatedEntityType: "WORKSPACE",
      relatedEntityId: workspace1.id,
      read: true,
      createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[1].pubkey,
      type: "BOUNTY_ASSIGNED" as NotificationType,
      title: "Previous assignment",
      message: "You were assigned to Nostr Client UI Components",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[5].id,
      read: true,
      createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[2].pubkey,
      type: "PAYMENT_RECEIVED" as NotificationType,
      title: "New design bounty",
      message: "New bounty: Bitcoin Wallet Icon Set",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[8].id,
      read: false,
      createdAt: new Date(now - 1 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[2].pubkey,
      type: "PROOF_REVIEWED" as NotificationType,
      title: "Changes requested",
      message: "Your submission for Lightning Animations needs changes",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[9].id,
      read: false,
      createdAt: new Date(now - 3 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[2].pubkey,
      type: "PROOF_REVIEWED" as NotificationType,
      title: "Feedback on your work",
      message: "Alice left feedback on Lightning Animations",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[9].id,
      read: false,
      createdAt: new Date(now - 5 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[2].pubkey,
      type: "BOUNTY_ASSIGNED" as NotificationType,
      title: "Design bounty assigned",
      message: "You've been assigned to Onboarding Flow Design",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[3].id,
      read: true,
      createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[2].pubkey,
      type: "PROOF_REVIEWED" as NotificationType,
      title: "Submission approved!",
      message: "Your Onboarding Flow Design was approved",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[3].id,
      read: true,
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[2].pubkey,
      type: "BOUNTY_COMPLETED" as NotificationType,
      title: "Bounty completed",
      message: "Onboarding Flow Design bounty completed",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[3].id,
      read: true,
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[2].pubkey,
      type: "MEMBER_ADDED" as NotificationType,
      title: "New member",
      message: "Diana joined Bitcoin Design workspace",
      relatedEntityType: "WORKSPACE",
      relatedEntityId: workspace3.id,
      read: true,
      createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[2].pubkey,
      type: "PAYMENT_RECEIVED" as NotificationType,
      title: "Bounty posted",
      message: "Your bounty Payment Flow UX Redesign is now live",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[10].id,
      read: true,
      createdAt: new Date(now - 8 * 24 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[3].pubkey,
      type: "PROOF_REVIEWED" as NotificationType,
      title: "New submission to review",
      message: "Bob submitted proof for Dashboard Widget",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[2].id,
      read: false,
      createdAt: new Date(now - 30 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[3].pubkey,
      type: "BOUNTY_ASSIGNED" as NotificationType,
      title: "Bounty ready for review",
      message: "Lightning Animations bounty needs your review",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[9].id,
      read: false,
      createdAt: new Date(now - 2 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[3].pubkey,
      type: "PROOF_REVIEWED" as NotificationType,
      title: "Response needed",
      message: "Alice replied to your review comment",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[9].id,
      read: false,
      createdAt: new Date(now - 5 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[3].pubkey,
      type: "BOUNTY_COMPLETED" as NotificationType,
      title: "Bounty completed",
      message: "Branding Guidelines bounty was completed",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[14].id,
      read: false,
      createdAt: new Date(now - 8 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[3].pubkey,
      type: "BOUNTY_ASSIGNED" as NotificationType,
      title: "Team member assigned",
      message: "Bob was assigned to Payment Verification Service",
      relatedEntityType: "BOUNTY",
      relatedEntityId: createdBounties[1].id,
      read: true,
      createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[3].pubkey,
      type: "MEMBER_ADDED" as NotificationType,
      title: "New workspace member",
      message: "You joined Lightning Labs as an Admin",
      relatedEntityType: "WORKSPACE",
      relatedEntityId: workspace1.id,
      read: true,
      createdAt: new Date(now - 6 * 24 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[4].pubkey,
      type: "WORKSPACE_INVITE" as NotificationType,
      title: "You've been invited",
      message: "Bob invited you to join Nostr Devs workspace",
      relatedEntityType: "WORKSPACE",
      relatedEntityId: workspace2.id,
      read: false,
      createdAt: new Date(now - 2 * 60 * 60 * 1000),
    },
    {
      userPubkey: TEST_USERS[4].pubkey,
      type: "MEMBER_ADDED" as NotificationType,
      title: "Welcome to Nostr Devs",
      message: "You've successfully joined Nostr Devs workspace",
      relatedEntityType: "WORKSPACE",
      relatedEntityId: workspace2.id,
      read: true,
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const notification of notifications) {
    await db.notification.create({ data: notification });
  }

  const notificationCount = await db.notification.count();
  console.log(`  ✓ Created ${notificationCount} notifications`);

  console.log("\n📊 Creating workspace activities...");

  const activities = [
    {
      workspaceId: workspace1.id,
      userPubkey: TEST_USERS[0].pubkey,
      action: "MEMBER_ADDED" as WorkspaceActivityAction,
      details: { bountyId: createdBounties[0].id, bountyTitle: createdBounties[0].title },
      timestamp: new Date(now - 7 * 24 * 60 * 60 * 1000),
    },
    {
      workspaceId: workspace1.id,
      userPubkey: TEST_USERS[3].pubkey,
      action: "BUDGET_DEPOSITED" as WorkspaceActivityAction,
      details: { bountyId: createdBounties[1].id, bountyTitle: createdBounties[1].title },
      timestamp: new Date(now - 5 * 24 * 60 * 60 * 1000),
    },
    {
      workspaceId: workspace1.id,
      userPubkey: TEST_USERS[1].pubkey,
      action: "MEMBER_ADDED" as WorkspaceActivityAction,
      details: { role: "CONTRIBUTOR" },
      timestamp: new Date(now - 8 * 24 * 60 * 60 * 1000),
    },
    {
      workspaceId: workspace1.id,
      userPubkey: TEST_USERS[1].pubkey,
      action: "SETTINGS_UPDATED" as WorkspaceActivityAction,
      details: { bountyId: createdBounties[1].id, bountyTitle: createdBounties[1].title },
      timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000),
    },
    {
      workspaceId: workspace1.id,
      userPubkey: TEST_USERS[1].pubkey,
      action: "BUDGET_WITHDRAWN" as WorkspaceActivityAction,
      details: { bountyId: createdBounties[12].id, bountyTitle: createdBounties[12].title },
      timestamp: new Date(now - 1 * 24 * 60 * 60 * 1000),
    },
    {
      workspaceId: workspace1.id,
      userPubkey: TEST_USERS[2].pubkey,
      action: "SETTINGS_UPDATED" as WorkspaceActivityAction,
      details: { bountyId: createdBounties[3].id, bountyTitle: createdBounties[3].title },
      timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000),
    },
    {
      workspaceId: workspace1.id,
      userPubkey: TEST_USERS[3].pubkey,
      action: "MEMBER_ADDED" as WorkspaceActivityAction,
      details: { role: "ADMIN" },
      timestamp: new Date(now - 10 * 24 * 60 * 60 * 1000),
    },
    {
      workspaceId: workspace2.id,
      userPubkey: TEST_USERS[1].pubkey,
      action: "BUDGET_DEPOSITED" as WorkspaceActivityAction,
      details: { bountyId: createdBounties[4].id, bountyTitle: createdBounties[4].title },
      timestamp: new Date(now - 6 * 24 * 60 * 60 * 1000),
    },
    {
      workspaceId: workspace2.id,
      userPubkey: TEST_USERS[0].pubkey,
      action: "MEMBER_ADDED" as WorkspaceActivityAction,
      details: { role: "CONTRIBUTOR" },
      timestamp: new Date(now - 9 * 24 * 60 * 60 * 1000),
    },
    {
      workspaceId: workspace2.id,
      userPubkey: TEST_USERS[0].pubkey,
      action: "SETTINGS_UPDATED" as WorkspaceActivityAction,
      details: { bountyId: createdBounties[5].id, bountyTitle: createdBounties[5].title },
      timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000),
    },
    {
      workspaceId: workspace2.id,
      userPubkey: TEST_USERS[4].pubkey,
      action: "MEMBER_ADDED" as WorkspaceActivityAction,
      details: { role: "VIEWER" },
      timestamp: new Date(now - 4 * 24 * 60 * 60 * 1000),
    },
    {
      workspaceId: workspace3.id,
      userPubkey: TEST_USERS[2].pubkey,
      action: "BUDGET_DEPOSITED" as WorkspaceActivityAction,
      details: { bountyId: createdBounties[8].id, bountyTitle: createdBounties[8].title },
      timestamp: new Date(now - 5 * 24 * 60 * 60 * 1000),
    },
    {
      workspaceId: workspace3.id,
      userPubkey: TEST_USERS[3].pubkey,
      action: "MEMBER_ADDED" as WorkspaceActivityAction,
      details: { role: "CONTRIBUTOR" },
      timestamp: new Date(now - 7 * 24 * 60 * 60 * 1000),
    },
    {
      workspaceId: workspace3.id,
      userPubkey: TEST_USERS[3].pubkey,
      action: "BUDGET_WITHDRAWN" as WorkspaceActivityAction,
      details: { bountyId: createdBounties[14].id, bountyTitle: createdBounties[14].title },
      timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000),
    },
    {
      workspaceId: workspace3.id,
      userPubkey: TEST_USERS[2].pubkey,
      action: "ROLE_CHANGED" as WorkspaceActivityAction,
      details: { bountyId: createdBounties[10].id, bountyTitle: createdBounties[10].title },
      timestamp: new Date(now - 8 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const activity of activities) {
    await db.workspaceActivity.create({ data: activity });
  }

  const activityCount = await db.workspaceActivity.count();
  console.log(`  ✓ Created ${activityCount} workspace activities`);

  console.log("\n✅ Seed completed successfully!");
  console.log(`\n📊 Summary:`);
  console.log(`  - ${TEST_USERS.length} users created`);
  console.log(`  - 3 workspaces created`);
  console.log(`  - ${bounties.length} bounties created`);
  console.log(`  - ${commentCount} comments created`);
  console.log(`  - ${proofCount} proofs created`);
  console.log(`  - ${notificationCount} notifications created`);
  console.log(`  - ${activityCount} workspace activities created`);
  console.log(`\n💡 Dev Login Pubkeys:`);
  console.log(`  - Alice:   ${TEST_USERS[0].pubkey} (12 notifications, 8 unread)`);
  console.log(`  - Bob:     ${TEST_USERS[1].pubkey} (10 notifications, 5 unread)`);
  console.log(`  - Charlie: ${TEST_USERS[2].pubkey} (8 notifications, 3 unread)`);
  console.log(`  - Diana:   ${TEST_USERS[3].pubkey} (6 notifications, 4 unread)`);
  console.log(`  - Eve:     ${TEST_USERS[4].pubkey} (2 notifications, 1 unread)`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
