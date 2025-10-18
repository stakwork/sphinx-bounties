import { toast } from '@/lib/toast';

export const authToasts = {
  loginSuccess: () => toast.success('Welcome back!'),
  loginError: () => toast.error('Login failed', 'Please try again'),
  logoutSuccess: () => toast.success('Logged out successfully'),
  unauthorized: () => toast.error('Authentication required', 'Please sign in to continue'),
  sessionExpired: () => toast.warning('Session expired', 'Please sign in again'),
  permissionDenied: () => toast.error('Permission denied', 'You do not have access to this resource'),
};

export const crudToasts = {
  createSuccess: (resource: string) =>
    toast.success(`${resource} created successfully`),
  createError: (resource: string) =>
    toast.error(`Failed to create ${resource}`, 'Please try again'),
  updateSuccess: (resource: string) =>
    toast.success(`${resource} updated successfully`),
  updateError: (resource: string) =>
    toast.error(`Failed to update ${resource}`, 'Please try again'),
  deleteSuccess: (resource: string) =>
    toast.success(`${resource} deleted successfully`),
  deleteError: (resource: string) =>
    toast.error(`Failed to delete ${resource}`, 'Please try again'),
};

export const formToasts = {
  validationError: () =>
    toast.error('Validation failed', 'Please check the form for errors'),
  saveSuccess: () => toast.success('Changes saved'),
  saveError: () => toast.error('Failed to save changes', 'Please try again'),
  discardChanges: () => toast.info('Changes discarded'),
};

export const networkToasts = {
  offline: () => toast.error('You are offline', 'Check your internet connection'),
  reconnected: () => toast.success('Connection restored'),
  timeout: () => toast.error('Request timed out', 'Please try again'),
  serverError: () => toast.error('Server error', 'Please try again later'),
};

export const bountyToasts = {
  created: () => toast.success('Bounty created successfully'),
  updated: () => toast.success('Bounty updated successfully'),
  deleted: () => toast.success('Bounty deleted successfully'),
  assigned: (hunterName: string) =>
    toast.success(`Bounty assigned to ${hunterName}`),
  unassigned: () => toast.success('Bounty unassigned'),
  completed: () => toast.success('Bounty marked as completed'),
  proofSubmitted: () => toast.success('Proof submitted for review'),
  proofApproved: () => toast.success('Proof approved'),
  proofRejected: () => toast.error('Proof rejected', 'Please submit again'),
  paymentSent: (amount: string) =>
    toast.success('Payment sent', `${amount} sats transferred`),
};

export const workspaceToasts = {
  created: () => toast.success('Workspace created successfully'),
  updated: () => toast.success('Workspace updated successfully'),
  deleted: () => toast.success('Workspace deleted successfully'),
  memberAdded: (name: string) =>
    toast.success(`${name} added to workspace`),
  memberRemoved: (name: string) =>
    toast.success(`${name} removed from workspace`),
  roleUpdated: (name: string, role: string) =>
    toast.success(`${name} role updated to ${role}`),
  budgetUpdated: () => toast.success('Budget updated successfully'),
  inviteSent: (email: string) =>
    toast.success('Invite sent', `Invitation sent to ${email}`),
};
