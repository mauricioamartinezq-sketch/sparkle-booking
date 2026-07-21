"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SERVICES } from "@/lib/pricing";

type BookingRow = {
  id: string;
  services: { serviceId: string; quantity: number }[];
  scheduled_date: string;
  estimated_total: number;
  status: string;
  deposit_paid: boolean;
};

function serviceLabel(id: string) {
  return SERVICES.find((s) => s.id === id)?.label ?? id;
}

export default function BookingsPage() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSignedIn(false);
        setLoading(false);
        return;
      }
      setSignedIn(true);

      // Only this user's own (claimed) customer row — never unclaimed
      // guest rows belonging to someone else.
      const { data: customer, error: custErr } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (custErr) {
        setError(custErr.message);
        setLoading(false);
        return;
      }

      if (!customer) {
        setBookings([]);
        setLoading(false);
        return;
      }

      const { data: bookingRows, error: bookingErr } = await supabase
        .from("bookings")
        .select(
          "id, services, scheduled_date, estimated_total, status, deposit_paid"
        )
        .eq("customer_id", customer.id)
        .order("scheduled_date", { ascending: false });

      if (bookingErr) {
        setError(bookingErr.message);
      } else {
        setBookings(bookingRows ?? []);
      }
      setLoading(false);
    }

    load();
  }, []);

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-medium">My bookings</h1>

        {loading && <p className="mt-6 text-ink/60">Loading…</p>}

        {!loading && !signedIn && (
          <div className="mt-6">
            <p className="text-ink/70">Sign in to see your bookings.</p>
            <Link
              href="/login/"
              className="mt-4 inline-flex rounded-xl bg-aqua-500 px-6 py-3 text-white font-medium hover:bg-aqua-700 transition-colors"
            >
              Sign in
            </Link>
          </div>
        )}

        {!loading && signedIn && error && (
          <p className="mt-6 text-sm text-red-600">{error}</p>
        )}

        {!loading && signedIn && !error && bookings.length === 0 && (
          <div className="mt-6">
            <p className="text-ink/70">
              No bookings yet under this account.
            </p>
            <Link
              href="/booking/"
              className="mt-4 inline-flex rounded-xl bg-aqua-500 px-6 py-3 text-white font-medium hover:bg-aqua-700 transition-colors"
            >
              Book a service
            </Link>
          </div>
        )}

        {!loading && signedIn && bookings.length > 0 && (
          <div className="mt-8 space-y-4">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-aqua-100 bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {new Date(b.scheduled_date).toLocaleDateString(
                      undefined,
                      { year: "numeric", month: "long", day: "numeric" }
                    )}
                  </p>
                  <span className="text-xs uppercase tracking-wide rounded-full bg-aqua-50 px-3 py-1 text-aqua-700">
                    {b.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink/60">
                  {b.services.map((s) => serviceLabel(s.serviceId)).join(", ")}
                </p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-ink/60">
                    {b.deposit_paid
                      ? "Deposit paid"
                      : "No deposit required"}
                  </span>
                  <span className="font-medium">
                    ${b.estimated_total.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
