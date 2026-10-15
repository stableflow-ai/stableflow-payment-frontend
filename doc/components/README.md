# Public UI

Presentational components and shared icons come from `@stableflow/pay-ui`. The token picker comes from `@stableflow/pay-widgets/token-select`. The wallet list comes from `@stableflow/pay-widgets/wallet-select`. Do not copy those implementations into this repo.

`src/styles.css` scans both packages so Tailwind keeps their classes:

```css
@source "../node_modules/@stableflow/pay-ui/dist";
@source "../node_modules/@stableflow/pay-widgets/dist";
```

| Component | Import |
| --- | --- |
| Button | `@stableflow/pay-ui/button` |
| Card | `@stableflow/pay-ui/card` |
| Checkbox | `@stableflow/pay-ui/checkbox` |
| DateRangePicker | `@stableflow/pay-ui/date-range-picker` |
| Dialog | `@stableflow/pay-ui/dialog` |
| Drawer | `@stableflow/pay-ui/drawer` |
| Dropdown | `@stableflow/pay-ui/dropdown` |
| InputNumber | `@stableflow/pay-ui/input-number` |
| Pagination | `@stableflow/pay-ui/pagination` |
| SearchInput | `@stableflow/pay-ui/search-input` |
| Skeleton | `@stableflow/pay-ui/skeleton` |
| Switch | `@stableflow/pay-ui/switch` |
| Table | `@stableflow/pay-ui/table` |
| Toast | `@stableflow/pay-ui/toast` |
| Tooltip | `@stableflow/pay-ui/tooltip` |
| Overlay helpers | `@stableflow/pay-ui/overlay` |
| TokenSelectDialog | `@stableflow/pay-widgets/token-select` |
| WalletSelectDialog | `@stableflow/pay-widgets/wallet-select` |
| PaymentsAreaChart | `src/components/payments-chart/` — [payments-chart.md](payments-chart.md) |

Each package entry is its own subpath. There is no root barrel.

Icons are imported per file, for example `import { IconClose } from "@stableflow/pay-ui/icons/outline/close"`. Solid glyphs use `icons/solid/<name>`. This app has no local icon components.

`PayWidgetsRoot` (`src/components/pay-widgets-root.tsx`) is the data boundary for the token picker: wallet, balances, and tokens from `normalizePayConfig(usePayConfigQuery())`. It does not fetch config. `WalletSelectDialog` is presentational and is imported directly from `src/wallet/*`. It does not use `PayWidgetsRoot`. `useToast` stays in this app and renders `Toast` from `@stableflow/pay-ui/toast`.

When a shared component or icon changes, change it in `stableflow-pay-ui` and bump the beta here. Append a note to [CHANGELOG.md](CHANGELOG.md) when this app's usage of the package changes.
