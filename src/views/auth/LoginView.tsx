import { type FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@stableflow/pay-ui/button";
import { Icon2Right } from "@stableflow/pay-ui/icons/outline/to-right";
import { useLoginMutation } from "@/hooks/use-auth-api";
import useToast from "@/hooks/use-toast";
import { AuthShell } from "./AuthShell";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import {
  AuthBetaBanner,
  AuthField,
  AuthPasswordField,
  authErrorMessage,
  AUTH_FORM_CLASS,
} from "./auth-shared";
import {
  AUTH_LINK_ACCENT_CLASS,
  AUTH_LINK_CLASS,
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  RESET_PASSWORD_VARIANT,
  loginFormError,
} from "./config";
import { postAuthPath } from "./post-auth-path";
import { registerPathWithReturnTo, returnToFromSearch } from "./return-to";

export function LoginView() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = returnToFromSearch(params.toString());
  const toast = useToast();
  const loginMutation = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const ruleError = loginFormError(email, password);
    if (ruleError) {
      toast.fail({ title: ruleError });
      return;
    }
    try {
      const session = await loginMutation.mutateAsync({ email: email.trim(), password });
      navigate(postAuthPath(session.user, returnTo), { replace: true });
    } catch (cause) {
      toast.fail({
        title: authErrorMessage(cause, "Unable to sign in"),
      });
    }
  };

  return (
    <AuthShell panelTop={<AuthBetaBanner />}>
      <h1 className="text-center font-montserrat text-xl font-semibold text-black">
        Welcome to StableFlow | Payment
      </h1>
      <form onSubmit={submit} className={AUTH_FORM_CLASS}>
        <AuthField
          id="email"
          label="Sign in by Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
          autoFocus
          autoComplete="email"
          maxLength={EMAIL_MAX_LENGTH}
        />
        <AuthPasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="At least 8 characters"
          autoComplete="current-password"
          maxLength={PASSWORD_MAX_LENGTH}
          className="mt-5"
        />

        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="mt-2.5 inline-flex items-center font-montserrat text-xs font-medium text-[#909090] hover:text-[#606060]"
        >
          Forgot Password?
          <Icon2Right className="ml-1" />
        </button>

        <Button
          type="submit"
          size="lg"
          loading={loginMutation.isPending}
          className="mt-7.5 w-full"
        >
          Sign in
        </Button>

        <p className={`block ${AUTH_LINK_CLASS}`}>
          <span className="font-normal">New to StableFlow | </span>
          <span className="font-semibold">Payment</span>?{" "}
          <Link
            to={registerPathWithReturnTo(returnTo)}
            className={`inline-flex items-center ${AUTH_LINK_ACCENT_CLASS}`}
          >
            Create an account
            <Icon2Right className="ml-1 text-[#606060]" />
          </Link>
        </p>
      </form>

      <ResetPasswordDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        variant={RESET_PASSWORD_VARIANT.Guest}
      />
    </AuthShell>
  );
}
