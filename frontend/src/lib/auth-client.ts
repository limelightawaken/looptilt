import { createAuthClient } from "better-auth/react";

const AUTH_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const AUTH_PATH = "/api/auth";

export const authClient = createAuthClient({
  baseURL: AUTH_URL,
  basePath: AUTH_PATH,
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;

type AuthResult<T = unknown> = {
  data?: T;
  error?: { message: string };
};

async function authFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<AuthResult<T>> {
  try {
    const response = await fetch(`${AUTH_URL}${AUTH_PATH}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        error: { message: (data as { message?: string }).message || "Request failed" },
      };
    }

    return { data: data as T };
  } catch (err) {
    return {
      error: { message: err instanceof Error ? err.message : "Request failed" },
    };
  }
}

export async function forgetPassword(params: { email: string; redirectTo?: string }) {
  return authFetch("/forget-password", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function resetPassword(params: { token: string; newPassword: string }) {
  return authFetch("/reset-password", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function verifyEmail(params: { token: string }) {
  return authFetch(`/verify-email?token=${encodeURIComponent(params.token)}`, {
    method: "GET",
  });
}
