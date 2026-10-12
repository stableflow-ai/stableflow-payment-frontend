import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@stableflow/pay-ui/button";
import { Dialog } from "@stableflow/pay-ui/dialog";
import { Icon2Right } from "@stableflow/pay-ui/icons/outline/to-right";
import {
  useChangePasswordMutation,
  useResetPasswordMutation,
  useSendResetPasswordCodeMutation,
} from "@/hooks/use-auth-api";
import useToast from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AuthField, AuthPasswordField, authErrorMessage } from "./auth-shared";
import {
  AUTH_LINK_ACCENT_CLASS,
  AUTH_LINK_CLASS,
  CODE_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  RESET_PASSWORD_DIALOG_CARD_CLASS,
  RESET_PASSWORD_VARIANT,
  SEND_CODE_COOLDOWN_SECONDS,
  SEND_CODE_TEXT_CLASS,
  authedResetFormError,
  emailRuleError,
  guestResetFormError,
  type ResetPasswordVariant,
} from "./config";

export function ResetPasswordDialog({
  open,
  onClose,
  variant,
}: {
  open: boolean;
  onClose: () => void;
  variant: ResetPasswordVariant;
}) {
  const toast = useToast();
  const sendCodeMutation = useSendResetPasswordCodeMutation();
  const resetPasswordMutation = useResetPasswordMutation();
  const changePasswordMutation = useChangePasswordMutation();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cooldownLeft, setCooldownLeft] = useState(0);

  useEffect(() => {
    if (open) return;
    setEmail("");
    setCode("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setCooldownLeft(0);
  }, [open]);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownLeft((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownLeft]);

  const sendCode = async () => {
    const ruleError = emailRuleError(email);
    if (ruleError) {
      toast.fail({ title: ruleError });
      return;
    }
    try {
      await sendCodeMutation.mutateAsync({ email: email.trim() });
      setCooldownLeft(SEND_CODE_COOLDOWN_SECONDS);
      toast.success({ title: "Verification code sent" });
    } catch (cause) {
      toast.fail({
        title: authErrorMessage(cause, "Unable to send verification code"),
      });
    }
  };

  const submitGuest = async (event: FormEvent) => {
    event.preventDefault();
    const ruleError = guestResetFormError(email, code, newPassword, confirmPassword);
    if (ruleError) {
      toast.fail({ title: ruleError });
      return;
    }
    try {
      await resetPasswordMutation.mutateAsync({
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });
      toast.success({ title: "Password updated" });
      onClose();
    } catch (cause) {
      toast.fail({
        title: authErrorMessage(cause, "Unable to reset password"),
      });
    }
  };

  const submitAuthed = async (event: FormEvent) => {
    event.preventDefault();
    const ruleError = authedResetFormError(currentPassword, newPassword, confirmPassword);
    if (ruleError) {
      toast.fail({ title: ruleError });
      return;
    }
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      toast.success({ title: "Password updated" });
      onClose();
    } catch (cause) {
      toast.fail({
        title: authErrorMessage(cause, "Unable to change password"),
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Reset password"
      cardClassName={RESET_PASSWORD_DIALOG_CARD_CLASS}
    >
      {variant === RESET_PASSWORD_VARIANT.Guest ? (
        <>
          <p className="font-montserrat text-sm font-medium text-[#909090]">
            Enter your email and verification code, then set a new password.
          </p>
          <form onSubmit={submitGuest} className="mt-6">
            <AuthField
              id="reset-email"
              label="Signed Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@company.com"
              autoComplete="email"
              autoFocus
              maxLength={EMAIL_MAX_LENGTH}
            />
            <AuthField
              id="reset-code"
              label="Verify Code"
              value={code}
              onChange={setCode}
              placeholder="Code"
              autoComplete="one-time-code"
              maxLength={CODE_MAX_LENGTH}
              trailing={
                <button
                  type="button"
                  disabled={cooldownLeft > 0 || sendCodeMutation.isPending}
                  onClick={() => {
                    void sendCode();
                  }}
                  className={SEND_CODE_TEXT_CLASS}
                >
                  {cooldownLeft > 0 ? `${cooldownLeft}s` : "Send Code"}
                </button>
              }
              className="mt-5"
            />
            <AuthPasswordField
              id="reset-guest-new-password"
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              className="mt-5"
            />
            <AuthPasswordField
              id="reset-guest-confirm-password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Keep the same with the new password"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              className="mt-5"
            />
            <Button
              type="submit"
              size="lg"
              loading={resetPasswordMutation.isPending}
              className="mt-7.5 w-full"
            >
              Continue
            </Button>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "mt-6.5 flex w-full items-center justify-center gap-2",
                AUTH_LINK_CLASS,
                AUTH_LINK_ACCENT_CLASS,
              )}
            >
              <Icon2Right className="rotate-180 text-[#606060]" />
              Back to login
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="font-montserrat text-sm font-medium text-[#909090]">
            Enter your current password and create a new password below.
          </p>
          <form onSubmit={submitAuthed}>
            <AuthPasswordField
              id="reset-current-password"
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="At least 8 characters"
              autoComplete="current-password"
              maxLength={PASSWORD_MAX_LENGTH}
            />
            <AuthPasswordField
              id="reset-new-password"
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              className="mt-5"
            />
            <AuthPasswordField
              id="reset-confirm-password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Keep the same with the new password"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              className="mt-5"
            />
            <Button
              type="submit"
              size="lg"
              loading={changePasswordMutation.isPending}
              className="mt-7.5 w-full"
            >
              Continue
            </Button>
          </form>
        </>
      )}
    </Dialog>
  );
}
