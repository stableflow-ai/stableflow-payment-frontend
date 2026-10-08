export const AUTH_PANEL_BG = "#F6F6F6";

export const AUTH_FORM_CLASS = "flex w-full max-w-[400px] flex-col mt-15";

export const AUTH_LABEL_CLASS = "font-montserrat text-[14px] font-medium text-[#909090] leading-[100%]";

export const AUTH_INPUT_CLASS =
  "h-[42px] w-full rounded-[6px] border border-[#e3e3e3] bg-white px-4 font-montserrat text-sm font-medium text-black outline-none placeholder:text-black/30 focus:border-[#c8c8c8]";

export const AUTH_LINK_CLASS =
  "mt-6.5 text-center font-montserrat text-sm font-medium text-[#909090]";

export const AUTH_LINK_ACCENT_CLASS = "text-[#3f8afb] hover:text-[#3f8afb]/90";

export const NAME_MAX_LENGTH = 50;
export const EMAIL_MAX_LENGTH = 100;
export const CODE_MAX_LENGTH = 20;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 50;
export const SEND_CODE_COOLDOWN_SECONDS = 60;
export const SEND_CODE_TEXT_CLASS =
  "font-montserrat text-sm font-medium text-[#6284F5] disabled:opacity-30";
export const RESET_PASSWORD_VARIANT = {
  Guest: "guest",
  Authed: "authed",
} as const;
export type ResetPasswordVariant =
  (typeof RESET_PASSWORD_VARIANT)[keyof typeof RESET_PASSWORD_VARIANT];
export const RESET_PASSWORD_DIALOG_CARD_CLASS =
  "md:w-[min(100%,420px)] gap-4 rounded-[20px] border-white bg-[#fdfdfd] px-7 py-8 shadow-[0_0_20px_rgba(0,0,0,0.06)]";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function nameRuleError(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Name is required";
  if (trimmed.length > NAME_MAX_LENGTH) {
    return `Name must be at most ${NAME_MAX_LENGTH} characters`;
  }
  return null;
}

export function emailRuleError(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Email is required";
  if (trimmed.length > EMAIL_MAX_LENGTH) {
    return `Email must be at most ${EMAIL_MAX_LENGTH} characters`;
  }
  if (!EMAIL_PATTERN.test(trimmed)) return "Enter a valid email";
  return null;
}

export function codeRuleError(code: string): string | null {
  const trimmed = code.trim();
  if (!trimmed) return "Verification code is required";
  if (trimmed.length > CODE_MAX_LENGTH) {
    return `Verification code must be at most ${CODE_MAX_LENGTH} characters`;
  }
  return null;
}

export function passwordRuleError(password: string): string | null {
  if (!password) return "Password is required";
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be ${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters`;
  }
  return null;
}

export function confirmPasswordRuleError(
  password: string,
  confirmPassword: string,
): string | null {
  return confirmPassword === password ? null : "Passwords do not match";
}

export function loginFormError(email: string, password: string): string | null {
  return emailRuleError(email) ?? passwordRuleError(password);
}

export function registerFormError(
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
  code: string,
): string | null {
  return (
    nameRuleError(name) ??
    emailRuleError(email) ??
    passwordRuleError(password) ??
    confirmPasswordRuleError(password, confirmPassword) ??
    codeRuleError(code)
  );
}

export function guestResetFormError(
  email: string,
  code: string,
  newPassword: string,
  confirmPassword: string,
): string | null {
  return (
    emailRuleError(email) ??
    codeRuleError(code) ??
    passwordRuleError(newPassword) ??
    confirmPasswordRuleError(newPassword, confirmPassword)
  );
}

export function authedResetFormError(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): string | null {
  return (
    passwordRuleError(currentPassword) ??
    passwordRuleError(newPassword) ??
    confirmPasswordRuleError(newPassword, confirmPassword)
  );
}
