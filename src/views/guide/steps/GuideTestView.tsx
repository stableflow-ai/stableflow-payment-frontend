import { Fragment, useState } from "react";
import { IconCheck } from "@stableflow/pay-ui/icons/outline/check";
import { IconCopy } from "@stableflow/pay-ui/icons/outline/copy";
import { Button } from "@stableflow/pay-ui/button";
import { BUTTON_SIZE } from "@stableflow/pay-ui/button";
import { useCreateCheckoutSessionMutation } from "@/hooks/use-checkout-api";
import { useCompleteGuideMutation } from "@/hooks/use-guide-api";
import useToast from "@/hooks/use-toast";
import {
  highlightTokenStyle,
  useHighlightedCode,
} from "@/hooks/use-highlighted-code";
import { cn } from "@/lib/utils";
import type { HighlightToken } from "@/utils";
import {
  GUIDE_STEPS,
  GUIDE_TEST_LANG,
  GUIDE_TEST_LANG_OPTIONS,
  GUIDE_TEST_SAMPLE,
  type GuideTestLang,
} from "../config";
import { GuideDrawer } from "../GuideDrawer";
import { useGuideFlow } from "../guide-flow";
import { useGuideProgress } from "../hooks/use-guide-progress";
import {
  buildGuideTestSnippet,
  formatGuideJson,
  guideErrorMessage,
  guideSnippetLanguage,
} from "../utils";

function HighlightedCodeLines({
  tokens,
  plain,
}: {
  tokens: HighlightToken[][] | null;
  plain: string;
}) {
  if (!tokens) return <>{plain}</>;
  return (
    <>
      {tokens.map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {line.map((token, tokenIndex) => (
            <span key={tokenIndex} style={highlightTokenStyle(token)}>
              {token.content}
            </span>
          ))}
          {lineIndex < tokens.length - 1 ? "\n" : null}
        </Fragment>
      ))}
    </>
  );
}

export function GuideTestView() {
  const { go } = useGuideFlow();
  const toast = useToast();
  const { apiKey } = useGuideProgress();
  const createSession = useCreateCheckoutSessionMutation();
  const completeGuide = useCompleteGuideMutation();
  const [lang, setLang] = useState<GuideTestLang>(GUIDE_TEST_LANG.Node);
  const [result, setResult] = useState<string | null>(null);
  const [passed, setPassed] = useState(false);

  const key = apiKey?.key ?? "";
  const snippet = buildGuideTestSnippet(lang, key);
  const snippetTokens = useHighlightedCode(snippet, guideSnippetLanguage(lang));
  const resultIsJson = result !== null && result.trim().startsWith("{");
  const resultTokens = useHighlightedCode(
    result ?? "",
    resultIsJson ? "json" : "text",
    "github-light",
  );
  const fileName = GUIDE_TEST_LANG_OPTIONS.find((option) => option.value === lang)?.fileName ?? "server.js";

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success({ title: "Copied" });
    } catch {
      toast.fail({ title: "Could not copy" });
    }
  }

  async function runTest() {
    if (!key) {
      toast.fail({ title: "Create an API key before running the test" });
      return;
    }
    try {
      const data = await createSession.mutateAsync({
        apiKey: key,
        body: {
          amount: GUIDE_TEST_SAMPLE.amount,
          network: GUIDE_TEST_SAMPLE.network,
          out_order_no: "",
          recipient: GUIDE_TEST_SAMPLE.recipient,
          success_url: GUIDE_TEST_SAMPLE.successUrl,
          symbol: GUIDE_TEST_SAMPLE.symbol,
        },
      });
      setResult(formatGuideJson(data));
      try {
        await completeGuide.mutateAsync();
        setPassed(true);
      } catch (error) {
        setPassed(false);
        toast.fail({ title: guideErrorMessage(error, "Could not mark the guide complete") });
      }
    } catch (error) {
      setPassed(false);
      setResult(guideErrorMessage(error, "Could not create checkout session"));
    }
  }

  function finish() {
    go("/");
  }

  return (
    <GuideDrawer title={GUIDE_STEPS[3].drawerTitle}>
      <div className="flex flex-col">
        <div className="grid h-[50px] grid-cols-3 rounded-[12px] bg-[#f2f2f2] p-[5px]">
          {GUIDE_TEST_LANG_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setLang(option.value)}
              className={cn(
                "rounded-[10px] font-montserrat text-sm font-medium text-black",
                lang === option.value && "border border-[#e3e3e3] bg-white",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-7 overflow-hidden rounded-[12px] bg-black">
          <div className="flex items-center justify-between px-7 pt-5">
            <p className="font-montserrat text-sm font-medium text-[#aaa]">{fileName}</p>
            <button
              type="button"
              onClick={() => void copySnippet()}
              className="inline-flex items-center gap-1.5 font-montserrat text-sm font-medium text-white"
            >
              <IconCopy className="size-3.5 text-white" />
              Copy
            </button>
          </div>
          <div className="mt-4 h-px w-full bg-white/15" />
          <pre className="overflow-x-auto px-7 py-5 font-montserrat text-sm font-medium leading-[1.5] whitespace-pre-wrap text-white">
            <HighlightedCodeLines tokens={snippetTokens} plain={snippet} />
          </pre>
        </div>

        <div className="mt-7 flex min-h-[399px] flex-col rounded-[12px] border border-[#e3e3e3] bg-white">
          <div className="flex items-center justify-between px-7 pt-4">
            <p className="font-montserrat text-sm font-medium text-[#aaa]">Test Result</p>
            {passed ? (
              <span className="inline-flex items-center gap-1.5 font-montserrat text-sm font-medium text-[#769400]">
                <IconCheck className="h-[11px] w-3.5" />
                Running
              </span>
            ) : null}
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center px-6 py-6">
            {result ? (
              <pre className="w-full self-start overflow-auto font-montserrat text-sm font-medium leading-[1.5] whitespace-pre-wrap text-black">
                <HighlightedCodeLines tokens={resultTokens} plain={result} />
              </pre>
            ) : (
              <p className="text-center font-montserrat text-sm font-medium text-[#AAA]">
                Run the request to verify your API key.
              </p>
            )}
          </div>
        </div>

        <Button
          size={BUTTON_SIZE.Lg}
          className="mt-8 w-full"
          loading={createSession.isPending || completeGuide.isPending}
          onClick={() => {
            if (passed) finish();
            else void runTest();
          }}
        >
          {passed ? "Get Ready" : "Run Test"}
        </Button>
      </div>
    </GuideDrawer>
  );
}

export default GuideTestView;
