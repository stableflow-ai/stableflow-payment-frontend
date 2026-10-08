import type { ReactNode } from "react";
import { useState } from "react";
import { ApiError } from "@/lib/api-error";
import { IconAlert } from "@stableflow/pay-ui/icons/alert";
import { IconEye, IconEyeHidden } from "@stableflow/pay-ui/icons/eye";
import { cn } from "@/lib/utils";
import {
  AUTH_FORM_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
} from "./config";

export function AuthBetaBanner() {
  return (
    <div className="inline-flex h-8 items-center gap-2 rounded-full bg-[rgba(63,138,251,0.2)] px-3">
      <span
        className="grid size-3.5 shrink-0 place-items-center rounded-full bg-[#3f8afb] text-white"
        aria-hidden
      >
        <IconAlert className="h-[7px] w-[2px]" />
      </span>
      <span className="font-montserrat text-sm font-medium text-[#3f8afb]">
        Payment is currently in beta.
      </span>
    </div>
  );
}

export function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoFocus,
  readOnly = false,
  autoComplete,
  maxLength,
  trailing,
  className,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  maxLength?: number;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative leading-[100%]", className)}>
      <label htmlFor={id} className={AUTH_LABEL_CLASS}>
        {label}
      </label>
      <div className="relative mt-3">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          readOnly={readOnly}
          maxLength={maxLength}
          autoComplete={autoComplete ?? (type === "password" ? "current-password" : "on")}
          className={cn(AUTH_INPUT_CLASS, trailing && "pr-12")}
        />
        {trailing ? (
          <div className="absolute inset-y-0 right-3 flex items-center">{trailing}</div>
        ) : null}
      </div>
    </div>
  );
}

export function AuthPasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  maxLength,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <AuthField
      id={id}
      label={label}
      type={visible ? "text" : "password"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      maxLength={maxLength}
      className={className}
      trailing={
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
          className="text-[#909090]"
        >
          {visible ? <IconEye /> : <IconEyeHidden />}
        </button>
      }
    />
  );
}

const CODE_LEN_VALIDATION = "Field validation for 'Code' failed on the 'len' tag";

export function authErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function registerErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  const message = authErrorMessage(error, fallback);
  if (message.includes(CODE_LEN_VALIDATION)) return "The verification code is invalid.";
  return message;
}

export { AUTH_FORM_CLASS };
