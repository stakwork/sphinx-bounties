# Test Coverage Documentation

## Phase 1: Project Setup & Configuration
### Integration Tests
- Next.js app starts successfully
- Environment variables load correctly
- Database connection established
- Build completes without errors

## Phase 2: Database Schema & Models
### Prisma Schema Tests
- User model - creates user with required fields
- User model - enforces unique pubkey constraint
- Workspace model - creates workspace with valid data
- Workspace model - enforces unique name per owner
- Bounty model - creates bounty with all fields
- Bounty model - defaults status to DRAFT
- Bounty model - enforces valid status enum values
- BountyProof model - links to bounty correctly
- BountyProof model - enforces unique bounty per user
- Relations - User to Workspaces (one-to-many)
- Relations - Workspace to Bounties (one-to-many)
- Relations - User to assigned Bounties (one-to-many)
- Relations - Bounty to BountyProofs (one-to-many)

## Phase 3: Core Services & Error Handling
### Error Class Tests (src/lib/error-constants.ts)
- ValidationError - creates with 422 status
- NotFoundError - creates with 404 status
- UnauthorizedError - creates with 401 status
- ForbiddenError - creates with 403 status
- ConflictError - creates with 409 status
- InternalServerError - creates with 500 status
- All errors - include correct message and code

### API Error Handler Tests (src/lib/api-error.ts)
- handleApiError - converts ValidationError to correct response
- handleApiError - converts NotFoundError to correct response
- handleApiError - converts UnauthorizedError to correct response
- handleApiError - converts unknown errors to 500
- handleApiError - logs error details for debugging
- handleApiError - includes stack trace in development
- handleApiError - sanitizes stack trace in production

## Phase 4: UI Foundation & Component Library
### UI Component Tests
- Button - renders with all variants (default, destructive, outline, ghost)
- Button - handles click events
- Button - shows loading state correctly
- Card - renders with header, content, footer
- Form components - render with correct labels
- FormField - displays validation errors
- FormField - updates field value on change
- Dialog - opens and closes correctly
- Sheet - slides in from correct side
- Tabs - switches between tabs correctly

### Toast Tests (src/lib/toast.ts)
- showSuccess - displays success toast with correct styling
- showError - displays error toast with correct styling
- showInfo - displays info toast with correct styling
- Toast - auto-dismisses after timeout
- Toast - can be manually dismissed

## Phase 5: Code Organization & Constants
### Constants Tests
- API_ROUTES - exports all route constants
- APP_ROUTES - exports all app route constants
- SITE_CONFIG - contains required metadata
- Colors configuration - exports CSS variable mappings
- Fonts configuration - loads fonts correctly

## Phase 6: Form Handling & Validation
### Validation Schema Tests (src/validations/*.schema.ts)
#### Bounty Schemas
- createBountySchema - validates required fields (title, description, amount, workspaceId)
- createBountySchema - rejects invalid amount (negative, zero)
- createBountySchema - validates optional deadline (future date)
- createBountySchema - validates githubIssueUrl format
- createBountySchema - validates tags array (max 10)
- createBountySchema - validates programmingLanguages array
- updateBountySchema - allows partial updates
- updateBountySchema - validates status transitions
- submitProofSchema - validates bountyId and proofUrl
- submitProofSchema - requires description
- reviewProofSchema - validates approved boolean
- reviewProofSchema - validates feedback text

#### Workspace Schemas
- createWorkspaceSchema - validates name (3-50 chars)
- createWorkspaceSchema - validates description (max 500 chars)
- createWorkspaceSchema - validates optional githubOrg
- updateWorkspaceSchema - allows partial updates
- addMemberSchema - validates pubkey format
- addMemberSchema - validates role enum

#### User Schemas
- createUserSchema - validates pubkey format (64-66 chars hex)
- createUserSchema - validates username (3-30 chars, alphanumeric)
- createUserSchema - validates email format
- updateUserSchema - allows partial updates
- updateProfileSchema - validates bio length
- updateProfileSchema - validates avatar URL format

#### Auth Schemas
- loginSchema - validates pubkey format
- signupSchema - validates all required fields
- verifySignatureSchema - validates signature hex format

### Form Component Tests (src/components/forms/*.tsx)
- FormInput - renders input with label
- FormInput - displays error message when invalid
- FormInput - updates value on change
- FormTextarea - renders textarea with correct rows
- FormTextarea - handles multiline input
- FormSelect - renders options correctly
- FormSelect - updates selected value
- FormTagInput - adds tag on Enter
- FormTagInput - removes tag on click
- FormTagInput - enforces maxTags limit
- FormDatePicker - opens calendar on click
- FormDatePicker - selects date correctly
- FormDatePicker - disables past dates when disablePast=true
- FormAmountInput - formats number with commas
- FormAmountInput - handles sats conversion

### Form Hook Tests (src/hooks/*.ts)
- useFormWithToast - initializes form with Zod resolver
- useFormWithToast - shows success toast on successful submit
- useFormWithToast - shows error toast on failed submit
- useServerAction - tracks loading state
- useServerAction - handles success response
- useServerAction - handles error response
- useServerAction - can be reset
- useFormErrors - sets field-level errors
- useFormErrors - sets form-level errors
- useFormErrors - clears errors
- useAsyncAction - uses useTransition for pending state
- useAsyncAction - executes async action
- useOptimisticUpdate - updates optimistically
- useOptimisticUpdate - rolls back on error

### Server Action Tests (src/actions/bounty-simple.actions.ts)
- createBountyAction - validates FormData
- createBountyAction - creates bounty in database
- createBountyAction - returns success result
- createBountyAction - returns error on validation failure
- createBountyAction - returns error on database failure
- updateBountyAction - validates bounty exists
- updateBountyAction - updates bounty fields
- updateBountyAction - revalidates path after update
- assignBountyAction - validates bounty and assignee exist
- assignBountyAction - updates bounty assignee
- submitProofAction - validates bounty exists
- submitProofAction - creates BountyProof record
- submitProofAction - prevents duplicate proof submission
- reviewProofAction - validates proof exists
- reviewProofAction - updates proof status
- reviewProofAction - updates bounty status on approval

### Form Example Tests (src/components/forms/bounty/*.tsx)
- CreateBountyForm - renders all fields
- CreateBountyForm - submits valid data
- CreateBountyForm - displays validation errors
- CreateBountyForm - shows loading state during submit
- CreateBountyForm - navigates on success
- UpdateBountyForm - pre-populates fields with bounty data
- UpdateBountyForm - handles null values for optional fields
- UpdateBountyForm - submits partial updates
- SubmitProofForm - validates proof URL format
- SubmitProofForm - requires description
- ReviewProofForm - handles approve action
- ReviewProofForm - handles reject action
- ReviewProofForm - validates feedback is provided

## Phase 7: API Routes & Server-Side Logic (TODO)
### API Response Builders
- `apiSuccess` - returns correct structure, status, and metadata
- `apiError` - returns correct error structure and status codes
- `apiPaginated` - calculates pagination meta correctly (totalPages, hasMore)
- `apiCreated` - returns 201 status
- `apiNoContent` - returns 204 with no body

### Validation Utilities
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

### Pagination Helpers
- `getPaginationValues` - calculates correct skip/take for Prisma
- `getPaginationValues` - handles default values (page=1, pageSize=20)
- `getPaginationMeta` - calculates totalPages correctly
- `getPaginationMeta` - sets hasMore=true when more pages exist
- `getPaginationMeta` - sets hasMore=false on last page

### Integration Tests
- `/api/bounties` GET - returns paginated bounties with filters
- `/api/bounties` GET - validates query params and returns 422 on invalid input
- `/api/bounties` GET - filters by status, workspace, assignee, creator
- `/api/bounties` GET - searches by title and description
- `/api/bounties` GET - sorts correctly by specified field
- `/api/bounties` GET - returns 500 on database error

## Phase 7: Workspace Forms & Actions (CURRENT)

### Workspace Server Action Tests (src/actions/workspace.actions.ts)

#### createWorkspaceAction
- validates required name field
- creates workspace with all provided fields
- creates owner membership automatically
- returns success result with workspace data
- returns ConflictError for duplicate workspace name
- validates URL formats for avatarUrl, websiteUrl, githubUrl
- returns ValidationError on invalid data
- revalidates /workspaces path

#### updateWorkspaceAction
- validates workspace exists before update
- checks user has admin or owner role
- updates workspace fields (name, description, mission, URLs)
- handles partial updates (only provided fields)
- handles null values for optional fields
- returns NotFoundError for non-existent workspace
- returns ForbiddenError for non-admin users
- returns ConflictError when updating to duplicate name
- revalidates workspace paths after update

#### deleteWorkspaceAction
- validates workspace exists before delete
- checks user is workspace owner
- soft deletes workspace (sets deletedAt)
- prevents deletion with active bounties (OPEN, ASSIGNED, IN_REVIEW)
- returns NotFoundError for non-existent workspace
- returns ForbiddenError for non-owner users
- returns ConflictError when active bounties exist
- revalidates /workspaces path

#### addMemberAction
- validates required userPubkey field
- validates user exists in database
- checks requester has admin or owner role
- creates workspace membership with specified role
- defaults to CONTRIBUTOR role if not specified
- returns NotFoundError for non-existent workspace
- returns NotFoundError for non-existent user
- returns ForbiddenError for non-admin users
- returns ConflictError for existing members
- revalidates workspace member paths

#### updateMemberRoleAction
- validates required role field
- validates membership exists in workspace
- checks requester is workspace owner
- updates member role successfully
- prevents changing owner's role
- returns NotFoundError for non-existent membership
- returns ForbiddenError for non-owner users
- revalidates workspace member paths

#### removeMemberAction
- validates membership exists in workspace
- checks requester has admin or owner role
- deletes workspace membership
- prevents removing workspace owner
- returns NotFoundError for non-existent membership
- returns ForbiddenError for non-admin users
- revalidates workspace member paths

### Workspace Form Component Tests (src/components/forms/workspace/*.tsx)

#### CreateWorkspaceForm
- renders all input fields (name, description, mission, URLs)
- validates required name field
- validates description length (max 120 chars)
- validates mission length (20-500 chars)
- validates URL formats (avatar, website, GitHub)
- validates GitHub URL pattern (must be github.com org URL)
- shows validation errors inline
- submits valid data to createWorkspaceAction
- shows loading state during submission
- displays success toast on successful creation
- displays error toast on failure
- navigates to workspace page on success
- calls onSuccess callback when provided
- handles onCancel callback

#### UpdateWorkspaceForm
- pre-populates fields with workspace data
- handles null values for optional fields (description, mission, URLs)
- validates updated name is unique
- validates field length constraints
- validates URL formats
- allows partial updates (only changed fields)
- shows loading state during submission
- displays success toast on update
- displays error toast on failure
- calls onSuccess callback when provided
- handles onCancel callback

#### AddMemberForm
- renders pubkey input, role select, message input
- validates pubkey format (66-char hex)
- validates pubkey length
- provides role options (Contributor, Admin, Viewer)
- defaults to Contributor role
- allows optional welcome message
- shows validation errors inline
- submits valid data to addMemberAction
- shows loading state during submission
- displays success toast on success
- displays error toast on failure
- resets form after successful add
- calls onSuccess callback when provided
- handles onCancel callback

#### MemberList
- renders list of workspace members
- displays member avatar, username, alias, role badge
- shows "Change Role" button for non-owner members (owner only)
- shows "Remove" button for non-owner members (admin/owner)
- hides action buttons for current user
- hides action buttons for owner member
- opens role update dialog on "Change Role" click
- provides role select dropdown in dialog
- submits role update to updateMemberRoleAction
- shows loading state in update dialog
- displays success toast on role update
- displays error toast on update failure
- opens remove confirmation dialog on "Remove" click
- shows warning message in remove dialog
- submits removal to removeMemberAction
- shows loading state in remove dialog
- displays success toast on removal
- displays error toast on removal failure
- calls onUpdate callback after successful actions
- closes dialogs on cancel

### Integration Tests

#### Workspace Creation Flow
- user creates workspace with valid data
- owner membership is automatically created
- workspace appears in workspace list
- user can navigate to workspace detail page

#### Workspace Update Flow
- admin updates workspace details
- changes are reflected immediately
- non-admin cannot access update form
- validation prevents invalid updates

#### Member Management Flow
- admin adds new member with contributor role
- member appears in member list
- owner updates member role to admin
- admin removes member successfully
- cannot remove workspace owner
- cannot change owner's role
- non-admin cannot manage members
