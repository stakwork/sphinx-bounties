/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { BountyStatus } from "@prisma/client";
import {
  createAuthedRequest,
  createTestUser,
  createTestWorkspace,
  createTestBounty,
  cleanupTestUsers,
  connectTestDb,
  disconnectTestDb,
  generateTestPubkey,
  parseResponse,
} from "../utils";
import { GET as GetComments } from "@/app/api/bounties/[id]/comments/route";
import { POST as CreateComment } from "@/app/api/bounties/[id]/comments/route";
import { PATCH as UpdateComment } from "@/app/api/bounties/[id]/comments/[commentId]/route";
import { DELETE as DeleteComment } from "@/app/api/bounties/[id]/comments/[commentId]/route";

describe("Bounty Comments Integration Tests", () => {
  const ownerPubkey = generateTestPubkey("owner");
  const commenterPubkey = generateTestPubkey("commenter");
  const otherPubkey = generateTestPubkey("other");

  let workspaceId: string;
  let bountyId: string;

  beforeAll(async () => {
    await connectTestDb();

    const timestamp = Date.now().toString().slice(-6); // Last 6 digits
    await createTestUser({ pubkey: ownerPubkey, username: `owner_${timestamp}` });
    await createTestUser({ pubkey: commenterPubkey, username: `commenter_${timestamp}` });
    await createTestUser({ pubkey: otherPubkey, username: `other_${timestamp}` });
  });

  afterAll(async () => {
    // Clean up comments first to avoid foreign key constraint violation
    await db.bountyComment.deleteMany({
      where: {
        authorPubkey: { in: [ownerPubkey, commenterPubkey, otherPubkey] },
      },
    });
    await cleanupTestUsers([ownerPubkey, commenterPubkey, otherPubkey]);
    await disconnectTestDb();
  });

  beforeEach(async () => {
    // Clean up previous test data (only from THIS test suite)
    // Delete in correct order to avoid foreign key issues
    await db.bountyComment.deleteMany({
      where: {
        bounty: {
          workspace: {
            name: { startsWith: "comments-test-ws-" },
          },
        },
      },
    });
    await db.bounty.deleteMany({
      where: {
        workspace: {
          name: { startsWith: "comments-test-ws-" },
        },
      },
    });
    await db.workspace.deleteMany({
      where: {
        name: { startsWith: "comments-test-ws-" },
      },
    });

    // Create fresh test data for each test
    const { workspace } = await createTestWorkspace({
      ownerPubkey,
      name: `comments-test-ws-${Date.now()}`,
      description: "Workspace for testing bounty comments",
    });
    workspaceId = workspace.id;

    const bounty = await createTestBounty({
      workspaceId,
      creatorPubkey: ownerPubkey,
      title: `Test Bounty ${Date.now()}`,
      description: "Test bounty description that is long enough to pass validation",
      deliverables: "Test deliverables description for bounty completion",
      amount: 50000,
      status: BountyStatus.DRAFT,
    });
    bountyId = bounty.id;
  });

  describe("GET /api/bounties/[id]/comments", () => {
    it("should return empty list when no comments exist", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/comments`,
        ownerPubkey,
        { method: "GET" }
      );
      const response = await GetComments(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.meta.pagination.totalCount).toBe(0);
    });

    it("should list comments for a bounty", async () => {
      await db.bountyComment.create({
        data: {
          bountyId,
          authorPubkey: commenterPubkey,
          content: "First comment",
        },
      });

      await db.bountyComment.create({
        data: {
          bountyId,
          authorPubkey: ownerPubkey,
          content: "Second comment",
        },
      });

      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/comments`,
        ownerPubkey,
        { method: "GET" }
      );
      const response = await GetComments(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].content).toBe("Second comment");
      expect(data.data[1].content).toBe("First comment");
    });

    it("should paginate comments correctly", async () => {
      // Create 15 comments
      for (let i = 0; i < 15; i++) {
        await db.bountyComment.create({
          data: {
            bountyId,
            authorPubkey: commenterPubkey,
            content: `Comment ${i + 1}`,
          },
        });
      }

      const url = `http://localhost/api/bounties/${bountyId}/comments?page=1&limit=10`;
      const request = createAuthedRequest(url, ownerPubkey, { method: "GET" });
      const response = await GetComments(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(10);
      expect(data.meta.pagination.totalCount).toBe(15);
      expect(data.meta.pagination.totalPages).toBe(2);
    });

    it("should return empty list for non-existent bounty", async () => {
      const fakeBountyId = "cmh0000000000000000000000";
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${fakeBountyId}/comments`,
        ownerPubkey,
        { method: "GET" }
      );
      const response = await GetComments(request, {
        params: Promise.resolve({ id: fakeBountyId }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });
  });

  describe("POST /api/bounties/[id]/comments", () => {
    it("should create a comment as workspace member", async () => {
      const commentData = { content: "This is a test comment" };
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/comments`,
        ownerPubkey, // Owner is a workspace member
        {
          method: "POST",
          body: JSON.stringify(commentData),
        }
      );

      const response = await CreateComment(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(201);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
      expect(data.data.content).toBe(commentData.content);
      expect(data.data.authorPubkey).toBe(ownerPubkey);
    });

    it("should reject empty comment", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/comments`,
        ownerPubkey,
        {
          method: "POST",
          body: JSON.stringify({ content: "" }),
        }
      );

      const response = await CreateComment(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(422);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should reject comment from non-workspace member", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/comments`,
        commenterPubkey, // Not a workspace member
        {
          method: "POST",
          body: JSON.stringify({ content: "Test comment" }),
        }
      );

      const response = await CreateComment(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(403);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should reject comment exceeding max length", async () => {
      const longContent = "a".repeat(5001);
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/comments`,
        ownerPubkey,
        {
          method: "POST",
          body: JSON.stringify({ content: longContent }),
        }
      );

      const response = await CreateComment(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(422);
    });

    it("should return 404 for non-existent bounty", async () => {
      const fakeBountyId = "cmh0000000000000000000000";
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${fakeBountyId}/comments`,
        ownerPubkey,
        {
          method: "POST",
          body: JSON.stringify({
            content: "Comment on nothing",
          }),
        }
      );

      const response = await CreateComment(request, {
        params: Promise.resolve({ id: fakeBountyId }),
      });

      expect(response.status).toBe(404);
    });

    it("should require authentication", async () => {
      const request = new Request(`http://localhost/api/bounties/${bountyId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: "Unauthorized comment" }),
        headers: { "Content-Type": "application/json" },
      }) as any;
      const response = await CreateComment(request, {
        params: Promise.resolve({ id: bountyId }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /api/bounties/[id]/comments/[commentId]", () => {
    let commentId: string;

    beforeEach(async () => {
      const comment = await db.bountyComment.create({
        data: {
          bountyId,
          authorPubkey: commenterPubkey,
          content: "Original comment",
        },
      });
      commentId = comment.id;
    });

    it("should update own comment", async () => {
      const updateData = { content: "Updated comment content" };
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/comments/${commentId}`,
        commenterPubkey,
        {
          method: "PATCH",
          body: JSON.stringify(updateData),
        }
      );

      const response = await UpdateComment(request, {
        params: Promise.resolve({ id: bountyId, commentId }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
      expect(data.data.content).toBe(updateData.content);
    });

    it("should reject update from non-author", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/comments/${commentId}`,
        otherPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({
            content: "Trying to update someone else's comment",
          }),
        }
      );

      const response = await UpdateComment(request, {
        params: Promise.resolve({ id: bountyId, commentId }),
      });

      expect(response.status).toBe(403);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should reject empty update", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/comments/${commentId}`,
        commenterPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({ content: "" }),
        }
      );

      const response = await UpdateComment(request, {
        params: Promise.resolve({ id: bountyId, commentId }),
      });

      expect(response.status).toBe(422);
    });

    it("should return 404 for non-existent comment", async () => {
      const fakeCommentId = "cmh0000000000000000000000";
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/comments/${fakeCommentId}`,
        commenterPubkey,
        {
          method: "PATCH",
          body: JSON.stringify({ content: "Update to nothing" }),
        }
      );

      const response = await UpdateComment(request, {
        params: Promise.resolve({ id: bountyId, commentId: fakeCommentId }),
      });

      expect(response.status).toBe(404);
    });

    it("should require authentication", async () => {
      const request = new Request(
        `http://localhost/api/bounties/${bountyId}/comments/${commentId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ content: "Unauthorized update" }),
          headers: { "Content-Type": "application/json" },
        }
      ) as any;
      const response = await UpdateComment(request, {
        params: Promise.resolve({ id: bountyId, commentId }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/bounties/[id]/comments/[commentId]", () => {
    let commentId: string;

    beforeEach(async () => {
      const comment = await db.bountyComment.create({
        data: {
          bountyId,
          authorPubkey: commenterPubkey,
          content: "Comment to be deleted",
        },
      });
      commentId = comment.id;
    });

    it("should delete own comment", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/comments/${commentId}`,
        commenterPubkey,
        { method: "DELETE" }
      );

      const response = await DeleteComment(request, {
        params: Promise.resolve({ id: bountyId, commentId }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);

      // Verify comment is soft deleted (deletedAt is set)
      const deletedComment = await db.bountyComment.findUnique({
        where: { id: commentId },
      });
      expect(deletedComment).not.toBeNull();
      expect(deletedComment!.deletedAt).not.toBeNull();
    });

    it("should allow bounty owner to delete any comment", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/comments/${commentId}`,
        ownerPubkey,
        { method: "DELETE" }
      );

      const response = await DeleteComment(request, {
        params: Promise.resolve({ id: bountyId, commentId }),
      });

      expect(response.status).toBe(200);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(true);
    });

    it("should reject delete from non-author/non-owner", async () => {
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/comments/${commentId}`,
        otherPubkey,
        { method: "DELETE" }
      );

      const response = await DeleteComment(request, {
        params: Promise.resolve({ id: bountyId, commentId }),
      });

      expect(response.status).toBe(403);
      const data: any = await parseResponse(response);
      expect(data.success).toBe(false);
    });

    it("should return 404 for non-existent comment", async () => {
      const fakeCommentId = "cmh0000000000000000000000";
      const request = createAuthedRequest(
        `http://localhost/api/bounties/${bountyId}/comments/${fakeCommentId}`,
        commenterPubkey,
        { method: "DELETE" }
      );

      const response = await DeleteComment(request, {
        params: Promise.resolve({ id: bountyId, commentId: fakeCommentId }),
      });

      expect(response.status).toBe(404);
    });

    it("should require authentication", async () => {
      const request = new Request(
        `http://localhost/api/bounties/${bountyId}/comments/${commentId}`,
        { method: "DELETE" }
      ) as any;
      const response = await DeleteComment(request, {
        params: Promise.resolve({ id: bountyId, commentId }),
      });

      expect(response.status).toBe(401);
    });
  });
});
