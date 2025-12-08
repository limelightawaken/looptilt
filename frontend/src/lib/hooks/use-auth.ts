"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function useAuth() {
  const { data: session, isPending: isLoading } = useSession();
  const router = useRouter();

  const isAuthenticated = !!session?.user;
  const user = session?.user;

  const logout = async () => {
    await signOut();
    router.push("/signin");
  };

  return {
    user,
    session,
    isAuthenticated,
    isLoading,
    logout,
  };
}
