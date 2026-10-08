import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@stableflow/pay-ui/button";
import { Icon2Right } from "@stableflow/pay-ui/icons/to-right";
import { useRegisterMutation, useSendRegisterCodeMutation } from "@/hooks/use-auth-api";
import useToast from "@/hooks/use-toast";
import { AuthShell } from "./AuthShell";
import {
  AuthBetaBanner,
  AuthField,
  AuthPasswordField,
  authErrorMessage,
  registerErrorMessage,
  AUTH_FORM_CLASS,
} from "./auth-shared";
import {
  AUTH_LINK_ACCENT_CLASS,
  AUTH_LINK_CLASS,
  CODE_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  SEND_CODE_COOLDOWN_SECONDS,
  SEND_CODE_TEXT_CLASS,
  emailRuleError,
  registerFormError,
} from "./config";
import { postAuthPath } from "./post-auth-path";
import { loginPathWithReturnTo, returnToFromSearch } from "./return-to";

export function RegisterView() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = returnToFromSearch(params.toString());
  const toast = useToast();
  const registerMutation = useRegisterMutation();
  const sendCodeMutation = useSendRegisterCodeMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [cooldownLeft, setCooldownLeft] = useState(0);

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

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const ruleError = registerFormError(name, email, password, confirmPassword, code);
    if (ruleError) {
      toast.fail({ title: ruleError });
      return;
    }
    try {
      const session = await registerMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password,
        code: code.trim(),
      });
      navigate(postAuthPath(session.user, null), { replace: true });
    } catch (cause) {
      toast.fail({
        title: registerErrorMessage(cause, "Unable to create account"),
      });
    }
  };

  return (
    <AuthShell panelTop={<AuthBetaBanner />}>
      <h1 className="text-center font-montserrat text-xl font-semibold text-black">
        Create account
      </h1>
      <form onSubmit={submit} className={AUTH_FORM_CLASS}>
        <AuthField
          id="name"
          label="Your name"
          value={name}
          onChange={setName}
          placeholder="Name"
          autoFocus
          autoComplete="name"
          maxLength={NAME_MAX_LENGTH}
        />
        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
          autoComplete="email"
          maxLength={EMAIL_MAX_LENGTH}
          className="mt-5"
        />
        <AuthPasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder={`${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters`}
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          className="mt-5"
        />
        <AuthPasswordField
          id="confirm-password"
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Keep the same with the password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX_LENGTH}
          className="mt-5"
        />
        <AuthField
          id="register-code"
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

        <Button
          type="submit"
          size="lg"
          loading={registerMutation.isPending}
          className="mt-7.5 w-full"
        >
          Create account
        </Button>

        <p className={`block ${AUTH_LINK_CLASS}`}>
          Already have an account?{" "}
          <Link
            to={loginPathWithReturnTo(returnTo)}
            className={`inline-flex items-center ${AUTH_LINK_ACCENT_CLASS}`}
          >
            Sign in
            <Icon2Right className="ml-1 text-[#606060]" />
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
