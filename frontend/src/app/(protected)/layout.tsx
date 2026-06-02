"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { AppHeader } from "@/components/layout/app-header";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/signin");
    }
  }, [session, isPending, router]);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/signin");
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory-cream dark:bg-eerie-black">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-foreground" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ivory-cream text-foreground dark:bg-eerie-black">
      <AppHeader
        userName={session.user.name || "Creator"}
        userEmail={session.user.email}
        onSignOut={handleSignOut}
      />
      <main>{children}</main>
    </div>
  );
}
