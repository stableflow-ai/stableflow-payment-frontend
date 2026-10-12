import { useState, type PropsWithChildren, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconArrowDown } from "@stableflow/pay-ui/icons/outline/arrow-down";
import { Card } from "@stableflow/pay-ui/card";
import { Button } from "@stableflow/pay-ui/button";
import { Drawer } from "@stableflow/pay-ui/drawer";
import { DRAWER_SIDE } from "@stableflow/pay-ui/drawer";
import { cn } from "@/lib/utils";
import { DocsCodeBlock } from "./components/DocsCodeBlock";
import { DocsTable } from "./components/DocsTable";
import { DocsTableOfContents } from "./components/DocsTableOfContents";
import {
  ADDITIONAL_FIELDS_TABLE,
  API_BASE_PATH_CODE,
  API_KEY_HEADER_CODE,
  API_REFERENCE_TABLE,
  CHECKOUT_OPTIONS_TABLE,
  COMMON_ERRORS_TABLE,
  CONTRACT_NOTES_TABLE,
  CREATE_SESSION_BACKEND_CODE,
  CREATE_SESSION_CODE,
  CREATE_SESSION_RESPONSE_CODE,
  DOCS_TOC_ITEMS,
  type DocsTocId,
  ENVIRONMENT_CODE,
  ENVIRONMENTS_TABLE,
  FLOAT_AMOUNT_CODE,
  PAYMENT_STATUSES_TABLE,
  REDIRECT_CODE,
  REQUIRED_FIELDS_TABLE,
  RESPONSE_PARSER_CODE,
  RETRY_GUIDANCE_TABLE,
  SESSION_STATUSES_TABLE,
  SESSION_STATUS_CODE,
  SESSION_STATUS_RESPONSE_CODE,
  SESSION_VALUES_CODE,
  STRING_AMOUNT_CODE,
  SUCCESS_RESPONSE_CODE,
  TOKENS_CURL_CODE,
  TOKENS_ENDPOINT_CODE,
  TOKENS_RESPONSE_CODE,
  VERIFY_WEBHOOK_CODE,
  WEBHOOK_EVENT_CODE,
  WEBHOOK_EVENTS_TABLE,
  WEBHOOK_HANDLER_CODE,
  WEBHOOK_HEADERS_CODE,
} from "./config";
import { useDocsToc } from "./useDocsToc";

function DocsSection({
  id,
  title,
  children,
}: PropsWithChildren<{
  id: string;
  title: string;
}>) {
  const headingId = `${id}-heading`;
  return (
    <Card id={id} aria-labelledby={headingId} className="scroll-mt-6 px-5 py-6 md:px-9 md:py-8">
      <h2
        id={headingId}
        tabIndex={-1}
        className="text-balance font-montserrat text-[22px] font-semibold leading-snug tracking-[-0.01em] text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 md:text-2xl"
      >
        {title}
      </h2>
      <div className="mt-6 space-y-6">{children}</div>
    </Card>
  );
}

function Subheading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-balance font-montserrat text-base font-semibold leading-snug tracking-[-0.005em] text-foreground md:text-lg">
      {children}
    </h3>
  );
}

function Paragraph({ children }: { children: ReactNode }) {
  return (
    <p className="max-w-[75ch] break-words font-montserrat text-sm font-normal leading-[1.75] text-foreground/70">
      {children}
    </p>
  );
}

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="break-words rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[12px] font-medium text-[#1F6FD6]">
      {children}
    </code>
  );
}

function DocsCallout({
  children,
  label = "Note",
  tone = "info",
}: {
  children: ReactNode;
  label?: string;
  tone?: "info" | "warning";
}) {
  return (
    <div
      role="note"
      className={cn(
        "rounded-[12px] border px-4 py-3.5 font-montserrat text-sm leading-[1.7]",
        tone === "warning"
          ? "border-[#EBD9AE] bg-[#FFFBF2] text-[#77590F]"
          : "border-primary/25 bg-primary/[0.06] text-[#1F5C9E]",
      )}
    >
      <p className="font-semibold text-current">{label}</p>
      <div className="mt-1 font-normal">{children}</div>
    </div>
  );
}

const bodyListClassName =
  "max-w-[75ch] space-y-2 pl-5 font-montserrat text-sm font-normal leading-[1.75] text-foreground/70 marker:font-semibold marker:text-primary";

const docsLinkClassName =
  "font-medium text-[#1F6FD6] underline decoration-[#1F6FD6]/30 underline-offset-2 hover:decoration-current focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 font-montserrat text-[16px] font-medium text-black transition-opacity hover:opacity-70"
    >
      <span
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white"
        aria-hidden
      >
        <IconArrowDown className="size-3 rotate-90 text-black" />
      </span>
      Back
    </button>
  );
}

export function DocsView() {
  const navigate = useNavigate();
  const { activeId, navigateTo } = useDocsToc();
  const [tocOpen, setTocOpen] = useState(false);

  const navigateFromDrawer = (id: DocsTocId) => {
    setTocOpen(false);
    navigateTo(id);
  };

  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx;
    if (typeof idx === "number" && idx > 0) {
      navigate(-1);
      return;
    }
    navigate("/login");
  };

  return (
    <div className="min-h-svh bg-[#f6f6f6] text-black">
      <div className="mx-auto w-full max-w-[1240px] px-2.5 pb-12 pt-2.5 sm:px-4 md:px-6 lg:px-2.5">
        <div className="grid w-full items-start gap-6 lg:grid-cols-[232px_minmax(0,1fr)]">
          <aside className="sticky top-6 hidden min-w-0 lg:block">
            <div className="mb-4">
              <BackButton onClick={goBack} />
            </div>
            <DocsTableOfContents activeId={activeId} onNavigate={navigateTo} />
          </aside>

          <article className="min-w-0 space-y-6">
            <div className="lg:hidden">
              <BackButton onClick={goBack} />
            </div>
            <Button
          variant="normal"
          size="lg"
          className="w-full justify-between focus-visible:ring-2 focus-visible:ring-primary/50 lg:hidden"
          aria-haspopup="dialog"
          aria-expanded={tocOpen}
          onClick={() => setTocOpen(true)}
        >
          Browse sections
          <span className="max-w-[60%] truncate text-xs font-normal text-foreground/55">
            {DOCS_TOC_ITEMS.find((item) => item.id === activeId)?.label}
          </span>
        </Button>
        <Drawer
          open={tocOpen}
          onClose={() => setTocOpen(false)}
          side={DRAWER_SIDE.Bottom}
          title="Browse sections"
          contentClassName="p-0"
        >
          <DocsTableOfContents
            activeId={activeId}
            onNavigate={navigateFromDrawer}
            cardClassName="rounded-none border-0 bg-transparent p-0 shadow-none"
          />
        </Drawer>

        <DocsSection id="overview" title="StableFlow Pay API">
          <Paragraph>Accept stablecoin payments with a hosted checkout page.</Paragraph>
          <Paragraph>
            Your backend creates a Checkout Session. StableFlow returns a checkout URL, the customer completes the
            payment, and your backend confirms the result.
          </Paragraph>
          <DocsCallout label="Integration outcome">
            Follow the shortest path to create and open a Checkout Session. Payment confirmation can take longer,
            depending on the selected network and environment.
          </DocsCallout>
          <div className="space-y-3">
            <Subheading>Choose the right option</Subheading>
            <DocsTable definition={CHECKOUT_OPTIONS_TABLE} />
          </div>
          <Paragraph>
            This guide covers the <strong className="font-semibold text-foreground">Checkout API</strong>.
          </Paragraph>
        </DocsSection>

        <DocsSection id="quick-start" title="Quickstart">
          <Paragraph>Use this path to create and open your first test Checkout Session:</Paragraph>
          <ol className={`list-decimal ${bodyListClassName}`}>
            <li>Choose a receive asset from the live token list.</li>
            <li>Create a Checkout Session from your backend.</li>
            <li>Open the exact hosted checkout URL returned by the API.</li>
            <li>Read the initial Session status from your backend.</li>
          </ol>

          <div className="space-y-3">
            <Subheading>Before you start</Subheading>
            <Paragraph>In the StableFlow Pay dashboard:</Paragraph>
            <ol className={`list-decimal ${bodyListClassName}`}>
              <li>
                Open{" "}
                <Link to="/settings" className={docsLinkClassName}>
                  Settings → Developer (sign-in required)
                </Link>
                .
              </li>
              <li>
                For webhook confirmation, configure an HTTPS URL and store the signing secret when it is shown. You
                can complete this quickstart with the status endpoint first.
              </li>
              <li>
                <Link to="/api-keys" className={docsLinkClassName}>
                  Create an API key (sign-in required)
                </Link>
                .
              </li>
              <li>Choose a receiving address that you control on the destination network.</li>
            </ol>
          </div>

          <div className="space-y-3">
            <Subheading>Choose an environment</Subheading>
            <DocsTable definition={ENVIRONMENTS_TABLE} />
          </div>
          <Paragraph>Set the test endpoint, key, receiving address, and return URL in your backend shell:</Paragraph>
          <DocsCodeBlock code={ENVIRONMENT_CODE} language="bash" />
          <Paragraph>
            <InlineCode>SUCCESS_URL</InlineCode> must be an HTTPS page you control.
          </Paragraph>
          <DocsCallout label="Security note">
            Keep your API key on the server. Never expose it in browser or mobile code. A test API host does not prove
            that blockchain transactions use testnet assets.
          </DocsCallout>

          <div className="space-y-3">
            <Subheading>Check the receive asset</Subheading>
            <Paragraph>
              Fetch the current token list and choose a <InlineCode>symbol</InlineCode> and{" "}
              <InlineCode>network</InlineCode> pair with <InlineCode>support_receive: true</InlineCode>.
            </Paragraph>
            <DocsCodeBlock code={TOKENS_CURL_CODE} language="bash" />
          </div>

          <div className="space-y-3">
            <Subheading>Create the test Session</Subheading>
            <Paragraph>
              The example uses <InlineCode>USDC</InlineCode> on <InlineCode>base</InlineCode>. First confirm that this
              pair currently has <InlineCode>support_receive: true</InlineCode> in the token endpoint.
            </Paragraph>
            <DocsCodeBlock code={CREATE_SESSION_CODE} language="bash" />
            <Paragraph>
              Expected response from the supplied contract; this POST was not live-verified while preparing this page:
            </Paragraph>
            <DocsCodeBlock code={CREATE_SESSION_RESPONSE_CODE} language="json" label="Expected response" />
          </div>

          <Paragraph>
            Save <InlineCode>session_id</InlineCode>, <InlineCode>session_url</InlineCode>, and{" "}
            <InlineCode>expires_at</InlineCode> with your order. Open the returned URL, then fulfill only after a
            verified webhook or status lookup reports <InlineCode>completed</InlineCode>.
          </Paragraph>
          <div className="space-y-3">
            <Subheading>Open and confirm</Subheading>
            <Paragraph>Copy the real values from the response into your test shell:</Paragraph>
            <DocsCodeBlock code={SESSION_VALUES_CODE} language="bash" />
            <Paragraph>
              Open the exact <InlineCode>SESSION_URL</InlineCode> and confirm that checkout loads. Compare any amount,
              asset, network, or recipient shown with your order. The hosted checkout UI was not live-verified while
              preparing this page. Then query the same Session from your backend:
            </Paragraph>
            <DocsCodeBlock code={SESSION_STATUS_CODE} language="bash" />
            <Paragraph>
              Minimum fields expected by the current payer client; a valid-Session response was not live-verified:
            </Paragraph>
            <DocsCodeBlock code={SESSION_STATUS_RESPONSE_CODE} language="json" label="Expected status response" />
            <Paragraph>
              For this initial check, require a successful HTTP response, <InlineCode>code: 200</InlineCode>, the same
              <InlineCode>data.session_id</InlineCode>, and <InlineCode>data.status: created</InlineCode>.
            </Paragraph>
            <DocsCallout label="Funds safety" tone="warning">
              Stop before connecting a funded wallet or submitting a transaction. This product does not publish a
              StableFlow support destination. Do not run an end-to-end payment until your team has a verified support
              channel and written approval for the network, assets, and funding method used in testing.
            </DocsCallout>
            <Paragraph>
              The quickstart is complete when the hosted checkout opens and your backend observes the same{" "}
              <InlineCode>session_id</InlineCode> with status <InlineCode>created</InlineCode>. A controlled end-to-end
              payment test is complete only after that same Session reaches <InlineCode>completed</InlineCode>.
            </Paragraph>
          </div>
          <DocsCallout label="Before you retry" tone="warning">
            Session creation does not publish an idempotency guarantee or a lookup by{" "}
            <InlineCode>out_order_no</InlineCode>. If the request times out, do not retry automatically. Follow a
            manually approved recovery process; if none exists, stop and resolve that contract gap before production.
          </DocsCallout>
        </DocsSection>

        <DocsSection id="create-checkout-session" title="1. Create a Checkout Session">
          <Paragraph>
            Create Sessions from trusted backend code. Derive the amount and order ID from your server-side order,
            and keep the receive asset, network, and recipient in trusted configuration.
          </Paragraph>
          <DocsCodeBlock code={CREATE_SESSION_BACKEND_CODE} language="javascript" label="Node.js backend" />
          <DocsCallout label="Server-side validation">
            Do not trust a browser-submitted total, receive asset, or recipient address. Validate them against your
            order and merchant configuration before calling StableFlow.
          </DocsCallout>
          <Paragraph>
            The supplied contract states that the customer can choose any supported payment asset on the hosted page
            while you receive the <InlineCode>amount</InlineCode>, <InlineCode>symbol</InlineCode>, and{" "}
            <InlineCode>network</InlineCode> defined in the Session. Before production, verify the received amount,
            fees, exchange-rate timing, and destination transaction in an approved end-to-end test.
          </Paragraph>

          <div className="space-y-3">
            <Subheading>Required fields</Subheading>
            <DocsTable definition={REQUIRED_FIELDS_TABLE} />
          </div>
          <div className="space-y-3">
            <Subheading>Additional fields</Subheading>
            <DocsTable definition={ADDITIONAL_FIELDS_TABLE} />
          </div>
          <Paragraph>
            <InlineCode>success_url</InlineCode> is a browser return URL, not a webhook endpoint.
          </Paragraph>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <Paragraph>Use strings for amounts:</Paragraph>
              <DocsCodeBlock code={STRING_AMOUNT_CODE} language="json" label="Correct" />
            </div>
            <div className="space-y-3">
              <Paragraph>Do not send floating-point numbers:</Paragraph>
              <DocsCodeBlock code={FLOAT_AMOUNT_CODE} language="json" label="Incorrect" />
            </div>
          </div>
        </DocsSection>

        <DocsSection id="redirect-customer" title="2. Redirect the customer">
          <Paragraph>
            Redirect the customer to the exact <InlineCode>session_url</InlineCode> returned by StableFlow:
          </Paragraph>
          <DocsCodeBlock code={REDIRECT_CODE} language="javascript" />
          <Paragraph>
            In this example, <InlineCode>checkoutUrl</InlineCode> is the <InlineCode>session_url</InlineCode> your
            browser received from your own backend. Never construct this URL yourself.
          </Paragraph>
          <DocsCallout label="Security note">Do not add the API key to the URL.</DocsCallout>

          <div className="space-y-3">
            <Subheading>Browser return behavior</Subheading>
            <Paragraph>
              The hosted checkout can return the customer to <InlineCode>success_url</InlineCode> with display context
              after checkout. Treat the return as navigation only.
            </Paragraph>
            <DocsCallout label="Display only" tone="warning">
              Treat every return URL query parameter as untrusted display data. Confirm payment again on your backend;
              confirm redirect timing and the exact parameter contract before production.
            </DocsCallout>
          </div>
        </DocsSection>

        <DocsSection id="confirm-payment" title="3. Confirm the payment">
          <Paragraph>
            The customer&apos;s arrival at <InlineCode>success_url</InlineCode> does{" "}
            <strong className="font-semibold text-foreground">not</strong> confirm payment.
          </Paragraph>
          <Paragraph>Confirm payment using either:</Paragraph>
          <ul className={`list-disc ${bodyListClassName}`}>
            <li>
              A verified <InlineCode>payment.success</InlineCode> webhook; or
            </li>
            <li>The Checkout Session status endpoint.</li>
          </ul>
          <DocsCodeBlock code={SESSION_STATUS_CODE} language="bash" />
          <DocsCallout label="Test environment">
            The current test API accepts Session and Payment lookups without an API key. Confirm the production access
            policy before launch, and do not add <InlineCode>Bearer</InlineCode> unless StableFlow publishes that
            requirement.
          </DocsCallout>
          <Paragraph>
            Fulfill the order only when the Session status is <InlineCode>completed</InlineCode>.
          </Paragraph>
          <div className="space-y-3">
            <Subheading>Session statuses</Subheading>
            <DocsTable definition={SESSION_STATUSES_TABLE} />
          </div>
          <div className="space-y-3">
            <Subheading>Payment statuses</Subheading>
            <Paragraph>
              If the Session contains <InlineCode>payments_id</InlineCode>, use the Payment endpoint for source and
              destination transaction details.
            </Paragraph>
            <Paragraph>
              These are the statuses recognized by the current payer client. Confirm transition and finality rules
              before production.
            </Paragraph>
            <DocsTable definition={PAYMENT_STATUSES_TABLE} />
          </div>
          <Paragraph>
            If a Session is <InlineCode>failed</InlineCode> or <InlineCode>expired</InlineCode>, create a new Session.
          </Paragraph>
        </DocsSection>

        <DocsSection id="receive-webhooks" title="4. Receive webhooks">
          <Paragraph>Configure either:</Paragraph>
          <ul className={`list-disc ${bodyListClassName}`}>
            <li>One URL for every selected event type; or</li>
            <li>Separate URLs for different event types.</li>
          </ul>
          <Paragraph>
            Webhook URLs are configured in the dashboard, not in the Checkout Session request. Store the signing
            secret when it is shown; it is displayed only when created or rotated.
          </Paragraph>
          <Paragraph>
            The supplied API contract documents <InlineCode>payment.success</InlineCode> and{" "}
            <InlineCode>payment.failed</InlineCode>. The current dashboard also offers{" "}
            <InlineCode>payment.abandoned</InlineCode>; confirm its delivery contract before subscribing.
          </Paragraph>
          <DocsTable definition={WEBHOOK_EVENTS_TABLE} />
          <Paragraph>Example event:</Paragraph>
          <DocsCodeBlock code={WEBHOOK_EVENT_CODE} language="json" />

          <div className="space-y-3">
            <Subheading>Verify the signature</Subheading>
            <Paragraph>The supplied API contract specifies these webhook headers:</Paragraph>
            <DocsCodeBlock code={WEBHOOK_HEADERS_CODE} language="http" />
            <Paragraph>Verify the HMAC-SHA256 signature before processing the event:</Paragraph>
            <DocsCodeBlock code={VERIFY_WEBHOOK_CODE} language="javascript" />
          </div>
          <DocsCallout label="Signature input">
            Use the exact raw request body. Do not parse and re-serialize it before verification.
          </DocsCallout>
          <Paragraph>With Express, register a raw-body route before a global JSON parser:</Paragraph>
          <DocsCodeBlock code={WEBHOOK_HANDLER_CODE} language="javascript" label="Express integration skeleton" />
          <Paragraph>
            Implement <InlineCode>processStableFlowEventOnce</InlineCode> with a database unique constraint on event{" "}
            <InlineCode>id</InlineCode>. Persist the event and order update before returning, and queue slower business
            work.
          </Paragraph>
          <DocsCallout label="Replay protection" tone="warning">
            Signature verification alone does not reject an old, replayed request. Confirm the allowed timestamp skew,
            then reject stale timestamps and persist each event <InlineCode>id</InlineCode> with a unique constraint.
          </DocsCallout>
          <Paragraph>After verification:</Paragraph>
          <ol className={`list-decimal ${bodyListClassName}`}>
            <li>
              Deduplicate events using the top-level <InlineCode>id</InlineCode>.
            </li>
            <li>
              Update the order using <InlineCode>out_order_no</InlineCode>.
            </li>
            <li>
              Return a <InlineCode>2xx</InlineCode> response quickly.
            </li>
          </ol>
          <Paragraph>
            The supplied API contract states that webhook delivery is attempted once. Confirm production retry and
            replay behavior before launch. Keep your own delivery and processing logs, and use Session status
            reconciliation to recover a missed event.
          </Paragraph>
        </DocsSection>

        <DocsSection id="errors-and-retries" title="Errors and retries">
          <Paragraph>
            Check both the HTTP status and the response envelope <InlineCode>code</InlineCode>. A successful HTTP
            response can still contain an API error.
          </Paragraph>
          <DocsCodeBlock code={RESPONSE_PARSER_CODE} language="javascript" label="Response parser" />
          <div className="space-y-3">
            <Subheading>Known errors</Subheading>
            <DocsTable definition={COMMON_ERRORS_TABLE} />
          </div>
          <div className="space-y-3">
            <Subheading>Retry safely</Subheading>
            <DocsTable definition={RETRY_GUIDANCE_TABLE} />
          </div>
          <DocsCallout label="Timeouts are ambiguous" tone="warning">
            A network timeout or <InlineCode>5xx</InlineCode> does not prove that Session creation failed. Do not retry
            the POST automatically until StableFlow confirms duplicate-request and idempotency behavior.
          </DocsCallout>
        </DocsSection>

        <DocsSection id="supported-assets" title="Supported assets">
          <Paragraph>Do not hard-code the asset list. Retrieve it from:</Paragraph>
          <DocsCodeBlock code={TOKENS_ENDPOINT_CODE} language="http" />
          <DocsCodeBlock code={TOKENS_CURL_CODE} language="bash" />
          <Paragraph>A token entry currently uses this shape:</Paragraph>
          <DocsCodeBlock code={TOKENS_RESPONSE_CODE} language="json" label="Example token response" />
          <Paragraph>For each token and network:</Paragraph>
          <ul className={`list-disc ${bodyListClassName}`}>
            <li>
              <InlineCode>support_payment: true</InlineCode> means the customer can pay with it.
            </li>
            <li>
              <InlineCode>support_receive: true</InlineCode> means you can receive it.
            </li>
          </ul>
          <Paragraph>
            The <InlineCode>symbol</InlineCode> and <InlineCode>network</InlineCode> used to create a Checkout Session must
            have <InlineCode>support_receive: true</InlineCode>.
          </Paragraph>
          <Paragraph>
            Use <InlineCode>decimals</InlineCode> and <InlineCode>contract_address</InlineCode> as asset metadata. The
            endpoint does not publish the Checkout API&apos;s amount minimum, maximum, or rounding policy.
          </Paragraph>
        </DocsSection>

        <DocsSection id="contract-notes" title="Contract notes">
          <Paragraph>
            The test flow above targets the repository&apos;s test API and requires a provisioned API key. The following
            production behaviors are not fully specified by the current public contract and must be confirmed before
            launch.
          </Paragraph>
          <DocsTable definition={CONTRACT_NOTES_TABLE} />
          <DocsCallout label="Production gate" tone="warning">
            Do not launch until the environment, idempotency, amount, authentication, webhook, and retry rules are
            confirmed in a versioned API contract.
          </DocsCallout>
        </DocsSection>

        <DocsSection id="api-reference" title="API reference">
          <Paragraph>All paths use:</Paragraph>
          <DocsCodeBlock code={API_BASE_PATH_CODE} language="text" />
          <DocsTable definition={API_REFERENCE_TABLE} />
          <Paragraph>Successful responses use this format:</Paragraph>
          <DocsCodeBlock code={SUCCESS_RESPONSE_CODE} language="json" />
          <Paragraph>
            Always check both the HTTP status and response <InlineCode>code</InlineCode>.
          </Paragraph>

          <div className="space-y-3">
            <Subheading>Authentication</Subheading>
            <Paragraph>Send the complete API key:</Paragraph>
            <DocsCodeBlock code={API_KEY_HEADER_CODE} language="http" />
            <Paragraph>
              Do not add <InlineCode>Bearer</InlineCode>.
            </Paragraph>
            <Paragraph>
              Each API key belongs to one Organization. Sessions and payments created with that key are recorded under
              the same Organization.
            </Paragraph>
          </div>
        </DocsSection>

        <DocsSection id="production-checklist" title="Go-live checklist">
          <ul className={`list-disc ${bodyListClassName}`}>
            <li>Use the confirmed production base URL and a production-only API key.</li>
            <li>Keep the API key on trusted backend infrastructure.</li>
            <li>Retrieve supported assets instead of hard-coding them.</li>
            <li>Verify that the recipient belongs to the selected destination network.</li>
            <li>Confirm amount precision, limits, fees, rate timing, and Session expiry.</li>
            <li>Confirm Session creation idempotency before enabling automatic retries.</li>
            <li>Record a verified support destination and a manual recovery process for ambiguous requests.</li>
            <li>Confirm the production authentication policy for status lookups.</li>
            <li>Verify webhook signatures using the raw request body.</li>
            <li>Reject stale webhook timestamps using the agreed replay window.</li>
            <li>
              Deduplicate webhook events by event <InlineCode>id</InlineCode>.
            </li>
            <li>
              Fulfill orders only after a verified success event or <InlineCode>completed</InlineCode> status.
            </li>
            <li>Reconcile Sessions when a webhook is missing.</li>
            <li>Test duplicate events, timeouts, failures, expiry, and customer abandonment.</li>
            <li>Run an end-to-end payment only on a network and funding method approved for testing.</li>
            <li>Keep browser return parameters out of fulfillment decisions.</li>
          </ul>
          <DocsCallout label="Ready to launch">
            You are ready when every checklist item has a verified test result and the remaining contract notes are
            resolved for your production account.
          </DocsCallout>
        </DocsSection>
      </article>
        </div>
      </div>
    </div>
  );
}

export default DocsView;
