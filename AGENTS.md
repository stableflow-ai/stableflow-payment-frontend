# Agent Guide

Read these documents before changing this repository:

- [doc/conventions.md](doc/conventions.md) — coding and documentation rules
- [doc/product.md](doc/product.md) — product areas, routes, and constraints
- [doc/project-structure.md](doc/project-structure.md) — folder map and stack
- [doc/api.md](doc/api.md) — HTTP client, TanStack Query, Zustand session, adding endpoints
- [doc/mocks.md](doc/mocks.md) — mock data while an API contract is missing
- [doc/utils.md](doc/utils.md) — shared helpers (`@/utils`)
- [doc/components/README.md](doc/components/README.md) — public UI components
- [doc/components/CHANGELOG.md](doc/components/CHANGELOG.md) — public component change log
- [doc/multisig.md](doc/multisig.md) — confirm toast + execution watch contract for Safe / Trezu / Squads

## Hard rules

- **English only** in `src/` and `doc/` (code, comments, identifiers, user-facing copy).
- **Icons** are imported from `@stableflow/pay-ui/icons/outline/<name>` or `@stableflow/pay-ui/icons/solid/<name>`. `icons/types` stays. Do not copy those SVGs into this repo, put UI icons in `public/`, or inline new glyphs in pages.
- **Logos** are `/logo.svg` and `/logo-white.svg`. New non-icon page art is `public/<page>/*.png`. Do not put either in `src/components/icons/`.
- **Global client state** uses Zustand in `src/stores/` (`persist` when it must survive reload). Do not read or write `localStorage` / `sessionStorage` yourself. Server data stays in TanStack Query. Page-local UI uses `useState`.
- **Figma MCP failure:** stop, ask the user to refresh the Figma MCP connection, then retry. Do not guess the design.
- **Ambiguity:** list options and wait. Do not pick a silent default and finish the work.
- Narrow viewport is below `768px`. Use Drawer for sidebar / menus. Do not invent a mobile visual system.
- Shared UI comes from `@stableflow/pay-ui/<name>`. Overlay helpers come from `@stableflow/pay-ui/overlay`. Token select comes from `@stableflow/pay-widgets/token-select` and is wired only through `PayWidgetsRoot`.

When this app's usage of `@stableflow/pay-ui` or `@stableflow/pay-widgets` changes, update `doc/components/README.md` and append an entry to `doc/components/CHANGELOG.md`. Do not recreate those components under `src/components/ui/`. `PaymentsAreaChart` remains a local widget.

When you add or change a shared util under `src/utils/`, update [doc/utils.md](doc/utils.md). Search existing utils before writing a new helper.

When you add or change a backend endpoint, follow [doc/api.md](doc/api.md) and append the route to its endpoint table.

When a page needs data before the backend contract exists, follow [doc/mocks.md](doc/mocks.md). Do not invent `src/types/` or query keys in that phase.
