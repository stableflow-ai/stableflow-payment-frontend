import { Fragment } from "react";
import { IconCopy } from "@stableflow/pay-ui/icons/outline/copy";
import useToast from "@/hooks/use-toast";
import { highlightTokenStyle, useHighlightedCode } from "@/hooks/use-highlighted-code";
import type { HighlightLanguage } from "@/utils";

export function DocsCodeBlock({
  code,
  language,
  label,
}: {
  code: string;
  language: HighlightLanguage;
  label?: string;
}) {
  const toast = useToast();
  const tokens = useHighlightedCode(code, language);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success({ title: "Copied" });
    } catch {
      toast.fail({ title: "Could not copy" });
    }
  };

  return (
    <div className="overflow-hidden rounded-[14px] bg-[#0F1B2D] shadow-[0_1px_2px_rgba(15,27,45,0.15)]">
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-5">
        <p className="min-w-0 truncate font-montserrat text-xs font-medium text-white/55">
          {label ?? language}
        </p>
        <button
          type="button"
          onClick={() => void copyCode()}
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-[8px] px-2 font-montserrat text-xs font-medium text-white/75 transition-[color,opacity,transform] duration-150 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.96]"
          aria-label={`Copy ${label ?? language} code`}
        >
          <IconCopy className="size-3" />
          Copy
        </button>
      </div>
      <div className="h-px bg-white/10" />
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[13px] leading-6 text-[#E3ECF8] md:px-5">
        {tokens
          ? tokens.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {line.map((token, tokenIndex) => (
                  <span key={tokenIndex} style={highlightTokenStyle(token)}>
                    {token.content}
                  </span>
                ))}
                {lineIndex < tokens.length - 1 ? "\n" : null}
              </Fragment>
            ))
          : code}
      </pre>
    </div>
  );
}
