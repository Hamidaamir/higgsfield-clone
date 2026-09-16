"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { fetchCurrentUser, login, logout, signup } from "@/lib/api/auth";
import { queryKeys } from "@/lib/query-keys";
import type { User } from "@/types/auth";

/** Session state shared by the whole app; backed by GET /api/auth/me. */
export function useAuth() {
  const query = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60_000,
    retry: false,
  });
  return {
    user: query.data ?? null,
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/** Only allow same-site relative paths as post-login destinations. */
export function safeNextPath(next: string | null | undefined, fallback = "/generate/image"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

function useAuthSuccess() {
  const queryClient = useQueryClient();
  return (user: User) => {
    queryClient.setQueryData(queryKeys.auth.me, user);
  };
}

export function useSignup() {
  const onSuccess = useAuthSuccess();
  return useMutation({ mutationFn: signup, onSuccess: ({ user }) => onSuccess(user) });
}

export function useLogin() {
  const onSuccess = useAuthSuccess();
  return useMutation({ mutationFn: login, onSuccess: ({ user }) => onSuccess(user) });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      // Drop every cached user-scoped query, then land on the public home page.
      queryClient.setQueryData(queryKeys.auth.me, null);
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== "auth" && q.queryKey[0] !== "health" });
      router.push("/");
      router.refresh();
    },
  });
}
