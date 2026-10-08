import { PAY_API_PREFIX } from "@/api/config";
import { apiNumber, apiText, asRecord } from "@/api/map";
import { http } from "@/lib/http";
import type {
  AuthSession,
  AuthUser,
  ChangePasswordBody,
  LoginBody,
  RegisterBody,
  RegisterCodeBody,
  ResetPasswordBody,
  ResetPasswordCodeBody,
} from "@/types/auth";

export function mapAuthUser(raw: unknown): AuthUser {
  const row = asRecord(raw) ?? {};
  return {
    id: apiNumber(row.id) ?? 0,
    email: apiText(row.email),
    name: apiText(row.name),
    guideCompleted: row.guide_completed === true || row.guideCompleted === true,
  };
}

export function mapAuthSession(raw: unknown): AuthSession {
  const row = asRecord(raw) ?? {};
  return {
    token: apiText(row.token),
    user: mapAuthUser(row.user),
  };
}

export async function login(body: LoginBody) {
  return mapAuthSession(
    await http<unknown>(`${PAY_API_PREFIX}/auth/login`, {
      method: "POST",
      body,
      auth: false,
    }),
  );
}

export async function register(body: RegisterBody) {
  return mapAuthSession(
    await http<unknown>(`${PAY_API_PREFIX}/auth/register`, {
      method: "POST",
      body,
      auth: false,
    }),
  );
}

export function sendRegisterCode(body: RegisterCodeBody) {
  return http<void>(`${PAY_API_PREFIX}/auth/register/code`, {
    method: "POST",
    body,
    auth: false,
  });
}

export function changePassword(body: ChangePasswordBody) {
  return http<void>(`${PAY_API_PREFIX}/change-password`, {
    method: "POST",
    body,
  });
}

export function sendResetPasswordCode(body: ResetPasswordCodeBody) {
  return http<void>(`${PAY_API_PREFIX}/reset-password/code`, {
    method: "POST",
    body,
    auth: false,
  });
}

export function resetPassword(body: ResetPasswordBody) {
  return http<void>(`${PAY_API_PREFIX}/reset-password`, {
    method: "POST",
    body,
    auth: false,
  });
}

export async function getProfile() {
  return mapAuthUser(await http<unknown>(`${PAY_API_PREFIX}/profile`));
}
