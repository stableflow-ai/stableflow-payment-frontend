import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PayerLayout(props: {
  iconUrl?: string | null;
  footer?: ReactNode;
  headerEnd?: ReactNode;
  children?: ReactNode;
}) {
  const iconUrl = props.iconUrl?.trim() || "";

  return (
    <div className="flex min-h-svh flex-col bg-[#f6f6f6] px-4 py-8 md:px-6 md:py-10">
      <div className="flex justify-end">{props.headerEnd}</div>
      {props.children ? (
        <div className="flex flex-1 flex-col items-center justify-center">
          {iconUrl ? (
            <div className="mb-7 flex justify-center">
              <div className="flex h-7 max-w-[140px] items-center justify-center">
                <img
                  src={iconUrl}
                  alt=""
                  className="h-7 max-w-[140px] object-contain"
                />
              </div>
            </div>
          ) : null}
          {props.children}
          {props.footer ? (
            <p className="mt-6 max-w-[480px] text-center font-montserrat text-sm font-medium text-[#606060]">
              {props.footer}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex-1" />
      )}
      <p
        className={cn(
          "pt-10 text-center font-montserrat text-xs leading-none text-[#70788a]",
          props.footer ? "mt-4" : "mt-auto",
        )}
      >
        Powered by Pay.StableFlow
      </p>
    </div>
  );
}
