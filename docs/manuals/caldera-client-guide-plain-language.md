# Caldera Voting System - Client Guide (Very Detailed, Non-Technical)

Version: 2.0  
Updated: 2026-03-06  
Audience: Voters, client administrators, election officers, and support staff

---

## 1. Start Here
This guide explains the system in simple, everyday language.

You can use it if you are:
- A voter with a token.
- A client organization admin running elections.
- A team member helping users who are confused.

---

## 2. Two Main Journeys

### Journey A: Voting
1. Open `/vote`.
2. Enter token (or scan QR).
3. Complete ballot.
4. Review selections.
5. Submit.
6. Check status and results (if allowed).

### Journey B: Running an Election (Organization Admin)
1. Open `/org/login`.
2. Create election.
3. Add posts.
4. Add candidates.
5. Generate tokens.
6. Monitor voting.
7. Publish/export results.

---

## 3. Voter Guide (Step by Step)

## 3.1 Open Voter Login (`/vote`)

### What you will see
- A card called "Access your ballot".
- A token text box.
- Optional QR tools on the right.

### What each button does
- `Continue to ballot`
  - Checks your token.
  - If token is valid and unused: opens ballot page.
  - If token already used and election allows read-only access: opens status page.

- `Start QR scan` / `Restart scan`
  - Starts camera to scan QR token.

- `Upload QR image`
  - Lets you select an image file containing the token QR.

- `Stop camera`
  - Stops camera scanning immediately.

### If something goes wrong
- `Invalid token`
  - Token text is wrong or token does not exist.
- `Token revoked`
  - Organizer disabled this token.
- `Token expired`
  - Token batch date passed.
- `Election is not live`
  - Voting period not open.

### Tips
- Enter token exactly as given.
- Avoid extra spaces before/after token.

---

## 3.2 Complete Ballot (`/e/{slug}/ballot`)

### What you will see
- Election title.
- Progress bar.
- One section per post/position.
- Candidate cards under each post.
- Side card with progress and instructions.

### How to vote on each post
1. Read post title.
2. Click candidate card(s) to select.
3. If allowed, you may use `Skip this position`.
4. Repeat for all posts.

### Important behavior
- Clicking selected candidate again removes selection.
- If you exceed allowed selections, system shows an error.
- If `Skip this position` is checked, candidate selection for that post is disabled.

### Buttons
- `Cancel session`
  - Returns to token login page.

- `Continue to review`
  - Moves forward only when all posts are properly completed.

### Common confusion
- "Why can't I continue?"
  - One or more posts are incomplete.
- "Why can't I select candidate?"
  - `Skip this position` may be checked for that post.

---

## 3.3 Review Selections (`/e/{slug}/review`)

### What you will see
- A clear summary of each post.
- Which candidates are selected.
- Warnings for missing or invalid selections.

### Buttons
- `Back to ballot`
  - Goes back to edit choices.

- `Submit ballot`
  - Final submission.
  - After submission, choices cannot be changed.

### What happens next
- Usually redirects to `/e/{slug}/status`.
- In strict post-vote mode, may redirect to `/vote`.

---

## 3.4 Submission Status (`/e/{slug}/status`)

### What you will see
- Confirmation message (vote submitted).
- Receipt code.
- Submission timestamp.

### Conditional buttons
- `View results now`
  - Appears when your voter result access window is active.

- `View published results`
  - Appears when public results are published and available.

### Why buttons may not appear
- Results are not published yet.
- Your result access window ended.
- Election policy blocks post-vote result access.

---

## 3.5 Public Results (`/e/{slug}/results`)

### What you will see
- Election summary cards.
- Result charts.
- Candidate ranking tables.

### View controls and what they do
- `Split view`
  - Shows all posts together.

- `Individual`
  - Focuses on one post at a time.

- `Previous` / `Next`
  - Switch between posts in individual mode.

- Subview buttons in individual mode:
  - `Split`: chart and table together.
  - `Chart`: only chart.
  - `Table`: only table.

### If results are unavailable
You may see "Results are not available for this election at this time."  
This means publication/visibility conditions are not met.

---

## 4. Organization Administrator Guide (Client Side)

## 4.1 Login (`/org/login`)

### Fields
- Email.
- Password.

### Button
- `Sign in`.

---

## 4.2 Dashboard (`/org/dashboard`)

### Purpose
Daily command center for election operations.

### Sections
- KPI cards:
  - Active elections.
  - Tokens generated.
  - Tokens used.
  - Turnout.
- Recent elections list.
- Audit preview list.

### Buttons
- `Create election`.
- `Open all` (go to full elections list).
- Per election row:
  - `View`
  - `Edit` (role-based)
- `Full audit`

---

## 4.3 Elections List (`/org/elections`)

### Purpose
Search and open elections quickly.

### Controls
- Search input.
- Status input.
- Matched count indicator.

### Buttons
- `Create election`.
- Table `View`.
- Table `Edit`.

---

## 4.4 Create Election (`/org/elections/new`)

### Fields explained in plain language
- `Election title`: public/admin name.
- `Slug`: short link-safe name.
- `Opens at`: when voting starts.
- `Closes at`: when voting ends.
- `Results visibility`: when internal users can see results.
- `Post-vote access mode`: what happens if token is used again.
- `Ballot instructions`: text shown to voters.
- `Voter auto logout`: timeout during voter session.
- `Allow post-vote results access`: enable/disable voter result access after submission.
- `Results window mode`: always open or time-limited.

### Buttons
- `Clear window and keep results open` (if window mode used).
- `Create election`.

### After click
- Election is created as draft.
- You are redirected to election overview.

---

## 4.5 Election Overview (`/org/elections/{id}/overview`)

### What this page is for
Control election status and view high-level metrics.

### Buttons and exact outcomes
- `Schedule Election`
  - Attempts to move draft election toward scheduled/live.

- `Close Election`
  - Opens confirmation dialog.
  - On confirm, closes election.

- `Archive Election` (Org Admin only)
  - Archives closed election.

- `Duplicate Election`
  - Creates copy of election setup.

- `Open monitor`
  - Opens real-time turnout page.

- `Delete election`
  - Only for non-active election statuses.
  - Opens delete confirmation first.

---

## 4.6 Election Setup (`/org/elections/{id}/setup`)

### What can be changed
- Core election details.
- Schedule dates.
- Result and visibility policies.
- Public result allowance.
- Post-vote access behavior.
- Session timeout and result windows.

### Buttons
- `Discard`
  - Removes unsaved edits currently on screen.

- `Save setup`
  - Saves all valid changes.

- `Clear window and keep results open`
  - Removes result start/end restrictions.

### Helpful side panels
- `Live Configuration Summary`
  - Quick summary of current setup state.
- `Ballot Preview`
  - Shows post list voters will see.

---

## 4.7 Posts (`/org/elections/{id}/posts`)

### Purpose
Define positions that voters will vote on.

### Create Post area
- Enter title.
- Set max selections.
- Set order.
- Choose skip behavior with buttons:
  - `Disallow`
  - `Allow`
- Click `Save post`.

### Post List area
Per row actions:
- `Edit` -> opens edit dialog.
- `Delete` -> removes post.

Edit dialog buttons:
- `Cancel`.
- `Save changes`.

---

## 4.8 Candidates (`/org/elections/{id}/candidates`)

### Purpose
Add candidate profiles to each post.

### Buttons and actions
- `Create candidate`
  - Opens full candidate creation dialog.

Create dialog:
- Choose post.
- Enter candidate name.
- Enter profile summary.
- Set sort order.
- Set status (`Approved` or `Draft`).
- Buttons:
  - `Cancel`
  - `Save candidate`

Candidate row Manage menu:
- `Edit candidate`
- `Delete candidate`

Edit dialog buttons:
- `Cancel`
- `Save changes`

---

## 4.9 Tokens (`/org/elections/{id}/tokens`)

### Purpose
Generate voter tokens and manage their lifecycle.

### Top summary
Shows:
- Number of batches.
- Total tokens generated.
- Active vs used tokens.
- No-expiry batch count.

### Create batch flow
1. Click `Create batch`.
2. Enter label and quantity.
3. Choose expiry mode:
  - `No expiry`
  - `Set date`
4. Click `Generate batch`.

### Batch table buttons
- `Export` menu:
  - Download CSV.
  - Open Print View.
  - QR Print Preview.
  - Download QR Zip.

- `View`
  - Opens token list for that batch.

- `Manage` menu:
  - `Revoke batch`
  - `Delete batch`

### Token list dialog buttons
- `Copy all`
- `Close`

### Used tokens table
- Search bar for token hint/receipt/post/candidate.
- `Refresh` button.
- Per used token:
  - `Reset vote`
  - `Delete token`

### Safety notes
- Destructive actions ask for confirmation.
- Revoking and deleting can affect voter access immediately.

---

## 4.10 Monitor (`/org/elections/{id}/monitor`)

### Purpose
Watch turnout trend live.

### Behavior
- Chart auto-updates frequently.
- No save buttons.

---

## 4.11 Results (`/org/elections/{id}/results`)

### Purpose
Review, publish, and export results.

### Buttons
- `Publish` / `Unpublish`
  - Controls result visibility for eligible viewers.
  - Uses confirmation dialog.

- `Export Excel`
  - Downloads result spreadsheet.

- View tabs:
  - `Split`
  - `Charts`
  - `Table`

- `Download PNG`
  - Download chart image for each post.

### Why Publish button might be disabled
- Election may not yet be closed/archived.

---

## 4.12 History (`/org/elections/{id}/history`)

### Purpose
See a report snapshot plus timeline of related actions.

### Main button
- `Export Excel`.

---

## 4.13 Users (`/org/users`) - Org Admin Only

### Purpose
Manage organization team accounts.

### Create form button
- `Save user`.

### Per user row
- `Reset password`.
- Action menu:
  - `Activate user` / `Deactivate user`.

---

## 4.14 Audit (`/org/audit`)

### Purpose
View activity records for your organization.

### Filters
- Action filter.
- Date filter.

No save/delete buttons on this page.

---

## 4.15 Settings (`/org/settings`) - Org Admin Only

### Purpose
Configure org defaults and security settings.

### Brand controls
- `Default Gold`.
- `Custom Color`.
- Color picker.
- Hex input.

### Other settings
- Default voter timeout.
- Default visibility rules.
- Public result defaults.

### Buttons
- `Save org settings`.
- `Update password`.

---

## 5. Common Questions and Clear Answers

### Q1: "I cannot see Create Election button"
You likely have a read-only role (`RESULTS_VIEWER`) or limited manager access.

### Q2: "Why can't I archive?"
Only Org Admin can archive, and election must be closed first.

### Q3: "Why can't voters see results?"
Possible reasons:
- Results not published.
- Public result setting is off.
- Election not in allowed status.
- Voter result window expired.

### Q4: "Why did token stop working?"
Possible reasons:
- Token already used.
- Token revoked.
- Token expired.
- Election is not currently live.

---

## 6. Friendly Support Checklist (When Helping Someone)
Ask for:
- The page URL they are on.
- Their role (voter, manager, org admin).
- Exact button clicked.
- Exact message on screen.
- Approximate time issue happened.

This helps resolve issues quickly without technical complexity.

---

## 7. Final Reminder
If users are confused, guide them page-by-page and button-by-button using this document.  
Most issues are solved by checking role permissions, election status, and result visibility settings.
