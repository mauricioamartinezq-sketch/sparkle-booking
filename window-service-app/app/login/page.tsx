"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Status = "checking" | "signed-out" | "signed-in" | "claiming";

function LoginContent() {
  const [status, setStatus] = useState<Status>("checking");
  const [email, setEmail] = useState<string | null>(null);
  const [claimedCount, setClaimedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function handleSession() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !user.email) {
        setStatus("signed-out");
        return;
      }

      setEmail(user.email);
      setStatus("claiming");

      // Link any guest bookings made with this email to the logged-in account.
      // Only rows with auth_user_id IS NULL can be claimed — this is enforced
      // both here and by the RLS policy on `customers`.
      const { data, error: claimErr } = await supabase
        .from("customers")
        .update({ auth_user_id: user.id })
        .eq("email", user.email)
        .is("auth_user_id", null)
        .select();

      if (claimErr) {
        setError(claimErr.message);
      } else {
        setClaimedCount(data?.length ?? 0);
      }
      setStatus("signed-in");
    }

    handleSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      handleSession();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithGoogle() {
    const supabase = createClient();
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${basePath}/login/`,
      },
    });
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setStatus("signed-out");
    setEmail(null);
    setClaimedCount(null);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <h1 className="font-display text-3xl font-medium">
          {status === "signed-in" ? "You're signed in" : "Sign in"}
        </h1>

        {status === "checking" || status === "claiming" ? (
          <p className="mt-4 text-ink/60">One moment…</p>
        ) : null}

        {status === "signed-out" && (
          <>
            <p className="mt-3 text-ink/70">
              Sign in to see your booking history and manage upcoming jobs.
            </p>
            <button
              onClick={signInWithGoogle}
              className="mt-6 w-full rounded-xl bg-aqua-500 py-3 text-white font-medium hover:bg-aqua-700 transition-colors"
            >
              Continue with Google
            </button>
          </>
        )}

        {status === "signed-in" && (
          <>
            <p className="mt-3 text-ink/70">Signed in as {email}</p>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
            {claimedCount !== null && claimedCount > 0 && (
              <p className="mt-2 text-sm text-aqua-700">
                Linked {claimedCount} previous booking
                {claimedCount === 1 ? "" : "s"} to your account.
              </p>
            )}
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/booking/"
                className="w-full rounded-xl bg-aqua-500 py-3 text-white font-medium hover:bg-aqua-700 transition-colors"
              >
                Book a service
              </Link>
              <button
                onClick={signOut}
                className="w-full rounded-xl border border-aqua-100 py-3 text-ink/70 font-medium hover:bg-aqua-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
