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
