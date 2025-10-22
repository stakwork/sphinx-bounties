import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sphinx Bounties API",
      version: "1.0.0",
      description: "Bitcoin-powered bounty platform API documentation",
      contact: {
        name: "Sphinx Bounties",
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        description: "API Server",
      },
    ],
    components: {
      securitySchemes: {
        NostrAuth: {
          type: "apiKey",
          in: "header",
          name: "x-user-pubkey",
          description: "Nostr public key for authentication",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                },
                message: {
                  type: "string",
                },
              },
            },
            meta: {
              type: "object",
              properties: {
                timestamp: {
                  type: "string",
                  format: "date-time",
                },
              },
            },
          },
        },
        PaginationMeta: {
          type: "object",
          properties: {
            page: {
              type: "integer",
            },
            pageSize: {
              type: "integer",
            },
            totalCount: {
              type: "integer",
            },
            totalPages: {
              type: "integer",
            },
          },
        },
        User: {
          type: "object",
          description: "User profile information",
          properties: {
            id: {
              type: "string",
              description: "Unique user identifier",
            },
            pubkey: {
              type: "string",
              description: "Nostr public key (66 hex chars)",
            },
            username: {
              type: "string",
              description: "Unique username",
            },
            alias: {
              type: "string",
              nullable: true,
              description: "Display name",
            },
            description: {
              type: "string",
              nullable: true,
              description: "User bio",
            },
            avatarUrl: {
              type: "string",
              nullable: true,
              description: "Profile picture URL",
            },
            githubUsername: {
              type: "string",
              nullable: true,
              description: "GitHub username",
            },
            githubVerified: {
              type: "boolean",
              description: "GitHub verification status",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Bounty: {
          type: "object",
          description: "Work bounty with Bitcoin rewards",
          properties: {
            id: {
              type: "string",
              description: "Unique bounty identifier",
            },
            workspaceId: {
              type: "string",
              description: "Associated workspace ID",
            },
            title: {
              type: "string",
              description: "Bounty title",
            },
            description: {
              type: "string",
              description: "Detailed description",
            },
            deliverables: {
              type: "string",
              description: "Expected deliverables",
            },
            amount: {
              type: "string",
              description: "Reward amount in satoshis",
            },
            status: {
              type: "string",
              enum: ["DRAFT", "OPEN", "ASSIGNED", "IN_REVIEW", "COMPLETED", "PAID", "CANCELLED"],
              description: "Current bounty status",
            },
            codingLanguages: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Required programming languages",
            },
            tags: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Category tags",
            },
            estimatedHours: {
              type: "integer",
              nullable: true,
              description: "Estimated completion time",
            },
            estimatedCompletionDate: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            creatorPubkey: {
              type: "string",
              description: "Creator's Nostr pubkey",
            },
            assigneePubkey: {
              type: "string",
              nullable: true,
              description: "Assignee's Nostr pubkey",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
            assignedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            completedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
          },
        },
        Workspace: {
          type: "object",
          description: "Team or project workspace",
          properties: {
            id: {
              type: "string",
              description: "Unique workspace identifier",
            },
            name: {
              type: "string",
              description: "Workspace name",
            },
            ownerPubkey: {
              type: "string",
              description: "Owner's Nostr pubkey",
            },
            description: {
              type: "string",
              nullable: true,
              description: "Short description",
            },
            mission: {
              type: "string",
              nullable: true,
              description: "Workspace mission statement",
            },
            avatarUrl: {
              type: "string",
              nullable: true,
              description: "Workspace logo URL",
            },
            websiteUrl: {
              type: "string",
              nullable: true,
            },
            githubUrl: {
              type: "string",
              nullable: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        WorkspaceMember: {
          type: "object",
          description: "Workspace team member",
          properties: {
            id: {
              type: "string",
            },
            workspaceId: {
              type: "string",
            },
            userPubkey: {
              type: "string",
            },
            role: {
              type: "string",
              enum: ["OWNER", "ADMIN", "CONTRIBUTOR", "VIEWER"],
              description: "Member access role",
            },
            joinedAt: {
              type: "string",
              format: "date-time",
            },
            user: {
              $ref: "#/components/schemas/User",
            },
          },
        },
        BountyProof: {
          type: "object",
          description: "Proof of work submission",
          properties: {
            id: {
              type: "string",
            },
            bountyId: {
              type: "string",
            },
            submittedByPubkey: {
              type: "string",
            },
            description: {
              type: "string",
              description: "Proof description",
            },
            proofUrl: {
              type: "string",
              description: "URL to proof (PR, demo, etc)",
            },
            status: {
              type: "string",
              enum: ["PENDING", "ACCEPTED", "REJECTED", "CHANGES_REQUESTED"],
            },
            reviewNotes: {
              type: "string",
              nullable: true,
              description: "Reviewer feedback",
            },
            reviewedByPubkey: {
              type: "string",
              nullable: true,
            },
            reviewedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        BountyComment: {
          type: "object",
          description: "Discussion comment on a bounty",
          properties: {
            id: {
              type: "string",
            },
            bountyId: {
              type: "string",
            },
            authorPubkey: {
              type: "string",
            },
            content: {
              type: "string",
              description: "Comment text content",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
            author: {
              $ref: "#/components/schemas/User",
            },
          },
        },
        Transaction: {
          type: "object",
          description: "Bitcoin Lightning transaction",
          properties: {
            id: {
              type: "string",
            },
            workspaceId: {
              type: "string",
            },
            bountyId: {
              type: "string",
              nullable: true,
            },
            type: {
              type: "string",
              enum: ["DEPOSIT", "WITHDRAWAL", "PAYMENT", "REFUND", "STAKE", "STAKE_RETURN"],
            },
            amount: {
              type: "string",
              description: "Amount in satoshis",
            },
            fromUserPubkey: {
              type: "string",
              nullable: true,
            },
            toUserPubkey: {
              type: "string",
              nullable: true,
            },
            status: {
              type: "string",
              enum: ["PENDING", "COMPLETED", "FAILED", "EXPIRED"],
            },
            memo: {
              type: "string",
              nullable: true,
              description: "Transaction description",
            },
            paymentHash: {
              type: "string",
              nullable: true,
              description: "Lightning payment hash",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            completedAt: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
          },
        },
        Notification: {
          type: "object",
          description: "User notification",
          properties: {
            id: {
              type: "string",
            },
            userPubkey: {
              type: "string",
            },
            type: {
              type: "string",
              enum: [
                "BOUNTY_ASSIGNED",
                "BOUNTY_COMPLETED",
                "PAYMENT_RECEIVED",
                "PROOF_REVIEWED",
                "WORKSPACE_INVITE",
                "MEMBER_ADDED",
                "MEMBER_REMOVED",
              ],
            },
            title: {
              type: "string",
            },
            message: {
              type: "string",
            },
            relatedEntityType: {
              type: "string",
              nullable: true,
            },
            relatedEntityId: {
              type: "string",
              nullable: true,
            },
            read: {
              type: "boolean",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        WorkspaceBudget: {
          type: "object",
          description: "Workspace Bitcoin budget",
          properties: {
            id: {
              type: "string",
            },
            workspaceId: {
              type: "string",
            },
            totalBudget: {
              type: "string",
              description: "Total budget in satoshis",
            },
            availableBudget: {
              type: "string",
              description: "Available for new bounties",
            },
            reservedBudget: {
              type: "string",
              description: "Reserved for active bounties",
            },
            paidBudget: {
              type: "string",
              description: "Already paid out",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        UserStats: {
          type: "object",
          description: "User performance statistics",
          properties: {
            totalBountiesCreated: {
              type: "integer",
            },
            totalBountiesAssigned: {
              type: "integer",
            },
            totalBountiesCompleted: {
              type: "integer",
            },
            totalEarned: {
              type: "string",
              description: "Total satoshis earned",
            },
            totalSpent: {
              type: "string",
              description: "Total satoshis spent",
            },
            averageCompletionTime: {
              type: "number",
              nullable: true,
              description: "Average hours to complete",
            },
            successRate: {
              type: "number",
              description: "Completion percentage",
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description: "Nostr-based authentication endpoints",
      },
      {
        name: "Bounties",
        description: "Bounty management endpoints",
      },
      {
        name: "Bounty Actions",
        description: "Bounty lifecycle actions (claim, complete, cancel)",
      },
      {
        name: "Proofs",
        description: "Proof of work submission and review",
      },
      {
        name: "Comments",
        description: "Bounty discussion and comments",
      },
      {
        name: "Timing",
        description: "Work time tracking for bounties",
      },
      {
        name: "Payments",
        description: "Lightning payment processing",
      },
      {
        name: "Workspaces",
        description: "Workspace and team management",
      },
      {
        name: "Users",
        description: "User profiles and statistics",
      },
      {
        name: "Admin",
        description: "Administrative endpoints",
      },
      {
        name: "Notifications",
        description: "User notifications",
      },
      {
        name: "Leaderboard",
        description: "Top contributors rankings",
      },
    ],
  },
  apis: ["./src/app/api/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
