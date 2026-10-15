# Public Component Changelog

Record changes to how this app uses `@stableflow/pay-ui`, `@stableflow/pay-widgets`, or a local widget such as PaymentsAreaChart.

## 2026-10-14

- **WalletSelectDialog:** Solana, Tron, Zcash, and NEAR pickers render `@stableflow/pay-widgets/wallet-select` directly from `src/wallet/*`. The dialog does not go through `PayWidgetsRoot`. EVM uses RainbowKit `modalSize="compact"`.

## 2026-10-12

- **TokenSelectDialog:** `PayWidgetsRoot` passes tokens from `normalizePayConfig(usePayConfigQuery())` and `loading` from `isPending`. The widget no longer fetches pay config. `popularTokens` is removed. The picker is a chain selector: Recently Used cards, Your Tokens, Recent Searches, and Trends Token.
- **Icons:** Imports use `@stableflow/pay-ui/icons/outline/<name>` or `@stableflow/pay-ui/icons/solid/<name>`. `IconDuration2` imports `icons/solid/duration`. `icons/types` is unchanged.

## 2026-09-23

- **pay-ui:** Shared components, overlay helpers, and package icons now import from `@stableflow/pay-ui` subpaths. Token select imports `@stableflow/pay-widgets/token-select` through `PayWidgetsRoot`. Local copies of those components and icons are removed. Reports payment-link dropdowns load remaining pages while the link filter is visible, because the package Dropdown has no `onReachEnd`.
- **Icons:** `IconDuration2` imports `@stableflow/pay-ui/icons/duration`. `IconCheck` imports `@stableflow/pay-ui/icons/check`. This app has no local icon components.
- **Skeleton:** Pulse block (`#e8e8e8`) for a section that has not loaded yet.
- **PaymentsAreaChart:** First load uses a skeleton block instead of the "Loading…" label.
- **Table:** `TableSkeletonRows` renders 3 body rows inside an existing `Table`. Each cell is its own bar. Infinite-scroll footers stay on `IconLoading`.

## 2026-09-20

- **Toast:** Card is 316px, `#fdfdfd` with `#e0e0e0` border, Montserrat, and 14px status dots from public icons. Container is bottom-right (`decash-toast-bottom-right`), oldest toward the top.
- **Dropdown:** Unselected trigger uses `#606060`. Option rows are `text-xs`.
- **OverlayPanel:** Close control no longer draws a focus ring.
- **Switch:** Optional `loading` shows `IconLoading` on the thumb; track opacity stays 1.

## 2026-09-19

- **Dialog / Drawer:** Optional `elevated` places the overlay in the wallet-portal `z-index` band (`10000` plus the overlay stack offset) so Ledger connect dialogs stay above TokenSelect and other app dialogs. Escape still follows the overlay stack.

## 2026-09-18

- **Dialog / Overlay:** Desktop close fades the panel first, then the mask (`OVERLAY_DIALOG_PANEL_FADE_SECONDS`). Open still fades mask and panel together. Narrow viewports keep the bottom Drawer slide.
- **OverlayPanel:** Focus move/restore uses `{ preventScroll: true }` so opening a bottom Drawer does not `scrollIntoView` and interrupt the slide-in.

## 2026-09-16

- **Toast:** `title` / `text` accept `ReactNode`. `useToast()` methods return a `ToastHandle` (`id`, `update`, `dismiss`) so a persistent toast can close itself from an in-body link. Container `z-index` is `100000001` so a toast stays above the near-connect wallet popup.

## 2026-09-03

- **Table:** Scroll children wrap in `min-w-full` (no `w-max`). `fr` columns size to the card so overflow can truncate; header and body stay on the same tracks. Horizontal scroll still applies when column mins exceed the card.

## 2026-09-02

- **PaymentsAreaChart:** Shared payments area chart (`src/components/payments-chart/`) for Overview and Reports. Volume / Transaction toggle, even X-axis sampling from plot width (`evenCategoryTicks` + `interval={0}`), first/last ticks edge-aligned so labels are not clipped, optional `headerExtra`. Line, fill, end-dot, and tooltip colors follow `CHART_METRIC_COLOR` (Volume `#6284F5`, Transaction `#84A20F`).

## 2026-09-01

- **Dropdown:** Panel scroll no longer closes the menu. Optional `onReachEnd` (sentinel IntersectionObserver) and `loadingMore` for infinite option lists.

## 2026-08-30

- **Drawer:** `panelClassName` sizes the positioned shell. Right/left default width is on the shell (`w-[min(100%,420px)]`); the Card is `w-full`. Overlay `mask={false}` uses `pointer-events-none` on the root so the page behind stays clickable; the panel is `pointer-events-auto`.
- **Dialog / Drawer / OverlayPanel:** Masked panels move focus inside, trap Tab focus, restore the previous focus on close, and associate visible titles with the dialog. Added `ariaLabel` for titleless panels.
- **OverlayPanel:** Title uses `min-w-0` so long titles do not widen the panel.

## 2026-08-28

- **Checkbox:** 16px square toggle (`checked` / `defaultChecked` / `onCheckedChange`). Unchecked white + `#E3E3E3` border; checked `#6284F5` with white `IconCheck`.
- **Button:** Added `danger` variant (`bg-danger` / white text, same hover opacity as primary).
- **Drawer:** Mask fades in first, then the panel slides from its edge (`right` → left, `bottom` → up, and the reverse on close). Overlay stays mounted through the exit so the slide can finish.
- **Toast:** Documented existing card + `useToast()` (`success` / `fail` / `info` / `loading` / `notice` / `dismiss`). Type glyphs stay in `Toast.tsx`.
- **InputNumber:** Documented existing decimal text input (`onNumberChange`, optional `decimals`).

## 2026-08-26

- **Tooltip:** `triggerClassName` on the trigger wrapper. Cardinal `side` values (`top` / `right` / `bottom` / `left`) center on that edge; eight composite values (`top-left`, `left-bottom`, …) edge-align.
- **Overlay (`FLOATING_SIDE`):** Twelve placements relative to the trigger. Composite sides resolve to a cardinal side plus `align` and ignore a passed `align`. Cardinal sides still use the caller’s `align` (default `start`).

## 2026-08-25

- **DateRangePicker:** Second calendar click may be the same day as the first (single-day range). Custom one-day ranges show one date, not `MMM d, yyyy – MMM d, yyyy`.

## 2026-08-24

- **DateRangePicker:** Shared time-range calendar (presets + two-click range). Extracted from Partner Reports for History.
- **Table:** Scroll children wrap in `w-max min-w-full` so the header spans the horizontal overflow; `toolbar` / `footer` sit outside the scroller; cells use `min-w-0`.
- **Dropdown:** Optional `label` prefix on the trigger (gray, left; selected value stays right-aligned). Narrow triggers truncate label/value and keep the chevron inside (`overflow-hidden`).
- **Pagination:** Restyled to Montserrat / currentColor; typed `page`, `totalPage`, `onPageChange`.
- **SearchInput / Dropdown:** Default placeholders (`Search` / `Select`) live on the component, not sibling `config.ts`.
- **Tooltip:** `leaveDelay` `0` (default) sets `pointer-events: none` on the panel so it cannot cover the trigger and flicker.
- **Overlay (`useFloatingPosition`):** Measure the panel without forcing `width: max-content`, so className widths such as `w-[285px]` are used for placement.

## 2026-08-21

- **Dialog / OverlayPanel / Drawer:** optional `headerAction` next to the title (outside `<h2>`).
- **UI styles:** Tailwind class names live in the component files (not `config.ts`) so they are easier to maintain.
- **Card:** Initial public card primitive (`rounded-[20px]`, white border, `#FDFDFD`, 20px padding, shadow).
- **Dialog:** Centered modal on desktop; bottom drawer on viewports below 768px. Stacking overlays, mask, optional title, scrollable body.
- **Drawer:** Directional overlay (`top` / `right` / `bottom` / `left`) sharing Dialog chrome (mask, title, close, stacking).
- **Button:** `primary` / `normal` variants, `xl` / `lg` / `md` / `sm` sizes, `loading`, `rounded` override.
- **Tooltip:** Portal to `document.body`, closes on scroll, `leaveDelay` default `0`.
- **SearchInput:** Pill search field with `IconSearch` and custom clear control (native clear hidden).
- **Table:** CSS Grid compound table with sticky header and a single scroll container (no header/body column drift).
- **Dropdown:** Select-style menu; arrow rotates when open; panel portaled to `document.body`. First-open position uses an off-flow measure so the panel is not clamped to the left of the viewport.
- **Switch:** Pill toggle (`33.333×20`). Off track `#F6F6F6`, on track `#6284F5`. Thumb slides with Motion.
