# Development Conventions

Rules for humans and agents working in this repository. Anything committed to `src/` or `doc/` must be English.

## Language

- Code, comments, identifiers, user-facing copy, mock fixtures, and documentation must be written in **English** only.
- Do not add any other language to source files or `doc/`.

## Public components

- Shared, non-business UI is imported from `@stableflow/pay-ui/<name>`. Token select is imported from `@stableflow/pay-widgets/token-select`. Wallet select is imported from `@stableflow/pay-widgets/wallet-select` and may be used directly in `src/wallet/*` without `PayWidgetsRoot`. Do not add local copies under `src/components/ui/`.
- Business widgets stay next to their feature (for example `src/components/payments-chart/`).
- Overlay helpers come from `@stableflow/pay-ui/overlay`.
- After changing how this app uses a package component, update `doc/components/<name>.md` and append an entry to `doc/components/CHANGELOG.md`.

## Shared utils

- Before adding a helper, search `src/utils/` (`@/utils`) and `src/lib/`. Do not reimplement an existing function.
- Put a helper in `src/utils/` only if it is generally reusable across features. Feature-specific helpers belong in that feature's `utils.ts`.
- Split files by purpose and re-export from `src/utils/index.ts`.
- After adding or changing a public util, update [doc/utils.md](utils.md).
- `cn()` stays in `src/lib/utils.ts` (shadcn alias). RPC clients and logo helpers stay in `src/lib/`.

## Styling

- Use Tailwind + `cn()` from `@/lib/utils`. Put class names in the component JSX/`cva` call, not in `config.ts`.
- Public components must accept `className` (and named `*ClassName` props where the plan/API already defines them) so callers can override defaults.

## Icons

- Icons are imported from `@stableflow/pay-ui/icons/outline/<name>` or `@stableflow/pay-ui/icons/solid/<name>`. `icons/types` stays. Do not copy them into this repo.
- **Forbidden:** UI icons under `public/`, new inline SVGs in pages or feature components, third-party icon packs (lucide and similar).

## Static assets (logo and page art)

- Product logo on a light background: `/logo.svg` (`public/logo.svg`).
- Product logo on a dark background: `/logo-white.svg` (`public/logo-white.svg`).
- Logos are not icons. Do not copy them into `src/components/icons/`.
- Existing Auth decoration stays at `public/auth/brand-mark-vector.svg`. It is not the product logo and not an icon. Do not convert existing logo or auth SVGs to PNG.
- New non-icon artwork from Figma (illustrations, photos, page decorations): `public/<page-or-area>/<name>.png`. Example: Overview art → `public/overview/...png`. Do not put these in `src/components/icons/`.
- Wallet metadata remote URLs (for example Tron `https://stableflow.ai/logo.svg`) stay as-is.

## Responsive

- There is no mobile design. Adapt the desktop frame. Do not invent a separate mobile visual system.
- Narrow viewport is below `768px` (Tailwind `md`), matching Dialog.
- The authenticated sidebar uses Tailwind `lg` (`1024px`): it is a left column from `lg` up, and a top Drawer below that. Do not invent a second mobile nav.
- Use the existing [Drawer](components/drawer.md) for menus and filters on narrow viewports.
- Tables may scroll horizontally. Do not invent a second information architecture for narrow screens unless the user has approved it.

## Figma MCP

- If `get_design_context`, `get_screenshot`, or another Figma MCP call fails (node mismatch, expired token, empty payload): **stop**. Tell the user to refresh the Figma MCP connection and retry.
- Do not guess the layout, substitute a nearby node, or copy a v2 screen in place of the current file.

## Ask before guessing

- Ambiguous copy, breakpoints, Figma vs code, or a missing API contract: list options and wait for the user to decide.
- Do not pick a “reasonable” default and finish the work.

## State

- Cross-page client state lives in Zustand stores under `src/stores/`.
- Persist across reloads with Zustand `persist` only. Do not read or write `localStorage` or `sessionStorage` from features, pages, or hooks. Do not add a custom storage wrapper.
- Server lists, details, and quotes stay in TanStack Query. Do not copy them into Zustand.
- Page-local UI (dialog open, input value) uses component `useState`. Do not lift it into a store.
- JWT session (`token` + `user`) lives in `useAuthStore` with `persist`.

## TypeScript

- Use `import type` for type-only imports (`verbatimModuleSyntax` is enabled).
- Do not use TypeScript `enum`. Use `const` objects plus derived types.
