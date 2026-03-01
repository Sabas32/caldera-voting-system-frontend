# API Contract Mapping

Frontend endpoint mapping lives in:
- `src/lib/endpoints.ts`
- `src/lib/apiClient.ts`
- `src/lib/downloads.ts` (binary exports)

Primary contracts consumed:
- Auth: `/auth/login/`, `/auth/logout/`, `/auth/me/`
- Dashboards: `/system/dashboard/`, `/org/dashboard/`
- Organizations: `/system/organizations/*`, `/org/settings/`
- Elections CRUD/status/duplicate/results/exports
- Posts + candidates CRUD
- Tokens generation/revocation/exports
- Org users CRUD-lite and audit feeds
- Public vote token/ballot/submit/status/results

Org-scoped requests include `X-Org-Id` via `orgRequestHeaders()` helper.
