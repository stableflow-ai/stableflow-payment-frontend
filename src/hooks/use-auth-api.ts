/**
 * Auth mutations and profile query.
 *   POST /v1/pay/auth/login
 *   POST /v1/pay/auth/register
 *   POST /v1/pay/auth/register/code
 *   POST /v1/pay/change-password
 *   POST /v1/pay/reset-password
 *   POST /v1/pay/reset-password/code
 *   GET  /v1/pay/profile
 *
 * Login / register / profile success writes the session to the Zustand auth
 * store (persist middleware). Views should still `mutateAsync` and then navigate.
 */
import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  changePassword,
  getProfile,
  login,
  register,
  resetPassword,
  sendRegisterCode,
  sendResetPasswordCode,
} from "@/api/auth";
import { queryKeys } from "@/api/query-keys";
import { useAuthStore } from "@/stores/auth";
import type { AuthUser } from "@/types/auth";

function isSameUser(left: AuthUser, right: AuthUser): boolean {
  return (
    left.id === right.id &&
    left.email === right.email &&
    left.name === right.name &&
    left.guideCompleted === right.guideCompleted
  );
}

export function useLoginMutation() {
  const applySession = useAuthStore((state) => state.applySession);
  return useMutation({
    mutationFn: login,
    onSuccess: (session) => {
      applySession(session.token, session.user);
    },
  });
}

export function useRegisterMutation() {
  const applySession = useAuthStore((state) => state.applySession);
  return useMutation({
    mutationFn: register,
    onSuccess: (session) => {
      applySession(session.token, session.user);
    },
  });
}

export function useSendRegisterCodeMutation() {
  return useMutation({
    mutationFn: sendRegisterCode,
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: changePassword,
  });
}

export function useSendResetPasswordCodeMutation() {
  return useMutation({
    mutationFn: sendResetPasswordCode,
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: resetPassword,
  });
}

export function useProfileQuery() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const applySession = useAuthStore((state) => state.applySession);

  const query = useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: getProfile,
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (!token || !query.data) return;
    if (user && isSameUser(user, query.data)) return;
    applySession(token, query.data);
  }, [applySession, query.data, token, user]);

  return query;
}
