# Theming

Implementation:
- `next-themes` provider in `src/app/providers.tsx`
- modes: `light`, `dark`, `system`
- default: `system`
- persisted by `next-themes` in localStorage

Tokens:
- CSS variables defined in `src/app/globals.css`
- light and dark values match required premium yellow palette

Theme toggle:
- `ThemeToggle` in shell topbars
- Dropdown options: Light / Dark / System

Charts:
- Recharts components use CSS variables for axes, grids, and bars.
