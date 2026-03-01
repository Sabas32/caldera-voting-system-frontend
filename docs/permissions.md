# Permissions in UI

Route guards:
- System routes use `useAuthGuard("system")` and require `is_system_admin = true`.
- Org routes use `useAuthGuard("org")` and require at least one active membership.
- Unauthorized users are redirected to the relevant login route.

Role-aware action gating implemented in UI:
- `ORG_ADMIN`
  - can manage org users/settings
  - can schedule/close/archive elections
  - can publish/unpublish results
  - can generate/revoke/export tokens
- `ELECTION_MANAGER`
  - can schedule/close elections
  - cannot archive elections
  - can publish/unpublish results
  - can manage tokens/posts/candidates
- `RESULTS_VIEWER`
  - read-only for elections/posts/candidates/tokens
  - can view results and history
  - cannot mutate org settings or users

Backend remains the source of truth for authorization; UI gating mirrors server rules to prevent invalid actions.
