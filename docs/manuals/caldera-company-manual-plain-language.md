# Caldera Voting System - Company Manual (Plain Language Edition)

Version: 2.0  
Updated: 2026-03-06  
Audience: Company staff, trainers, support teams, and operational admins (including non-technical users)

---

## 1. Why This Manual Exists
This manual is written for people who are not technical.

It explains, in plain language:
- What each part of the system is for.
- What each page is doing.
- What every important button does.
- What users should do next after each action.
- What common error messages mean and how to fix them.

If someone is confused, this document should help them continue without needing technical knowledge.

---

## 2. Big Picture: How The System Works
The Caldera Voting System has three work areas:

1. `System Area` (`/system/...`)
- Used by your company platform administrators.
- They manage organizations, system settings, and platform-wide audit logs.

2. `Organization Area` (`/org/...`)
- Used by each client organization.
- They create elections, add posts and candidates, generate voter tokens, and publish results.

3. `Voter Area` (`/vote` and `/e/{slug}/...`)
- Used by voters.
- Voters enter a token, vote, review, submit, and (if allowed) view results.

---

## 3. Simple Glossary
- `Organization`: A client institution or tenant.
- `Election`: One voting event.
- `Post`: A position being voted for (example: Chairperson).
- `Candidate`: A person/option under a post.
- `Token`: A unique voting access code for one voter.
- `Batch`: A group of tokens generated together.
- `Audit`: A timeline of important actions (who did what, and when).
- `Publish results`: Make results visible where allowed.

---

## 4. User Roles (In Everyday Language)

### 4.1 System Admin
Can manage the whole platform:
- All organizations.
- Global system settings.
- Global audit logs.

### 4.2 Organization Roles
- `ORG_ADMIN`:
  - Full control for that organization.
  - Can manage users and organization settings.
  - Can archive elections.

- `ELECTION_MANAGER`:
  - Can run elections and content (posts, candidates, tokens, results).
  - Cannot archive elections.
  - Cannot manage organization users/settings.

- `RESULTS_VIEWER`:
  - Read-only role.
  - Can see election information and results, but cannot change things.

---

## 5. Shared Navigation and Controls
These appear in many places:

### 5.1 Top Bar
- Shows where the user is.
- Shows platform or organization context.
- Has `Logout`.

### 5.2 Theme Toggle
- Switches between light and dark display styles.
- Cosmetic only, does not change data.

### 5.3 Platform Notices
Can display:
- Maintenance message.
- Announcement banner.
- Support contact email.

---

## 6. System Area (Company Platform Team)

## 6.1 Login Page (`/system/login`)

### What this page is for
Allows platform administrators to sign in.

### What user sees
- Email box.
- Password box.
- `Sign in` button.

### Button behavior
- `Sign in`
  - If account is a system admin: goes to System Dashboard.
  - If account is not a system admin but has org access: redirects to org area.
  - If account has no permitted access: login is rejected.

### Common confusion
- "Why did I go to org dashboard instead of system dashboard?"
  - The account likely does not have system admin rights.

---

## 6.2 System Dashboard (`/system/dashboard`)

### What this page is for
Gives a quick health and activity summary for the entire platform.

### Sections explained
- `Total Organizations`: How many client organizations exist.
- `Live Elections`: Elections currently active across all organizations.
- `Ballots (7d)`: Total ballots submitted in last 7 days.
- `Tokens Used (7d)`: Tokens consumed in last 7 days.
- `System Health` (if enabled): API and database status.
- `Recent Global Audit Events`: Latest important actions platform-wide.

### Buttons
- This page is mainly read-only.
- No major mutation buttons.

### Important behavior
- Data refreshes automatically, so counts can change while viewing.

---

## 6.3 Organizations List (`/system/organizations`)

### What this page is for
Find, review, and open organizations.

### Sections explained
- Search box: find by organization name or slug.
- Status filter: type `ACTIVE` or `INACTIVE`.
- Table: shows organizations and quick links.

### Buttons and actions
- `New Organization`
  - Opens create page for a new organization.

- Table `View`
  - Opens organization detail page.

- Table `Edit`
  - Opens organization settings page.

### Common confusion
- "I typed status but nothing happened."
  - Use exact values like `ACTIVE` or `INACTIVE`.

---

## 6.4 Create Organization (`/system/organizations/new`)

### What this page is for
Create a new client organization.

### Fields explained
- `Organization name`: Full display name.
- `Slug`: Short lowercase identifier, usually auto-suggested.
- `Primary color override`: Optional brand color hex (example: `#F5C84B`).
- `Logo URL`: Optional external logo link.

### Button
- `Create organization`
  - Saves organization.
  - Redirects to its detail page.

### Tips
- Keep slug simple and lowercase.
- If unsure about color/logo, leave blank and set later.

---

## 6.5 Organization Detail (`/system/organizations/{orgId}`)

This page has tabs: `Overview`, `Admin Users`, `Settings`.

### Overview tab
- Read-only election list for that organization.
- Shows number of live elections and total elections.

### Admin Users tab
- Describes user administration features.
- Button: `Open Admin Users` to go to full admin user management page.

### Settings tab
- Describes organization-level controls.
- Button: `Open Organization Settings`.

---

## 6.6 Organization Admin Users (`/system/organizations/{orgId}/admins`)

### What this page is for
Create and manage organization users from system level.

### Left panel: create/update user
Fields:
- Email.
- First name.
- Last name.
- Role.

Button:
- `Save organization user`
  - Creates user if new.
  - Updates existing membership if already present.
  - May return a temporary password.

### Right panel: existing users list
Per user row you can:
- `Reset`
  - Resets password.
  - May return a temporary password.

- `Deactivate` / `Activate`
  - Turns user access off/on for that organization.

### Best practice
When a temporary password is shown, copy it immediately and send securely.

---

## 6.7 Organization Settings (`/system/organizations/{orgId}/settings`)

### What this page is for
Control how an organization behaves by default.

### Sections explained

1. `Basic profile`
- Name.
- Status (`ACTIVE`/`INACTIVE`).
- Slug.

2. `Brand theme`
- `Default Gold` button: use platform default color.
- `Custom Color` button: use organization color.
- Color picker and hex input.
- Preset color chips.

3. `Default election result policy`
- Default public results on/off.
- Default internal result visibility.
- Default voter post-vote result access.

4. `Default voter session limits`
- Auto logout duration.
- Post-vote result viewing duration.

### Main button
- `Save organization settings`
  - Saves current changes.

### Common confusion
- "Save button is disabled"
  - No unsaved changes yet, or color value is invalid.

---

## 6.8 System Audit (`/system/audit`)

### What this page is for
Track actions across all organizations.

### Filters
- Organization ID.
- Action name.
- Date from.

### Table columns
- Action.
- Organization.
- Actor.
- Target.
- Time.

### Typical use
- Investigate incidents.
- Confirm who changed what.

---

## 6.9 System Settings (`/system/settings`)

### What this page is for
Set platform-wide visual and operational defaults.

### Sections explained

1. `Branding`
- Platform name.
- Tagline.

2. `Interface behavior`
- Default theme.
- Layout density.
- Reduced motion mode.

3. `Maintenance and support`
- Maintenance mode banner on/off.
- Maintenance message.
- Support email.

4. `Global announcement banner`
- On/off.
- Banner color.
- Message.
- Optional expiry date/time.

5. `System health panel`
- Show/hide health panel on dashboard.
- Live status preview.

6. `Security`
- Change password panel.

### Buttons
- `Reset defaults`
  - Reverts platform setting values to defaults.
- `Save platform settings`
  - Saves current configuration.
- `Update password`
  - Changes current logged-in password.

---

## 7. Organization Area (Client Operations Team)

## 7.1 Org Login (`/org/login`)

### Fields
- Email.
- Password.

### Button
- `Sign in`

### Behavior
- Valid org account goes to org dashboard.
- System-only account may redirect to system area.

---

## 7.2 Org Dashboard (`/org/dashboard`)

### What this page is for
Quick daily operations overview.

### Sections
- KPI cards (active elections, generated tokens, used tokens, turnout).
- `Recent Elections` with quick actions.
- `Audit Preview`.

### Buttons
- `Create election` (role-based).
- `Open all` (elections list).
- Per election: `View` and `Edit`.
- `Full audit`.

---

## 7.3 Elections List (`/org/elections`)

### Sections
- Search filter.
- Status filter.
- Matched count.
- Elections table.

### Buttons
- `Create election`.
- Table `View` and `Edit`.

---

## 7.4 Create Election (`/org/elections/new`)

### Fields explained
- Title and slug.
- Opening and closing date/time.
- Result visibility policy.
- Post-vote behavior policy.
- Ballot instructions shown to voters.
- Voter session timeout.
- Post-vote results window setup.

### Buttons
- `Clear window and keep results open`.
- `Create election`.

### What happens after creation
- Election is created in draft mode.
- User is redirected to election overview.

---

## 7.5 Election Tabs Overview
Inside each election:
- `Overview`: status controls and turnout summary.
- `Setup`: election details and policy settings.
- `Posts`: create positions.
- `Candidates`: manage candidate lists.
- `Tokens`: token generation and control.
- `Monitor`: live turnout graph.
- `Results`: publish/export and analysis.
- `History`: summary + election-focused audit timeline.

---

## 7.6 Election Overview (`/org/elections/{id}/overview`)

### Buttons and exactly what they do
- `Schedule Election`
  - Schedules draft election.

- `Close Election`
  - Opens confirmation dialog.
  - On confirm, election is closed.

- `Archive Election` (Org Admin only)
  - Moves closed election to archived state.

- `Duplicate Election`
  - Creates a copy with posts/candidates and configuration.

- `Open monitor`
  - Opens real-time turnout chart.

- `Delete election` (Org Admin only)
  - Only available for non-active statuses.
  - Opens delete confirmation.

---

## 7.7 Election Setup (`/org/elections/{id}/setup`)

### What this page controls
- Election title/slug/description.
- Voting schedule.
- Results visibility rules.
- Public results allowance.
- Voter post-vote access behavior.
- Voter timeout and result window.

### Buttons
- `Discard`
  - Removes unsaved edits on screen.

- `Save setup`
  - Saves current configuration.

- `Clear window and keep results open`
  - Removes start/end result window and keeps open mode.

### Right-side helpers
- `Live Configuration Summary` explains current setup state.
- `Ballot Preview` shows posts that voters will see.

---

## 7.8 Posts (`/org/elections/{id}/posts`)

### Purpose
Define positions voters will vote on.

### Create panel
- Enter post title.
- Set max selections.
- Set ballot order.
- Choose skip policy (`Allow`/`Disallow`).
- Click `Save post`.

### Post list actions
- `Edit`
  - Opens edit dialog.

- `Delete`
  - Removes post.

### Edit dialog buttons
- `Cancel`.
- `Save changes`.

---

## 7.9 Candidates (`/org/elections/{id}/candidates`)

### Purpose
Attach candidates to a selected post.

### Buttons and controls
- `Create candidate`
  - Opens create dialog.

Create dialog:
- Select post.
- Enter name and profile summary.
- Set ballot order.
- Set visibility status (`Approved` or `Draft`).
- `Cancel`.
- `Save candidate`.

Per-row manage menu:
- `Edit candidate`.
- `Delete candidate`.

Edit dialog:
- `Cancel`.
- `Save changes`.

---

## 7.10 Tokens (`/org/elections/{id}/tokens`)

### Purpose
Create and administer voter access tokens.

### Main sections
1. Token summary cards.
2. Batch history table.
3. Used token and ballot trace table.

### Create batch flow
- Click `Create batch`.
- Enter label and quantity.
- Choose expiry mode:
  - `No expiry`
  - `Set date`
- Click `Generate batch`.

### After generation
- Token dialog may open with generated token list.
- Dialog buttons:
  - `Copy all`
  - `Close`

### Batch row controls
- `Export` menu:
  - CSV download.
  - Print view.
  - QR print preview.
  - QR zip download.
- `View`: load token list for that batch.
- `Manage` menu:
  - `Revoke batch`
  - `Delete batch`

### Used token table controls
- Search field (token hint, receipt, post/candidate names).
- `Refresh` button.
- Per row:
  - `Reset vote`.
  - `Delete token`.

### Safety behavior
- Destructive actions open a confirmation dialog.

---

## 7.11 Monitor (`/org/elections/{id}/monitor`)

### Purpose
Watch turnout trend in near real-time.

### Behavior
- Graph updates every 2 seconds.
- No edit buttons.

---

## 7.12 Results (`/org/elections/{id}/results`)

### Purpose
Analyze, publish, and export results.

### Buttons
- `Publish` / `Unpublish`
  - Opens confirmation dialog.
  - Usually only allowed after election is closed.

- `Export Excel`
  - Downloads result workbook.

- View tabs:
  - `Split`.
  - `Charts`.
  - `Table`.

- Per post:
  - `Download PNG` for chart image.

---

## 7.13 History (`/org/elections/{id}/history`)

### Purpose
See election report snapshot and timeline.

### Sections
- Final report snapshot by post.
- Audit timeline filtered to election-related actions.

### Button
- `Export Excel`.

---

## 7.14 Organization Users (`/org/users`) - Org Admin Only

### Purpose
Manage organization users and roles.

### Buttons
- `Save user`.
- `Reset password` (per row).
- Overflow actions:
  - `Activate user` or `Deactivate user`.

### Common confusion
- "I cannot see users page"
  - Only ORG_ADMIN can access this page.

---

## 7.15 Organization Audit (`/org/audit`)

### Purpose
Review organization activity timeline.

### Controls
- Action filter.
- Date filter.

No mutation buttons on this page.

---

## 7.16 Organization Settings (`/org/settings`) - Org Admin Only

### Sections
- Organization name.
- Brand color mode and value.
- Default voter timeout.
- Default result visibility.
- Public result defaults.
- Password change panel.

### Buttons
- `Default Gold` and `Custom Color`.
- `Save org settings`.
- `Update password`.

---

## 8. Voter Area (Support View For Internal Teams)

## 8.1 Token Login (`/vote`)
Buttons:
- `Continue to ballot`.
- `Start QR scan` / `Restart scan`.
- `Upload QR image`.
- `Stop camera`.

## 8.2 Ballot (`/e/{slug}/ballot`)
Buttons:
- Candidate cards to select/unselect.
- `Skip this position` checkbox (if allowed).
- `Cancel session`.
- `Continue to review`.

## 8.3 Review (`/e/{slug}/review`)
Buttons:
- `Back to ballot`.
- `Submit ballot`.

## 8.4 Status (`/e/{slug}/status`)
Possible buttons:
- `View results now`.
- `View published results`.

## 8.5 Results (`/e/{slug}/results`)
Buttons:
- `Split view` and `Individual`.
- `Previous` and `Next`.
- `Split`, `Chart`, `Table` subview.

---

## 9. Important Business Rules (Plain Language)

### 9.1 Election lifecycle
A normal election moves through:
- Draft -> Scheduled -> Live -> Closed -> Archived.

### 9.2 Deleting elections
- Only Org Admin can delete.
- Cannot delete active elections (live or scheduled).

### 9.3 Publishing results
- Usually only after election is closed.
- Public results require publish + public enabled + proper status.

### 9.4 Token limits
- Batch quantity must be between 1 and 10,000.

### 9.5 Ballot validation
- Every post must be handled.
- Cannot exceed post max selections.
- Skipping only if post allows it.

---

## 10. Troubleshooting Quick Guide

### Login problems
- Wrong workspace after login:
  - Check role permissions for that user.

### Missing buttons
- Usually role-related.
- Confirm role is ORG_ADMIN or ELECTION_MANAGER for edit actions.

### Result visibility confusion
- Check election status first.
- Check whether results are published.
- Check whether public results are enabled.

### Token issues
- Invalid/revoked/expired token errors are common support requests.
- Verify batch status and expiration date.

### Password reset support
- Temporary passwords may appear only once.
- Capture and deliver securely.

---

## 11. What Support Should Collect Before Escalation
Collect these details from user:
- Full page URL.
- Their role.
- Exact button they clicked.
- Exact message shown.
- Time of issue.
- Organization ID / election ID / token hint (never request full token in plain channels).

This information usually resolves most issues quickly.

---

## 12. Final Note
This manual is intended to be practical, not technical.  
If you train staff using this system, use each page section above as your training checklist and walk users button by button.
