# UI Guide

Typography (Inter):
- Display: `2.25rem / 1.1 / 600`
- H1: `1.875rem / 1.2 / 600`
- H2: `1.5rem / 1.25 / 600`
- H3: `1.25rem / 1.3 / 600`
- Body: `1rem / 1.5 / 400`
- Small: `0.875rem / 1.45 / 400`
- Tiny: `0.75rem / 1.4 / 400`

Spacing scale:
- `4, 8, 12, 16, 24, 32, 40, 48`

Layout:
- centered max width `1280px` via `.container-page`
- topbar height `64px`
- sidebar supports:
  - desktop expanded `280px`
  - desktop collapsed `76px`
  - mobile drawer with overlay

Cards:
- radius `14px`
- subtle border + elevation
- hover lift `translateY(-1px)` and stronger shadow

Inputs/buttons:
- input height `40px`, radius `10px`, 2px brand focus ring
- button sizes `32/40/44` via `sm/md/lg` variants and brand yellow primary

Tables:
- powered by TanStack Table (`src/components/tables/shared.tsx`)
- sticky headers and row height `52px`
- shared action column pattern (`View` / `Edit`)

Motion:
- page transition `opacity 0->1, y 8->0, 0.22s`
- reveal animation `opacity 0->1, y 12->0, 0.28s`
- `prefers-reduced-motion` respected globally
