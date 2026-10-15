# Project Structure

StableFlow Pay is a Vite 8 + React 19 frontend. Wallet providers for EVM, Near, Solana, Tron, and Zcash (`@rhea-finance/zcash-wallet-adapter` / Noir) are wired. The authenticated shell is the Figma Overview sidebar layout. Overview at `/` is mocked until the API contract exists.

Product areas, routes, and constraints: [product.md](product.md).

## Stack

- **Runtime:** Vite 8 (Rolldown), React 19, TypeScript
- **Styling:** Tailwind CSS 4, `cn()` (`clsx` + `tailwind-merge`), `class-variance-authority`
- **State:** Zustand (cross-page client state; auth session via persist), TanStack Query (server cache). Do not use raw `localStorage` / `sessionStorage`.
- **Routing:** `react-router-dom`
- **Path alias:** `@/` → `src/`

## Scripts

```bash
pnpm install
pnpm dev        # http://127.0.0.1:5200
pnpm check      # tsc -b
pnpm test       # vitest
pnpm build
pnpm preview
```

## Directory map

```
public/
  logo.svg                # Product logo (light background)
  logo-white.svg          # Product logo (dark background)
  auth/                   # Auth-only decoration (brand-mark SVG). New page art: <page>/*.png
src/
  App.tsx                 # Router + toast container
  main.tsx                # Boot: Buffer polyfill, QueryClient, WalletProvider
  styles.css              # Tailwind entry, fonts, global tokens
  router/                 # Route table + auth guards (no roles)
  views/
    auth/                 # Login, register, AuthShell, ResetPasswordDialog
    how-it-works/         # Public marketing page
    overview/             # Authenticated home at /
    guide/                # Authenticated /guide onboarding (own layout, step drawers)
    payment-links/        # Merchant payment-link list and create
    payer/                # Public /paylink/:linkId and /checkout?sessionId= pay + waiting (no login)
    settings/             # Settings page at /settings (profile + webhooks)
    api-keys/             # Merchant API-key list at /api-keys
    reports/              # Merchant reports at /reports
    docs/                 # Public Checkout API documentation at /docs
    privacy-transfer/     # Authenticated /privacy-transfer (not in the sidebar)
  layouts/                # AppLayout (sidebar + 65px title + footer + outlet)
  components/
    layout/               # AppSidebar, AppNav, AccountMenu, AppFooter, sidebar config
    pay-widgets-root.tsx  # PayWidgetsProvider data boundary
    payments-chart/       # Reports area chart (local business widget)
    safe/                 # SafeMultisigBadge (wraps MultisigBadge), showSafeProposalToast
    multisig/             # MultisigBadge, confirm toast, PayFromSquadSection
  hooks/                  # Shared hooks
  wallet/                 # Multi-chain wallet adapters and providers
    evm/safe/             # Safe proposal helpers:
                          # abi.ts, bundle.ts, config.ts, detect.ts, info.ts,
                          # send.ts, types.ts, use-safe-info.ts, use-safe-mode.ts,
                          # watch.ts (n/m + status snapshot; see doc/multisig.md)
    near/multisig/        # SputnikDAO / Trezu helpers:
                          # config.ts, detect.ts, policy.ts, info.ts,
                          # proposal.ts, types.ts, use-near-dao-info.ts,
                          # use-near-multisig-mode.ts,
                          # watch.ts (n/m + status snapshot; see doc/multisig.md)
    solana/               # adapter, balance, transfer, session
    solana/multisig/      # SquadsX wrap + Squads SDK proposal helpers:
                          # access.ts, config.ts, detect.ts, info.ts, resolve.ts,
                          # result.ts, send.ts, send-sdk.ts, types.ts, watch.ts,
                          # use-squads-info.ts, use-squads-mode.ts
    multisig/             # Cross-chain confirm toast + watch contract (doc/multisig.md)
  stores/                 # Zustand stores (auth persist, wallet, intents, squads-sdk, commit queues)
  api/                    # Backend wrappers by domain
  types/                  # Shared API / domain types
  mocks/                  # UI fixtures while an API contract is missing — see doc/mocks.md
  lib/                    # Infra: HTTP client, QueryClient, RPC, `cn()`, logo URLs
  utils/                  # Shared helpers (address, date, amount) — see doc/utils.md
  config/                 # App-level config (chains, payout constants)
doc/                      # Agent-facing docs (English)
```

## Where new code goes

| Kind | Location |
| --- | --- |
| Public UI primitive | `@stableflow/pay-ui/<name>` (see doc/components/README.md) |
| Icon (Figma UI glyph) | `@stableflow/pay-ui/icons/outline/<name>` or `@stableflow/pay-ui/icons/solid/<name>` |
| Product logo | `public/logo.svg` (light) / `public/logo-white.svg` (dark) |
| Page illustration / photo | `public/<page-or-area>/<name>.png` — not under `icons/` |
| Page | `src/views/` + register in `src/router/index.tsx` |
| Feature widget | `src/components/<feature>/` (not under `ui/`) |
| Hook | `src/hooks/` |
| API function | `src/api/<domain>.ts` — call `http()` only; see [api.md](api.md) |
| API types | `src/types/<domain>.ts` |
| Query keys | `src/api/query-keys.ts` |
| Zustand store | `src/stores/` — session / global UI, not server lists |
| Shared util | `src/utils/` + [doc/utils.md](utils.md) |
| Infra helper (`cn`, HTTP, RPC, logo) | `src/lib/` |
| Constants for a module | sibling `config.ts` |
| Mock fixtures (API not ready) | `src/mocks/<domain>.ts` + [mocks.md](mocks.md) |

## Public UI import paths

Import from the component file (no barrel file):

```ts
import { Button } from "@stableflow/pay-ui/button";
import { Dialog } from "@stableflow/pay-ui/dialog";
```

Shared utils use the barrel:

```ts
import { formatAmount, formatDate, isAddressValid } from "@/utils";
```
