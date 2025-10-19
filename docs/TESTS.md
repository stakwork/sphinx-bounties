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

### Validation Schema Tests (src/validations/\*.schema.ts)

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

### Form Component Tests (src/components/forms/\*.tsx)

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

### Form Hook Tests (src/hooks/\*.ts)

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

### Form Example Tests (src/components/forms/bounty/\*.tsx)

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

### Workspace Form Component Tests (src/components/forms/workspace/\*.tsx)

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

## Phase 8: User Forms & Actions

### User Server Action Tests (src/actions/user.actions.ts)

#### createUserAction

- validates required pubkey field (64-66 chars hex)
- validates required username field (3-30 chars, alphanumeric)
- validates optional email format
- creates user with all provided fields
- returns success result with user data
- returns ConflictError for duplicate pubkey
- returns ConflictError for duplicate username
- returns ConflictError for duplicate email
- validates URL formats for avatarUrl, websiteUrl
- validates GitHub/Twitter handles (alphanumeric, underscore)
- validates bio length (max 500 chars)
- handles null values for optional fields
- returns ValidationError on invalid data
- revalidates /users path

#### updateProfileAction

- validates user exists before update
- checks current user matches profile being updated
- updates profile fields (alias, bio, avatarUrl, etc.)
- handles partial updates (only provided fields)
- handles null values for optional fields
- validates alias length (2-50 chars)
- validates bio length (max 500 chars)
- validates URL formats
- returns NotFoundError for non-existent user
- returns ForbiddenError when updating other user's profile
- returns ValidationError on invalid data
- revalidates user profile paths after update

#### updateSocialLinksAction

- validates user exists before update
- checks current user matches profile being updated
- updates social links (GitHub, Twitter, Discord, Telegram)
- validates GitHub handle format
- validates Twitter handle format
- resets githubVerified to false when githubHandle changes
- resets twitterVerified to false when twitterHandle changes
- preserves verification status when handle unchanged
- handles null values for handles
- returns NotFoundError for non-existent user
- returns ForbiddenError when updating other user's links
- returns ValidationError on invalid data
- revalidates user profile paths after update

#### updateNotificationSettingsAction

- validates user exists before update
- checks current user matches profile being updated
- updates notification settings (emailNotifications, pushNotifications)
- handles boolean values correctly
- returns NotFoundError for non-existent user
- returns ForbiddenError when updating other user's settings
- revalidates user profile paths after update

#### deleteUserAction

- validates user exists before delete
- checks current user matches profile being deleted
- prevents deletion with assigned bounties
- prevents deletion with created workspaces
- soft deletes user (sets deletedAt)
- returns NotFoundError for non-existent user
- returns ForbiddenError when deleting other user's account
- returns ConflictError when active bounties exist
- returns ConflictError when created workspaces exist
- revalidates /users path

#### verifyGithubAction

- validates user exists
- checks current user matches profile being verified
- validates GitHub code parameter
- TODO: implements OAuth verification flow
- sets githubVerified to true on success
- returns NotFoundError for non-existent user
- returns ForbiddenError when verifying other user's GitHub
- returns ValidationError on invalid verification code
- revalidates user profile paths after verification

#### verifyTwitterAction

- validates user exists
- checks current user matches profile being verified
- validates Twitter code parameter
- TODO: implements OAuth verification flow
- sets twitterVerified to true on success
- returns NotFoundError for non-existent user
- returns ForbiddenError when verifying other user's Twitter
- returns ValidationError on invalid verification code
- revalidates user profile paths after verification

### User Form Component Tests (src/components/forms/user/\*.tsx)

#### CreateUserForm

- renders all input fields (pubkey, username, email, alias, bio)
- validates required pubkey field (64-66 chars hex)
- validates required username field (3-30 chars alphanumeric)
- validates optional email format
- validates alias length (2-50 chars)
- validates bio length (max 500 chars)
- displays pubkey as disabled/readonly input
- shows validation errors inline
- submits valid data to createUserAction
- shows loading state during submission
- displays success toast on successful creation
- displays error toast on failure (duplicate username, etc.)
- navigates to user profile page on success
- calls onSuccess callback when provided
- handles onCancel callback

#### UpdateProfileForm

- pre-populates fields with user profile data
- handles null values for optional fields (alias, bio, avatarUrl, etc.)
- validates alias length (2-50 chars)
- validates bio length (max 500 chars)
- validates avatarUrl and websiteUrl formats
- validates location and skills as comma-separated lists
- allows partial updates (only changed fields)
- shows loading state during submission
- displays success toast on update
- displays error toast on failure
- calls onSuccess callback when provided
- handles onCancel callback

#### SocialLinksForm

- pre-populates fields with social links data
- handles null values for optional handles
- validates GitHub handle format (alphanumeric, underscore)
- validates Twitter handle format (alphanumeric, underscore)
- validates Discord tag format
- validates Telegram handle format
- displays verification badges for verified accounts
- shows green checkmark badge when githubVerified is true
- shows green checkmark badge when twitterVerified is true
- shows "Verify" button for unverified GitHub account
- shows "Verify" button for unverified Twitter account
- calls verifyGithubAction on "Verify GitHub" click
- calls verifyTwitterAction on "Verify Twitter" click
- shows loading state during verification
- displays success toast on verification success
- displays info toast indicating OAuth placeholder
- displays warning badge when handle changed (verification reset)
- shows loading state during submission
- displays success toast on update
- displays error toast on failure
- calls onSuccess callback when provided
- handles onCancel callback

#### DeleteAccountForm

- renders account deletion confirmation UI
- displays user email/pubkey for verification
- requires explicit confirmation text input
- validates confirmation text matches expected value
- shows danger styling (red theme, warning icons)
- displays warning message about permanent deletion
- lists consequences of deletion (data loss, cannot undo)
- disables submit button until confirmation entered
- shows loading state during deletion
- submits deletion to deleteUserAction
- displays success toast on deletion
- displays error toast on failure (active bounties, workspaces)
- navigates to home page on successful deletion
- calls onSuccess callback when provided
- handles onCancel callback

### User Integration Tests

#### User Creation Flow

- user creates account with pubkey and username
- profile is created with default settings
- user appears in user directory
- user can navigate to profile page
- validation prevents duplicate pubkey
- validation prevents duplicate username

#### Profile Update Flow

- user updates profile information (alias, bio, avatar)
- changes are reflected immediately on profile page
- validation prevents invalid URLs
- validation prevents overly long bio
- cannot update another user's profile

#### Social Links Management Flow

- user adds GitHub handle without verification
- user adds Twitter handle without verification
- handles appear on profile page
- user clicks "Verify GitHub" button
- OAuth placeholder message is displayed
- verification badge shown for verified accounts
- changing handle resets verification status
- verification badge removed when handle changed

#### Notification Settings Flow

- user updates email notification preference
- user updates push notification preference
- settings are persisted to database
- cannot update another user's settings

#### Account Deletion Flow

- user initiates account deletion
- confirmation dialog displays warnings
- user must type confirmation text
- deletion fails when user has active bounties
- deletion fails when user has created workspaces
- deletion succeeds when no dependencies exist
- user is redirected to home page
- account marked as deleted in database
- cannot delete another user's account

## Phase 9: Data Fetching & State Management

### Service Query Function Tests (src/services/\*/queries.ts)

#### Bounty Query Tests (bountyQueries)

- getAll - returns paginated bounties with correct structure
- getAll - filters by status correctly
- getAll - filters by workspaceId correctly
- getAll - filters by assigneePubkey correctly
- getAll - filters by creatorPubkey correctly
- getAll - searches by title and description
- getAll - filters by tags (hasSome)
- getAll - filters by codingLanguages (hasSome)
- getAll - sorts by createdAt, updatedAt, amount, deadline
- getAll - paginates correctly (skip, take)
- getAll - returns correct pagination metadata
- getById - returns bounty with full relations
- getById - includes workspace, assignee, creator
- getById - includes proofs with submitter
- getById - returns null for non-existent bounty
- getById - excludes deleted bounties
- getByWorkspaceId - delegates to getAll with filter
- getByAssigneePubkey - delegates to getAll with filter
- getByCreatorPubkey - delegates to getAll with filter
- getProofsByBountyId - returns proofs ordered by createdAt desc
- getProofsByBountyId - includes submitter details
- getProofById - returns proof with bounty and submitter
- getProofById - returns null for non-existent proof

#### Workspace Query Tests (workspaceQueries)

- getAll - returns paginated workspaces with correct structure
- getAll - filters by ownerPubkey correctly
- getAll - searches by name, description, mission
- getAll - filters by hasActiveBounties correctly
- getAll - sorts by createdAt, updatedAt, name
- getAll - includes owner details
- getAll - includes member and bounty counts
- getAll - excludes deleted workspaces
- getById - returns workspace with full relations
- getById - includes owner, members, budget
- getById - includes bounty count
- getById - returns null for non-existent workspace
- getByOwnerPubkey - delegates to getAll with filter
- getByMemberPubkey - returns workspaces where user is member
- getByMemberPubkey - includes workspace details
- getByMemberPubkey - filters out deleted workspaces
- getMembersByWorkspaceId - returns members ordered by role, joinedAt
- getMembersByWorkspaceId - includes user details
- getUserRole - returns user role in workspace
- getUserRole - returns null if not a member
- isAdminOrOwner - returns true for admin
- isAdminOrOwner - returns true for owner
- isAdminOrOwner - returns false for other roles
- getBudget - returns workspace budget
- getBudget - returns null if no budget exists

#### User Query Tests (userQueries)

- getAll - returns paginated users with correct structure
- getAll - filters by search (username, alias, description)
- getAll - filters by githubVerified correctly
- getAll - filters by twitterVerified correctly
- getAll - sorts by createdAt, updatedAt, username, lastLogin
- getAll - excludes deleted users
- getByPubkey - returns user with count relations
- getByPubkey - includes workspace, bounty, proof counts
- getByPubkey - returns null for non-existent user
- getByUsername - returns user with count relations
- getByUsername - returns null for non-existent username
- getProfileByPubkey - returns user with detailed stats
- getProfileByPubkey - calculates workspacesOwned correctly
- getProfileByPubkey - calculates bountiesCreated correctly
- getProfileByPubkey - calculates bountiesCompleted correctly
- getProfileByPubkey - calculates proofsAccepted correctly
- search - delegates to getAll with search filter
- getGithubVerified - filters by githubVerified=true
- getTwitterVerified - filters by twitterVerified=true
- isUsernameAvailable - returns true when available
- isUsernameAvailable - returns false when taken
- isUsernameAvailable - excludes specific pubkey correctly
- existsByPubkey - returns true when exists
- existsByPubkey - returns false when not exists

### React Query Hook Tests (src/hooks/queries/\*.ts)

#### Bounty Query Hook Tests

- useGetBounties - fetches bounties with filters
- useGetBounties - uses correct query key
- useGetBounties - enables query by default
- useGetBounty - fetches single bounty by id
- useGetBounty - disables when id not provided
- useGetBountiesByWorkspace - fetches workspace bounties
- useGetBountiesByAssignee - fetches assigned bounties
- useGetBountiesByCreator - fetches created bounties
- useGetBountyProofs - fetches proofs for bounty
- useGetProof - fetches single proof by id
- useCreateBounty - calls createBountyAction
- useCreateBounty - invalidates bounty lists on success
- useCreateBounty - invalidates workspace queries on success
- useCreateBounty - shows success toast
- useCreateBounty - shows error toast on failure
- useUpdateBounty - calls updateBountyAction
- useUpdateBounty - invalidates specific bounty on success
- useUpdateBounty - invalidates lists on success
- useAssignBounty - calls assignBountyAction
- useAssignBounty - invalidates bounty and assignee queries
- useSubmitProof - calls submitProofAction
- useSubmitProof - invalidates bounty and proof queries
- useReviewProof - calls reviewProofAction
- useReviewProof - invalidates proof and bounty queries

#### Workspace Query Hook Tests

- useGetWorkspaces - fetches workspaces with filters
- useGetWorkspaces - uses correct query key
- useGetWorkspace - fetches single workspace by id
- useGetWorkspace - disables when id not provided
- useGetWorkspacesByOwner - fetches owned workspaces
- useGetWorkspacesByMember - fetches member workspaces
- useGetWorkspaceMembers - fetches workspace members
- useGetUserRole - fetches user role in workspace
- useGetWorkspaceBudget - fetches workspace budget
- useCreateWorkspace - calls createWorkspaceAction
- useCreateWorkspace - invalidates workspace lists on success
- useCreateWorkspace - shows success toast
- useUpdateWorkspace - calls updateWorkspaceAction
- useUpdateWorkspace - invalidates specific workspace
- useUpdateWorkspace - invalidates lists and owner queries
- useDeleteWorkspace - calls deleteWorkspaceAction
- useDeleteWorkspace - removes workspace from cache
- useDeleteWorkspace - invalidates all workspace queries
- useAddMember - calls addMemberAction
- useAddMember - invalidates workspace and member queries
- useUpdateMemberRole - calls updateMemberRoleAction
- useUpdateMemberRole - invalidates workspace members
- useRemoveMember - calls removeMemberAction
- useRemoveMember - invalidates workspace and member queries

#### User Query Hook Tests

- useGetUsers - fetches users with filters
- useGetUsers - uses correct query key
- useGetUser - fetches user by pubkey
- useGetUser - disables when pubkey not provided
- useGetUserByUsername - fetches user by username
- useGetUserProfile - fetches profile with stats
- useSearchUsers - searches users by query
- useSearchUsers - requires minimum 2 chars
- useGetGithubVerifiedUsers - fetches GitHub verified users
- useGetTwitterVerifiedUsers - fetches Twitter verified users
- useCheckUsernameAvailability - checks username availability
- useCheckUsernameAvailability - requires minimum 3 chars
- useCheckUsernameAvailability - has 30 second stale time
- useCreateUser - calls createUserAction
- useCreateUser - invalidates user lists on success
- useCreateUser - invalidates username checks
- useUpdateProfile - calls updateProfileAction
- useUpdateProfile - invalidates user queries on success
- useUpdateProfile - invalidates username queries if changed
- useUpdateSocialLinks - calls updateSocialLinksAction
- useUpdateSocialLinks - invalidates verified user lists
- useUpdateNotificationSettings - calls updateNotificationSettingsAction
- useDeleteUser - calls deleteUserAction
- useDeleteUser - removes user from cache
- useDeleteUser - invalidates all user lists
- useVerifyGithub - calls verifyGithubAction with FormData
- useVerifyGithub - invalidates user and verified lists
- useVerifyTwitter - calls verifyTwitterAction with FormData
- useVerifyTwitter - invalidates user and verified lists

### Cache Management Tests

#### Query Key Structure

- bountyKeys - generates correct hierarchical keys
- workspaceKeys - generates correct hierarchical keys
- userKeys - generates correct hierarchical keys
- query keys include all relevant parameters

#### Cache Invalidation

- mutations invalidate related query keys
- specific item updates invalidate detail queries
- creates invalidate all list queries
- updates invalidate specific and list queries
- deletes remove queries and invalidate lists
- related entity mutations trigger cross-invalidation

### Integration Tests

#### Data Fetching Flow

- fetch bounties list with pagination
- apply filters and see updated results
- change sort order and see reordered results
- navigate to detail page and see cached data
- edit bounty and see optimistic update
- see toast notification on success

#### Cache Behavior

- initial fetch populates cache
- subsequent fetches use cached data
- stale data refetches in background
- manual refetch updates cache immediately
- mutations invalidate correct queries
- pagination maintains separate cache entries

#### Error Handling

- server errors show error toast
- validation errors display properly
- network errors handled gracefully
- retry logic works as configured
- failed mutations don't corrupt cache

## Phase 10: Mutation Hooks & Optimistic Updates (TODO)

### Bounty Mutation Hook Tests

#### useCreateBounty

- calls createBountyAction with form data
- invalidates bounty list queries on success
- invalidates workspace bounty queries on success
- shows success toast with bounty title
- shows error toast on failure
- handles loading state correctly
- onSuccess callback receives new bounty data
- onError callback receives error details

#### useUpdateBounty

- calls updateBountyAction with bounty id and updates
- invalidates specific bounty query on success
- invalidates bounty list queries on success
- invalidates workspace bounty queries if workspace changed
- shows success toast
- shows error toast on validation/permission failure
- applies optimistic update before server response
- rolls back optimistic update on error
- handles concurrent updates correctly

#### useAssignBounty

- calls assignBountyAction with bounty id and assignee pubkey
- invalidates bounty detail query on success
- invalidates assignee's bounty list on success
- invalidates workspace bounty count on success
- shows success toast with assignee username
- shows error toast on failure
- applies optimistic update to bounty status
- rolls back if assignment fails

#### useSubmitProof

- calls submitProofAction with bounty id and proof data
- invalidates bounty proofs query on success
- invalidates bounty detail to show new proof count
- shows success toast
- shows error toast on duplicate submission
- validates proof URL format before submission
- handles file upload if proof type is file-based

#### useReviewProof

- calls reviewProofAction with proof id and decision
- invalidates proof detail query on success
- invalidates bounty detail if status changed (approved)
- invalidates bounty list if completed
- shows success toast with decision (approved/rejected)
- shows error toast on permission failure
- applies optimistic update to proof status
- updates bounty status optimistically if approved

### Workspace Mutation Hook Tests

#### useCreateWorkspace

- calls createWorkspaceAction with form data
- invalidates workspace list queries on success
- invalidates user's owned workspace queries on success
- shows success toast with workspace name
- navigates to new workspace page on success
- shows error toast on duplicate name
- handles loading state correctly
- onSuccess callback receives new workspace data

#### useUpdateWorkspace

- calls updateWorkspaceAction with workspace id and updates
- invalidates specific workspace query on success
- invalidates workspace list queries on success
- shows success toast
- shows error toast on permission failure
- applies optimistic update before server response
- rolls back optimistic update on error
- revalidates cached workspace details

#### useDeleteWorkspace

- calls deleteWorkspaceAction with workspace id
- removes workspace from all queries on success
- invalidates workspace list queries
- invalidates owner's workspace queries
- shows success toast
- shows error toast when active bounties exist
- navigates away from deleted workspace page
- confirms deletion before executing
- cannot be undone after success

#### useAddMember

- calls addMemberAction with workspace id, user pubkey, and role
- invalidates workspace members query on success
- invalidates workspace detail to update member count
- shows success toast with new member username
- shows error toast on duplicate member
- shows error toast if user not found
- validates pubkey format before submission
- sends optional welcome message

#### useUpdateMemberRole

- calls updateMemberRoleAction with membership id and new role
- invalidates workspace members query on success
- shows success toast with role change
- shows error toast on permission failure
- applies optimistic update to member role
- rolls back if update fails
- prevents changing owner's role
- validates role is valid enum value

#### useRemoveMember

- calls removeMemberAction with membership id
- invalidates workspace members query on success
- invalidates workspace detail to update member count
- shows success toast with removed member username
- shows error toast on permission failure
- removes member from cached list optimistically
- rolls back if removal fails
- prevents removing workspace owner
- confirms removal before executing

### User Mutation Hook Tests

#### useCreateUser

- calls createUserAction with form data
- invalidates user list queries on success
- invalidates username availability checks on success
- shows success toast with username
- navigates to user profile page on success
- shows error toast on duplicate pubkey/username
- validates pubkey format before submission
- handles loading state correctly

#### useUpdateProfile

- calls updateProfileAction with user pubkey and updates
- invalidates user detail query on success
- invalidates user list queries on success
- invalidates username queries if username changed
- shows success toast
- shows error toast on validation failure
- applies optimistic update before server response
- rolls back optimistic update on error
- handles partial updates correctly

#### useUpdateSocialLinks

- calls updateSocialLinksAction with social handles
- invalidates user detail query on success
- invalidates verified user lists if verification affected
- shows success toast
- resets verification status if handle changed
- shows warning toast when verification will be reset
- validates handle formats before submission

#### useUpdateNotificationSettings

- calls updateNotificationSettingsAction with settings
- invalidates user detail query on success
- shows success toast
- applies optimistic update to settings
- rolls back if update fails
- toggles work immediately in UI

#### useDeleteUser

- calls deleteUserAction with user pubkey
- removes user from all queries on success
- invalidates all user list queries
- shows success toast
- shows error toast when active bounties/workspaces exist
- navigates to home page after deletion
- confirms deletion before executing
- requires confirmation text input
- logs user out after successful deletion

#### useVerifyGithub / useVerifyTwitter

- calls verify action with OAuth code
- invalidates user detail query on success
- invalidates verified user lists on success
- shows success toast with verification badge
- shows error toast on invalid code
- opens OAuth flow in popup window
- handles OAuth callback correctly
- updates verification badge immediately
- validates OAuth state parameter

### Optimistic Update Tests

#### Optimistic Update Pattern

- updates local cache before server response
- shows changes immediately in UI
- rolls back changes on server error
- displays error toast on rollback
- preserves user input during optimistic state
- handles race conditions correctly
- works with pagination correctly
- maintains referential equality when possible

#### useOptimisticUpdate Hook Tests

- applies optimistic update to query data
- reverts on mutation error
- calls onError with original data
- calls onSuccess with server data
- handles undefined query data gracefully
- works with array data (lists)
- works with object data (details)
- preserves optimistic state during loading

#### Optimistic UI Patterns

- bounty status changes show immediately
- member role changes show immediately
- like/favorite actions show immediately
- proof submission shows in list immediately
- form submissions disable during optimistic state
- loading indicators show during server round-trip
- error states revert and show clear message

## Phase 11: Custom Hook Tests (TODO)

### Form Hook Tests

#### useFormWithToast

- initializes form with Zod resolver
- shows success toast on successful submit
- shows error toast on failed submit with error message
- shows error toast on validation failure
- handles loading state during submission
- resets form after successful submit (optional)
- preserves form values on error
- calls onSuccess callback with result data
- calls onError callback with error details

#### useFormErrors

- sets field-level errors from server response
- sets form-level errors from server response
- clears errors when form field changes
- clears all errors with clearErrors()
- formats Zod validation errors correctly
- formats API error responses correctly
- maps error codes to user-friendly messages

#### useServerAction

- wraps server action with loading state
- tracks isPending during action execution
- returns result data on success
- returns error on failure
- can be reset to initial state
- prevents multiple simultaneous executions
- handles async action errors gracefully

#### useAsyncAction

- uses React useTransition for loading state
- executes async action when called
- returns result or error
- does not block UI during execution
- can be cancelled (if implemented)
- provides isPending state
- handles errors without crashing

### Utility Hook Tests

#### useDebounce

- debounces value changes by specified delay
- returns initial value immediately
- updates value after delay expires
- cancels previous timeout on new change
- cleans up timeout on unmount
- handles rapid changes correctly
- works with primitive and object values

#### useLocalStorage

- reads value from localStorage on mount
- writes value to localStorage on change
- handles JSON serialization correctly
- handles invalid JSON gracefully
- syncs across tabs/windows (storage event)
- returns default value when key doesn't exist
- handles localStorage quota errors

#### useMediaQuery

- returns true when media query matches
- returns false when media query doesn't match
- updates on window resize
- cleans up listener on unmount
- works with standard media queries (min-width, etc.)
- handles invalid media queries gracefully

#### usePagination

- manages page state
- manages pageSize state
- provides goToPage function
- provides nextPage/prevPage functions
- calculates total pages from total items
- calculates hasMore from current page
- prevents going to invalid pages
- resets to page 1 when pageSize changes

#### useFilters

- manages filter state object
- provides setFilter function
- provides clearFilters function
- provides clearFilter function (single)
- serializes filters to URL query params
- deserializes filters from URL query params
- type-safe filter updates
- handles complex filter types (arrays, objects)

### Integration Hook Tests

#### Form + Validation + Toast Integration

- validates form on submit
- shows inline errors for invalid fields
- shows toast on submit success
- shows toast on submit failure
- clears errors when user corrects input
- re-validates on blur after error
- handles server-side validation errors

#### Optimistic Update + Error Handling Integration

- applies optimistic update immediately
- shows success toast on server success
- rolls back and shows error toast on failure
- maintains UI consistency during rollback
- handles network errors gracefully
- retries failed mutations (if configured)

## Phase 12: Component Testing (TODO)

### UI Component Tests (React Testing Library)

#### Button Component

- renders with default variant
- renders with all variant styles (default, destructive, outline, ghost, link)
- renders with all sizes (default, sm, lg, icon)
- handles click events
- shows loading state with spinner
- disables during loading
- forwards ref correctly
- spreads additional props
- renders children correctly
- applies custom className

#### Card Component

- renders Card with children
- renders CardHeader with title
- renders CardContent with content
- renders CardFooter with actions
- applies custom className to all parts
- forwards ref correctly
- composes subcomponents correctly

#### Dialog Component

- renders Dialog closed by default
- opens Dialog when open=true
- closes Dialog on overlay click
- closes Dialog on close button click
- calls onOpenChange with false on close
- prevents closing when onOpenChange not provided
- traps focus inside dialog
- renders DialogTitle for accessibility
- renders DialogDescription for context
- prevents body scroll when open

#### Form Components

- FormField renders with label
- FormField shows error message
- FormField applies error styling when invalid
- FormInput forwards ref correctly
- FormTextarea resizes with content
- FormSelect opens dropdown on click
- FormSelect closes on option select
- FormCheckbox toggles on click
- FormDatePicker opens calendar
- FormDatePicker updates date on select

### Layout Component Tests

#### Header Component

- renders site logo/title
- renders navigation links
- renders user menu when authenticated
- renders login button when not authenticated
- highlights active navigation link
- responsive menu for mobile
- opens mobile menu on hamburger click
- closes mobile menu on link click

#### Footer Component

- renders footer links
- renders social media links
- renders copyright notice
- renders all footer sections

#### Sidebar Component

- renders navigation links
- highlights active link
- collapses on mobile
- expands on toggle
- persists state to localStorage

### Page Component Tests

#### BountyListPage

- renders list of bounties
- shows loading skeleton while fetching
- shows empty state when no bounties
- filters bounties by status
- searches bounties by title
- sorts bounties by amount/date
- paginates results correctly
- navigates to detail on bounty click
- shows "Create Bounty" button if allowed

#### BountyDetailPage

- renders bounty details
- shows workspace info
- shows creator info
- shows assignee info (if assigned)
- shows proof submissions list
- shows "Assign" button if open
- shows "Submit Proof" button if assigned
- shows "Review" button if in review
- shows "Edit" button if creator
- handles non-existent bounty (404)

#### WorkspaceDetailPage

- renders workspace details
- shows owner info
- shows member list
- shows bounty count and list
- shows "Add Member" button if admin
- shows "Edit Workspace" button if admin
- shows "Create Bounty" button if member
- navigates to bounty on click
- handles non-existent workspace (404)

#### UserProfilePage

- renders user profile info
- shows avatar, username, alias, bio
- shows social links
- shows verification badges
- shows stats (workspaces, bounties, proofs)
- shows "Edit Profile" button if own profile
- shows list of created bounties
- shows list of assigned bounties
- handles non-existent user (404)

### Form Page Tests

#### CreateBountyPage

- renders form with all fields
- validates required fields
- submits valid data
- redirects to bounty detail on success
- shows error on validation failure
- requires authentication
- requires workspace membership

#### EditBountyPage

- pre-populates form with bounty data
- validates updates
- submits changes
- redirects to bounty detail on success
- requires authentication
- requires creator/admin permission
- shows 403 if not authorized

#### CreateWorkspacePage

- renders form with all fields
- validates workspace name uniqueness
- submits valid data
- redirects to workspace detail on success
- requires authentication
- creates owner membership automatically

### Error Boundary Tests

- catches render errors in children
- displays fallback UI on error
- logs error details
- provides reset button
- resets error boundary on reset
- does not catch errors in event handlers
- works with async errors in useEffect

### Authentication Flow Tests (TODO - Phase 14)

- redirects to login when not authenticated
- redirects to intended page after login
- persists session across page refreshes
- logs out on session expiration
- clears sensitive data on logout
- handles LNURL-auth flow correctly

## Test Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: Key user flows covered
- **E2E Tests**: Critical paths automated
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Core Web Vitals pass

## Test Infrastructure

### Tools & Libraries

- **Test Runner**: Vitest
- **React Testing**: @testing-library/react
- **E2E Testing**: Playwright
- **Mocking**: vi.mock, MSW (Mock Service Worker)
- **Coverage**: Vitest coverage (c8)

### Test Organization

```
tests/
├── unit/           # Unit tests (functions, hooks, components)
├── integration/    # Integration tests (user flows)
├── e2e/           # End-to-end tests (full scenarios)
└── fixtures/      # Test data and mocks
```

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm test -- tests/unit

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage

# UI mode (interactive)
npm test:ui

# E2E tests
npm run test:e2e
```
