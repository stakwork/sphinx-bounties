# API Response Standards - Tests

## Response Builders
- `apiSuccess` - returns correct structure, status, and metadata
- `apiError` - returns correct error structure and status codes
- `apiPaginated` - calculates pagination meta correctly (totalPages, hasMore)
- `apiCreated` - returns 201 status
- `apiNoContent` - returns 204 with no body

## Validation Utilities
- `validateBody` - parses valid JSON body with Zod schema
- `validateBody` - returns validation error for invalid body
- `validateBody` - returns bad request error for malformed JSON
- `validateQuery` - parses valid query params with Zod schema
- `validateQuery` - returns validation error for invalid params
- `paginationSchema` - defaults to page=1, pageSize=20
- `paginationSchema` - enforces min/max constraints
- `sortSchema` - defaults to sortOrder=desc
- `idSchema` - validates UUID format
- `pubkeySchema` - validates pubkey length (64-66 chars)

## Pagination Helpers
- `getPaginationValues` - calculates correct skip/take for Prisma
- `getPaginationValues` - handles default values (page=1, pageSize=20)
- `getPaginationMeta` - calculates totalPages correctly
- `getPaginationMeta` - sets hasMore=true when more pages exist
- `getPaginationMeta` - sets hasMore=false on last page

## Integration Tests
- `/api/bounties` GET - returns paginated bounties with filters
- `/api/bounties` GET - validates query params and returns 422 on invalid input
- `/api/bounties` GET - filters by status, workspace, assignee, creator
- `/api/bounties` GET - searches by title and description
- `/api/bounties` GET - sorts correctly by specified field
- `/api/bounties` GET - returns 500 on database error
