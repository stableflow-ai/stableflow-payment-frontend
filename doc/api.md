# API Layer

How to call the StableFlow Pay backend. Read this before adding or changing an endpoint.

The browser calls `VITE_API_BASE_URL` directly for dashboard APIs. Default: `https://test-api.stableflow.ai`. Product APIs live under `/v1/pay/` and `/v1/nearintents/` and are **GET**, **POST**, or **DELETE**. Guide Step 4 `POST /v1/pay/checkout/sessions` (`x-api-key`) uses a Vite proxy in `pnpm dev` / `pnpm preview` (`sameOrigin`) so the browser stays same-origin. Other routes still hit the API host. Production static hosting has no Vite server unless the deploy layer also proxies that path.

## Layers

```
View / feature
  → src/hooks/use-<domain>-api.ts     TanStack Query (loading, error, cache)
    → src/api/<domain>.ts             thin http() / httpBlob() wrappers
      → src/lib/http.ts               fetch + envelope + Bearer token + file downloads
        → src/stores/auth.ts          Zustand persist session (`token`, `user`)
```

| Concern | Where | Do |
| --- | --- | --- |
| Request lifecycle (`isPending`, `error`, cache, refetch) | TanStack Query hooks | `useQuery` / `useMutation` |
| JWT session (`token`, `user`) | Zustand `useAuthStore` | `applySession` / `logout` |
| Other global UI state | Zustand (new store or existing) | Keep it small |
| Server lists, details, quotes | TanStack Query only | Do **not** copy into Zustand |

`http()` and `httpBlob()` in `src/lib/http.ts` are the only functions that may call `fetch` for `/v1/pay/*` and `/v1/nearintents/*`. Do not add axios. `/v1/nearintents/*` uses `envelope: false` because the backend proxies 1Click JSON (no `{ code, data }` wrapper). 1Click `/v0/auth/*` and `/v0/account/balances` are a different host (no product envelope) and stay in `src/lib/confidential/one-click-auth.ts`. In `pnpm dev` / `preview`, those paths are same-origin (Vite proxy to `https://1click.chaindefuser.com`). File downloads (CSV export) use `httpBlob()`, which returns `{ blob, filename }` instead of unwrapping `{ code, data }`. `http()` and `httpBlob()` abort after 30s and throw `ApiError` with `code: "TIMEOUT"` and `status: 0`. TanStack Query retries reads twice (`shouldRetryQuery`); HTTP 4xx is not retried except timeouts. Quote/swap POST-as-query hooks set `retry: false`. Mutations do not retry.

The confidential indexer (`VITE_PRIVATE_INDEXER_URL`, default `https://privateindexer.refburrow.top`) is not `/v1/pay` or `/v1/nearintents`. `src/api/private-indexer.ts` calls same-origin `/v3/private/*` with its own fetch because a successful indexer envelope may use `code === 0` (product `http()` only unwraps `code === 200`). Production should proxy this path on the API host; Vite does it only in dev/preview. Privacy Transfer gets a 1Click User-Session by wallet-signing through `activateConfidentialAccount` (`POST /v0/auth/authenticate`) once per linking account, then reuses the tokens until they expire. A Partner `distribution_channel` JWT cannot read `/v0/account/balances`. Production CORS still needs a backend proxy.

## Envelope

Every response is:

```ts
{ code: number; data?: T; message?: string }
```

`code === 200` unwraps and returns `data`. Any other `code`, non-OK HTTP status, or missing envelope throws `ApiError` (`src/lib/api-error.ts`: `message`, `status`, `code`).

## Auth header

`http()` sends `Authorization: Bearer {token}` **by default**.

- Pass `auth: false` only for public routes (login, register, reset password).
- If `auth` is true and no token is in `useAuthStore`, `http()` throws `ApiError` 401 `UNAUTHENTICATED` without hitting the network.
- HTTP 401 on an authenticated request calls `useAuthStore.getState().logout()` (`queryClient.clear()`, Google Drive session `clear()`, persist clears `{ token, user }`). Manual log out also sets `omitReturnTo` so `/login` has no `returnTo`.

The auth store persists `{ token, user }` with Zustand `persist` (storage name `stableflow-pay.session`). Do not add a custom `localStorage` helper. `GET /v1/pay/profile` (`useProfileQuery`, mounted in `App`) then validates that token in the background. A 401 clears the session. Do not block navigation while the profile query is in flight.

## Adding an endpoint

1. Types → `src/types/<domain>.ts` (create the file if needed).
2. Request function → `src/api/<domain>.ts`. Call `http()` (or `httpBlob()` for file downloads) only. Prefix paths with `PAY_API_PREFIX` from `src/api/config.ts`.
3. Query key → `src/api/query-keys.ts` **only for `useQuery`**. Mutations do not get keys.
4. Hook → `src/hooks/use-<domain>-api.ts` (`useQuery` or `useMutation`).
5. Leave `auth` at the default unless the route is public.
6. Keep server data in Query. Persist only the session (or true global UI) in Zustand.
7. Append a row to the [endpoint table](#endpoints) below.

### Query keys

Add a namespace in `src/api/query-keys.ts` when you introduce a `useQuery`. Mutations do not get keys. Example:

```ts
order: {
  all: ["order"] as const,
  detail: (id: string | number) => [...queryKeys.order.all, "detail", id] as const,
},
```

Use `queryKeys.order.detail(id)` in `useQuery` and `queryClient.invalidateQueries({ queryKey: queryKeys.order.all })` after mutations that change that data.

### `http()` options

```ts
http<T>(path, {
  method?: "GET" | "POST" | "DELETE"; // default GET
  body?: unknown;          // JSON body (POST)
  query?: Record<string, string | number | boolean | null | undefined>;
  auth?: boolean;          // default true
  apiKey?: string;         // merchant x-api-key; omits Bearer and does not logout on 401
  sameOrigin?: boolean;    // request the path on the current origin (Vite proxy in dev)
  envelope?: boolean;      // default true; false for `/v1/nearintents/*` 1Click passthrough
})
```

GET query params go in `query` (nullish values are skipped). Path params are interpolated by the caller: `` `${PAY_API_PREFIX}/order/${id}` ``.

File downloads:

```ts
httpBlob(path, {
  method?: "GET" | "POST" | "DELETE";
  query?: Record<string, string | number | boolean | null | undefined>;
  auth?: boolean;              // default true
  fallbackFilename?: string;   // used when Content-Disposition has no filename
})
```

Success returns `{ blob, filename }`. `filename` comes from `Content-Disposition` (`filename` or `filename*`). HTTP errors and `{ code }` envelopes that are not `200` throw `ApiError` the same way as `http()`.

### View usage

```ts
import { useLoginMutation } from "@/hooks/use-auth-api";

function LoginForm() {
  const loginMutation = useLoginMutation();

  async function onSubmit(email: string, password: string) {
    try {
      await loginMutation.mutateAsync({ email, password });
      // Session is already in the auth store (hook onSuccess → applySession).
      navigate("/", { replace: true });
    } catch {
      // Read loginMutation.error (ApiError) for the message.
    }
  }
}
```

```ts
import { useAuthStore } from "@/stores/auth";

const user = useAuthStore((state) => state.user);
const logout = useAuthStore((state) => state.logout);
```

Authenticated query example (subsequent agents):

```ts
export function useOrderQuery(id: string) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: queryKeys.order.detail(id),
    queryFn: () => getOrder(id),
    enabled: Boolean(token) && Boolean(id),
  });
}
```

## Endpoints

| Method | Path | Auth | Body | Data | API | Hook |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/v1/pay/auth/login` | no | `LoginBody` | `AuthSession` (`user.guideCompleted`) | `login` | `useLoginMutation` |
| POST | `/v1/pay/auth/register` | no | `RegisterBody` (`code`) | `AuthSession` | `register` | `useRegisterMutation` |
| POST | `/v1/pay/auth/register/code` | no | `RegisterCodeBody` | `void` | `sendRegisterCode` | `useSendRegisterCodeMutation` |
| POST | `/v1/pay/change-password` | yes | `ChangePasswordBody` | `void` | `changePassword` | `useChangePasswordMutation` |
| POST | `/v1/pay/reset-password` | no | `ResetPasswordBody` | `void` | `resetPassword` | `useResetPasswordMutation` |
| POST | `/v1/pay/reset-password/code` | no | `ResetPasswordCodeBody` | `void` | `sendResetPasswordCode` | `useSendResetPasswordCodeMutation` |
| GET | `/v1/pay/profile` | yes | — | `AuthUser` (`guideCompleted`) | `getProfile` | `useProfileQuery` |
| GET | `/v1/pay/config` | no | — | `PayConfig` | `getPayConfig` | `usePayConfigQuery` |
| POST | `/v1/pay/guide/complete` | yes | — | `void` | `completeGuide` | `useCompleteGuideMutation` |
| GET | `/v1/pay/organization` | yes | — | `PayOrganization` | `getOrganization` | `useOrganizationQuery` |
| POST | `/v1/pay/organization` | yes | `PayOrganizationBody` | `PayOrganization` | `updateOrganization` | `useUpdateOrganizationMutation` |
| GET | `/v1/pay/webhooks` | yes | — | `PayWebhook[]` | `listWebhooks` | `useWebhooksQuery` |
| POST | `/v1/pay/webhooks` | yes | `PayWebhookBody` | `PayWebhookCreateResp` | `createWebhook` | `useWebhookMutations` |
| GET | `/v1/pay/webhooks/deliveries` | yes | `event_id`, `page`, `pageSize`, `status`, `webhook_id` | `PayWebhookDeliveriesResp` | `listWebhookDeliveries` | — |
| GET | `/v1/pay/webhooks/events` | yes | `page`, `pageSize` | `PayWebhookEventsResp` | `listWebhookEvents` | — |
| GET | `/v1/pay/webhooks/{webhookId}` | yes | — | `PayWebhook` | `getWebhook` | — |
| POST | `/v1/pay/webhooks/{webhookId}` | yes | `PayWebhookBody` | `PayWebhook` | `updateWebhook` | — |
| DELETE | `/v1/pay/webhooks/{webhookId}` | yes | — | `string` | `deleteWebhook` | `useWebhookMutations` |
| POST | `/v1/pay/webhooks/{webhookId}/enable` | yes | — | `string` | `enableWebhook` | `useWebhookMutations` |
| POST | `/v1/pay/webhooks/{webhookId}/disable` | yes | — | `string` | `disableWebhook` | `useWebhookMutations` |
| POST | `/v1/pay/webhooks/{webhookId}/rotate-secret` | yes | — | `PayWebhookRotateSecretResp` | `rotateWebhookSecret` | `useWebhookMutations` |
| POST | `/v1/pay/dev/simulateWebhook` | yes | `SimulateWebhookBody` | `SimulateWebhookResp` | `simulateWebhook` | `useWebhookMutations` |
| GET | `/v1/pay/links` | yes | `page`, `pageSize`, `q` | `PayPaymentLinksResp` | `listPaymentLinks` | `usePaymentLinksQuery` / `usePaymentLinksInfiniteQuery` |
| GET | `/v1/pay/links/overview` | yes | — | `PayPaymentLinksOverview` | `getPaymentLinksOverview` | `usePaymentLinksOverviewQuery` |
| POST | `/v1/pay/links` | yes | `PayPaymentLinkBody` (`default_address`) | `PayPaymentLink` | `createPaymentLink` | `usePaymentLinkMutations` |
| GET | `/v1/pay/links/default-addresses` | yes | — | `PayDefaultAddress[]` | `listDefaultAddresses` | `useDefaultAddressesQuery` |
| GET | `/v1/pay/links/{linkId}` | if session | — | `PayPaymentLink` (`icon`, `organization.logo`) | `getPaymentLink` | `usePaymentLinkQuery` |
| GET | `/v1/pay/links/{linkId}/stats` | yes | — | `PayPaymentLink` | `getPaymentLinkStats` | `usePaymentLinkStatsQuery` |
| GET | `/v1/pay/links/{linkId}/payments` | yes | `page`, `pageSize` | `{ total, totalPage, list: PayPaymentDetail[] }` | `listPaymentLinkPayments` | `usePaymentLinkPaymentsQuery` |
| GET | `/v1/pay/links/{linkId}/payments/export` | yes | — | CSV blob | `exportPaymentLinkPayments` | `useExportPaymentLinkPaymentsMutation` |
| DELETE | `/v1/pay/links/{linkId}` | yes | — | `string` | `deletePaymentLink` | `usePaymentLinkMutations` |
| POST | `/v1/pay/links/{linkId}/enable` | yes | — | `string` | `enablePaymentLink` | `usePaymentLinkMutations` |
| POST | `/v1/pay/links/{linkId}/disable` | yes | — | `string` | `disablePaymentLink` | `usePaymentLinkMutations` |
| POST | `/v1/pay/swap/link/{linkId}` | if session | `PaySwapParam` | `PaySwapResp` | `paySwapLink` | `usePaySwapQuery` |
| POST | `/v1/pay/swap/checkout/{sessionId}` | if session | `PaySwapParam` | `PaySwapResp` | `paySwapCheckout` | `usePaySwapQuery` |
| POST | `/v1/pay/swap/submit` | if session | `PaySwapSubmitParam` (`swapId`, `txHash`; `txHash` may be `""` for a multisig that has no on-chain hash yet) | `PaySwapSubmitResp` | `paySwapSubmit` | `PayView` (EOA one-shot) + `WaitingView` (after a watched proposal succeeds) |
| POST | `/v1/pay/checkout/sessions` | x-api-key | `PayCheckoutSessionBody` | `unknown` | `createCheckoutSession` | `useCreateCheckoutSessionMutation` |
| GET | `/v1/pay/checkout/sessions/{sessionId}` | if session | — | `PayCheckoutSession` (`organization.logo`) | `getCheckoutSession` | `useCheckoutSessionQuery` |
| GET | `/v1/pay/payments/{paymentId}` | if session | — | `PayPaymentDetail` | `getPayPayment` | `usePayPaymentQuery` |
| POST | `/v1/pay/single/quote` | yes | `PaySingleQuoteParam` | `PaySingleQuoteResp` | `singleQuote` | `useSinglePayQuote` |
| POST | `/v1/pay/single/swap` | yes | `PaySingleSwapParam` | `PaySingleSwapResp` | `singleSwap` | `useSinglePaySwap` |
| POST | `/v1/pay/single/submit` | yes | `PaySingleSubmitParam` | `void` | `singleSubmit` | commit queue |
| POST | `/v1/pay/batch/quote` | yes | `PayBatchQuoteParam` | `PayBatchQuoteResp` | `batchQuote` | `useBatchPayQuote` |
| POST | `/v1/pay/batch/swap` | yes | `PayBatchQuoteParam` | `PayBatchSwapResp` | `batchSwap` | `useBatchPaySwap` |
| POST | `/v1/pay/batch/submit` | yes | `PayBatchSubmitParam` | `void` | `batchSubmit` | commit queue |
| GET | `/v1/pay/payments/pending` | yes | — | `PayPaymentItem[]` | `getPendingPayments` | `usePendingPaymentsQuery` |
| GET | `/v1/pay/payments/recent` | yes | — | `PayPaymentItem[]` | `getRecentPayments` | `useRecentPaymentsQuery` |
| GET | `/v1/pay/payments/volume` | yes | `period` | `VolumePoint[]` | `getPaymentVolume` | `usePaymentVolumeQuery` |
| GET | `/v1/pay/payments/analytics` | yes | `period`, `type` | `OverviewPaymentsAnalytics` | `getOverviewPaymentsAnalytics` | `useOverviewPaymentsAnalyticsQuery` |
| GET | `/v1/pay/payments` | yes | `page`, `pageSize`, `q`, `status`, `token`, `start_time`, `end_time` | `PayPaymentsResp` | `getPayments` | `usePaymentsQuery` |
| GET | `/v1/pay/payments/export` | yes | `q`, `status`, `token`, `start_time`, `end_time` | CSV blob | `exportPayments` | `useExportPaymentsMutation` |
| GET | `/v1/pay/overview` | yes | — | `OverviewStats` | `getOverview` | `useOverviewQuery` |
| GET | `/v1/pay/analytics` | yes | `month` | `PayAnalyticsResp` | `getPayAnalytics` | `useAnalyticsQuery` |
| GET | `/v1/pay/recipient/list` | yes | — | `PayRecipient[]` | `listRecipients` | `useRecipientsQuery` |
| POST | `/v1/pay/recipient` | yes | `PayRecipientBody` | `PayRecipient` | `createRecipient` | `useRecipientMutations` |
| POST | `/v1/pay/recipient/{id}` | yes | `PayRecipientBody` | `PayRecipient` | `updateRecipient` | `useRecipientMutations` |
| DELETE | `/v1/pay/recipient/{id}` | yes | — | `void` | `deleteRecipient` | `useRecipientMutations` |
| GET | `/v1/pay/apiKeys` | yes | — | `PayApiKey[]` | `listApiKeys` | `useApiKeysQuery` |
| POST | `/v1/pay/apiKeys` | yes | `PayApiKeyBody` | `PayApiKey` | `createApiKey` | `useApiKeyMutations` |
| POST | `/v1/pay/apiKeys/{id}` | yes | `PayApiKeyBody` | `string` | `updateApiKey` | `useApiKeyMutations` |
| DELETE | `/v1/pay/apiKeys/{id}` | yes | — | `void` | `deleteApiKey` | `useApiKeyMutations` |
| GET | `/v1/pay/report/analytics` | yes | `start_time`, `end_time`, `api_key_id`, `link_id`, `network`, `type` | `ReportAnalyticsResp` | `getReportAnalytics` | `useReportAnalyticsQuery` |
| GET | `/v1/pay/report/payments` | yes | `page`, `pageSize`, `type`, `api_key_id`, `link_id`, `network`, `symbol`, `destination_network`, `destination_symbol`, `min_amount`, `max_amount` | `ReportPaymentsResp` | `getReportPayments` | `useReportPaymentsQuery` |
| GET | `/v1/pay/report/payments/export` | yes | `type`, `api_key_id`, `link_id`, `network`, `symbol`, `destination_network`, `destination_symbol`, `min_amount`, `max_amount` | CSV blob | `exportReportPayments` | `useExportReportPaymentsMutation` |
| POST | `/v1/pay/request` | yes | `PayCreateRequestParam` | `PayCreateRequestResp` | `createPayRequest` | `useCreatePayRequestMutation` |
| GET | `/v1/pay/request/{id}` | if session | — | `PayRequestItem` | `getPayRequest` | `usePayRequestDetailQuery` |
| GET | `/v1/pay/request/list` | yes | — | `PayRequestItem[]` | `getRequestPayments` | `useRequestPaymentsQuery` |
| POST | `/v1/pay/request/{id}/disable` | yes | — | `void` | `disablePayRequest` | `useDisablePayRequestMutation` |
| POST | `/v1/pay/request/withdraw` | yes | `PayWithdrawParam` | `void` | `withdrawPayRequest` | `useRequestWithdraw` |
| GET | `/v1/pay/request/withdraw/count` | yes | — | `{ count: number }` | `getRequestWithdrawCount` | `useRequestWithdrawCountQuery` |
| POST | `/v1/nearintents/quote` | yes | `NearintentsQuoteParam` | `NearintentsQuoteResp` | `nearintentsQuote` | `useRequestWithdraw` |
| POST | `/v1/nearintents/generate-intent` | yes | `NearintentsGenerateIntentParam` | `NearintentsGenerateIntentResp` | `nearintentsGenerateIntent` | `useRequestWithdraw` |
| POST | `/v1/nearintents/submit-intent` | yes | `NearintentsSubmitIntentParam` | `NearintentsSubmitIntentResp` | `nearintentsSubmitIntent` | unused by product withdraw |
| GET | `/v1/nearintents/status` | if session | `depositAddress` | `NearintentsStatusResp` | `nearintentsStatus` | unused by public waiting |
| POST | `/v3/private/withdraws` | 1Click user Bearer | `PrivateWithdrawRequest` | `{ order_id }` | `submitPrivateWithdraws` | Privacy Transfer |
| GET | `/v3/private/orders` | 1Click user Bearer | `signer_id`, `limit`, `offset` | `PrivateOrderPage` | `getPrivateOrders` | Privacy Transfer |

Types: `src/types/auth.ts` (`AuthUser`, `LoginBody`, `RegisterBody`, `AuthSession`, `ChangePasswordBody`, `ResetPasswordBody`, `ResetPasswordCodeBody`). Home overview: `src/types/overview.ts`. Payout types: `src/types/payout.ts`. Analytics: `src/types/analytics.ts`. Recipients: `src/types/recipient.ts`. API keys: `src/types/api-keys.ts`. Reports: `src/types/report.ts`. Organization: `src/types/organization.ts`. Webhooks: `src/types/webhooks.ts`. Payment links: `src/types/payment-links.ts`. Payer swap/checkout: `src/types/pay.ts`. Public swap `PaySwapParam` always sends `payer` and `refundTo`. Zcash uses the shielded Unified address (`u1`) as `payer` and the transparent address (`t1` / `t3`) as `refundTo`. Request Payment: `src/types/request-payment.ts`. Near Intents proxy: `src/types/nearintents.ts`. Settings `/settings` uses organization GET/POST and webhook list / create / delete / enable / disable / rotate-secret / simulateWebhook. Webhook deliveries, events, get-by-id, and update are wrapped for later UI. `GET /v1/nearintents/status` remains a 1Click proxy; public waiting polls `GET /v1/pay/payments/{paymentId}` instead. Single and batch quote bodies use `network` codes (`eth`, `arb`, `sol`, …) plus `token` from `GET /v1/pay/config`, not 1Click `assetId`. Near-chain `NEAR` still sends symbol `NEAR`. `PaySingleSwapResp` includes `depositAddress` and `orderId` (no `callData`, no `depositMemo`). `PayBatchSwapResp` nests broadcast fields in `transaction` (`approvals` may be `null`, `callData`, `batch_contract` as both payout `to` and ERC-20 spender; Near adds `receiverId` + `actions`; Solana adds `serializedTransaction` + `lastValidBlockHeight`). Single `memo` and `notifyEmail` belong on swap (and are optional on the shared quote type). Request Payment create sends required `name` (max 50) and optional `memo`. List/detail rows also map `payer`, `paid_at`, `destination_tx_hash`, and `withdraw_tx_hash`. The public payer page at `/paylink/:linkId` loads `GET /v1/pay/links/{linkId}` (`icon`, `organization.logo`) and calls `POST /v1/pay/swap/link/{linkId}` then `POST /v1/pay/swap/submit` with Bearer only when a session token exists. The retry queue always submits with `auth: false` so a later merchant JWT is never attached. Submit returns `payments_id`. Paylink waiting is `/paylink/:linkId/waiting?paymentId=` and polls `GET /v1/pay/payments/{paymentId}` (`processing` / `completed` / `failed`). `/checkout?sessionId=` loads `GET /v1/pay/checkout/sessions/{sessionId}` (`status` includes `created` / `processing` / `completed` / `failed` / `expired`, plus `payments_id`, plus `organization.logo`). The pay form shows when there is no `payments_id` and the session is not expired; `processing` and other statuses do not hide it. Otherwise the app goes to `/checkout/waiting`. Waiting polls `GET /v1/pay/payments/{paymentId}` when `paymentId` is present (URL or session `payments_id`) and only polls the checkout session when it is missing. Checkout `success_url` query includes payment `destination_txHash`, `paid_at`, and `tx_hash`. Waiting Total Fees / Total Payout come from `feesUsd` and `payoutUsd` query params on the waiting URL until the payment API returns those fields. There is no persisted payer-session store. The public paylink pay and waiting pages pass `icon` then `organization.logo` to `PayerLayout` `iconUrl`. Checkout pay and waiting pages still pass `organization.logo` only. Pending requests can be disabled with `POST /v1/pay/request/{id}/disable`. Batch `receives` use `address` (wallet, no `employeeId`). Payment list rows are snake_case (`submitted_at`, `destination_*`); mappers produce `PayPaymentItem`. Amount/Asset use destination fields. History `start_time` / `end_time` are unix seconds (start of first day, end of last day). History export uses the same filters (no pagination) via `GET /v1/pay/payments/export` (`httpBlob`); the saved filename appends a local `yyyyMMdd-HHmmss` stamp. Volume `period` is `day` / `week` / `month`; points may use `start_at` + `total_payment` instead of `label` / `value`. Origin token pickers use every chain from `GET /v1/pay/config`. Token catalogs come from that same config, not 1Click `/v0/tokens`. `/v1/nearintents/*` is our Partner-key proxy of 1Click `/v0`. Withdraw signs via generate-intent then `POST /v1/pay/request/withdraw`. The Pay sidebar polls `GET /v1/pay/request/withdraw/count` every 120s for the Request Payment badge. Authenticated users list and create API keys at `/api-keys` via `/v1/pay/apiKeys` with no Partner registration step. API key labels are max 200 characters. Rename (`POST /v1/pay/apiKeys/{id}`) returns a string; the list uses the submitted `name`. Reports stats use `GET /v1/pay/report/analytics` (`start_time` / `end_time` unix seconds, optional `api_key_id` / `network`). The usage table uses `GET /v1/pay/report/payments` (paginated; table filters only — no date range; `symbol` / `destination_symbol`). Amount filters map to `min_amount` / `max_amount`. CSV export is `GET /v1/pay/report/payments/export` with the same filters minus pagination. Time column is `submitted_at`. From is `payer`.

Public files:

| Path | Role |
| --- | --- |
| `src/lib/http.ts` | `fetch` wrapper (`http`, `httpBlob`) |
| `src/lib/http.test.ts` | Envelope, Bearer, 401, CSV blob |
| `src/lib/api-error.ts` | `ApiError` |
| `src/stores/auth.ts` | Product JWT session (Zustand persist) |
| `src/lib/query-client.ts` | Shared `QueryClient` |
| `src/api/config.ts` | `PAY_API_PREFIX`, `NEARINTENTS_API_PREFIX` |
| `src/api/query-keys.ts` | Query key factory |
| `src/api/auth.ts` | Login, register, profile, change / reset password (`mapAuthUser` includes `guideCompleted`) |
| `src/api/guide.ts` | Guide complete (`POST /v1/pay/guide/complete`) |
| `src/api/overview.ts` | Home stats (`GET /v1/pay/overview`) and payments analytics (`GET /v1/pay/payments/analytics`) |
| `src/api/payout.ts` | Single and batch quote / swap / submit; leftover payout overview mapper, volume, pending, recent, payments, export |
| `src/api/analytics.ts` | Analytics month query |
| `src/api/recipient.ts` | Address book list / create / update / delete |
| `src/api/api-keys.ts` | API key list / create / update / delete |
| `src/api/report.ts` | Reports analytics, payments list, and CSV export |
| `src/api/organization.ts` | Organization get / update |
| `src/api/webhooks.ts` | Webhook list, create, get, update, delete, enable, disable, rotate-secret, deliveries, events, simulateWebhook |
| `src/api/payment-links.ts` | Payment link list, create, get, delete, enable, disable |
| `src/api/pay.ts` | Payer swap/link, swap/checkout, swap submit |
| `src/api/pay-config.ts` | Public `GET /v1/pay/config` chain and token catalog |
| `src/hooks/use-pay-config.ts` | App-level config query; writes the intents-tokens store |
| `src/types/pay-config.ts` | Config chain / token types |
| `src/api/checkout.ts` | Checkout session create (x-api-key) and get |
| `src/api/nearintents.ts` | 1Click proxy: quote, generate-intent, submit-intent, status |
| `src/api/private-indexer.ts` | Confidential indexer: `/v3/private/withdraws`, `/v3/private/orders` (same-origin; not `http()`) |
| `src/api/request-payment.ts` | Create request, request detail, received list, disable, withdraw, withdraw count |
| `src/hooks/use-overview-api.ts` | Home overview stats + payments analytics queries |
| `src/hooks/use-auth-api.ts` | Auth mutations + profile query |
| `src/hooks/use-guide-api.ts` | Guide complete mutation |
| `src/hooks/use-single-payout-api.ts` | Single quote query + swap mutation |
| `src/hooks/use-batch-payout-api.ts` | Batch quote query + swap mutation |
| `src/hooks/use-payout-api.ts` | Overview, volume, recent, payments queries; export mutation |
| `src/hooks/use-pending-payments.ts` | Pending payouts query |
| `src/hooks/use-analytics-api.ts` | Analytics month query |
| `src/hooks/use-recipient-api.ts` | Recipient list + mutations |
| `src/hooks/use-api-keys-api.ts` | API keys query and create / update / delete mutations |
| `src/hooks/use-organization-api.ts` | Organization query and update mutation |
| `src/hooks/use-webhooks-api.ts` | Webhook list query and create / delete / enable / disable / rotate-secret / simulate mutations |
| `src/hooks/use-payment-links-api.ts` | Payment link list / stats / payments queries; create / delete / enable / disable / export mutations |
| `src/hooks/use-payment-link.ts` | Public payer payment-link detail query |
| `src/hooks/use-pay-quote-api.ts` | Payer swap query (link / checkout) |
| `src/hooks/use-checkout-session.ts` | Public checkout session query (optional poll until `payments_id`) |
| `src/hooks/use-checkout-api.ts` | Guide checkout-session create mutation (`x-api-key`) |
| `src/hooks/use-pay-payment.ts` | Public waiting payment-detail poll (`GET /v1/pay/payments/{paymentId}`) |
| `src/hooks/use-report-api.ts` | Reports analytics + payments queries and export mutation |
| `src/hooks/use-request-payment.ts` | Received list query, withdraw count query, create/disable mutations, payer detail query |
| `src/hooks/use-request-withdraw.ts` | Confidential withdraw mutation |
| `src/stores/auth.ts` | Product JWT session store |
| `src/stores/guide.ts` | Guide persist (`artifactsByUserId` payment link / API key / webhook, `skippedAllUserIds`). Completion is `AuthUser.guideCompleted` from profile / login. |
| `src/stores/nearintents-user-session.ts` | 1Click / Near Intents User-Session from wallet sign (not the product JWT, not a Partner JWT) |
| `src/stores/privacy-transfer-execution.ts` | Local Privacy Transfer snapshots (Zustand persist) |
| `src/types/overview.ts` | Home overview stats and payments analytics types |
| `src/types/auth.ts` | Auth types |
| `src/types/payout.ts` | Quick, batch, overview, volume, payment list, and export types |
| `src/types/analytics.ts` | Analytics response types |
| `src/types/recipient.ts` | Address book types |
| `src/types/api-keys.ts` | API key list / create / update types |
| `src/types/report.ts` | Reports analytics and payments types |
| `src/types/organization.ts` | Organization get / update types |
| `src/types/webhooks.ts` | Webhook list, create, deliveries, events, rotate-secret, and simulateWebhook types |
| `src/types/payment-links.ts` | Payment link list / create / detail types |
| `src/types/pay.ts` | Payer quote / swap / checkout session types |
| `src/types/pay-config.ts` | Public pay config chain / token types |
| `src/types/request-payment.ts` | Create / detail / list / withdraw / withdraw-count types |
| `src/types/nearintents.ts` | `/v1/nearintents` quote / generate-intent / submit / status |
