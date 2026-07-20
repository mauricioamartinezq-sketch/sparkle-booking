"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SERVICES, ServiceId, estimateTotal, depositDue } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/client";

type Quantities = Partial<Record<ServiceId, number>>;

export default function BookingPage() {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Quantities>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, qty]) => (qty ?? 0) > 0)
        .map(([serviceId, quantity]) => ({
          serviceId: serviceId as ServiceId,
          quantity: quantity!,
        })),
    [quantities]
  );

  const total = useMemo(() => estimateTotal(selected), [selected]);
  const deposit = useMemo(() => depositDue(total), [total]);

  function setQty(id: ServiceId, qty: number) {
    setQuantities((prev) => ({ ...prev, [id]: qty }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (selected.length === 0) {
      setError("Pick at least one service.");
      return;
    }
    if (!name || !email || !phone || !address || !preferredDate) {
      setError("Fill in your contact details and preferred date.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();

      // 1. Upsert the customer by email
      const { data: customer, error: custErr } = await supabase
        .from("customers")
        .upsert({ name, email, phone }, { onConflict: "email" })
        .select()
        .single();
      if (custErr) throw custErr;

      // 2. Create the property
      const { data: property, error: propErr } = await supabase
        .from("properties")
        .insert({ customer_id: customer.id, address })
        .select()
        .single();
      if (propErr) throw propErr;

      // 3. Create the booking (server recalculates the authoritative total)
      const { data: booking, error: bookingErr } = await supabase
        .from("bookings")
        .insert({
          customer_id: customer.id,
          property_id: property.id,
          services: selected,
          scheduled_date: preferredDate,
          estimated_total: total,
          status: "pending",
        })
        .select()
        .single();
      if (bookingErr) throw bookingErr;

      if (deposit > 0) {
        // 4a. Large job — call the Supabase Edge Function to create a
        // Stripe deposit checkout session (this is a static site, so
        // there's no Next.js server to do this — Supabase does it instead)
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout-session`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ bookingId: booking.id }),
          }
        );
        const { url } = await res.json();
        window.location.href = url;
      } else {
        // 4b. Small job — confirmed immediately, invoiced after service
        const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
        router.push(`/booking/confirmation/?booking=${booking.id}`);
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-2xl px-6 py-16 space-y-10"
      >
        <div>
          <h1 className="font-display text-3xl font-medium">
            Build your estimate
          </h1>
          <p className="mt-2 text-ink/60">
            Enter rough quantities — we'll confirm exact pricing after a
            quick look at your property.
          </p>
        </div>

        <section className="space-y-4">
          {SERVICES.map((svc) => (
            <div
              key={svc.id}
              className="flex items-center justify-between rounded-xl border border-aqua-100 bg-card p-4"
            >
              <div>
                <p className="font-medium">{svc.label}</p>
                <p className="text-sm text-ink/60">{svc.description}</p>
              </div>
              <input
                type="number"
                min={0}
                placeholder="0"
                className="w-24 rounded-lg border border-aqua-100 px-3 py-2 text-right"
                value={quantities[svc.id] ?? ""}
                onChange={(e) =>
                  setQty(svc.id, Number(e.target.value) || 0)
                }
              />
            </div>
          ))}
        </section>

        <section className="grid sm:grid-cols-2 gap-4">
          <input
            required
            placeholder="Full name"
            className="rounded-lg border border-aqua-100 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            required
            type="email"
            placeholder="Email"
            className="rounded-lg border border-aqua-100 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            required
            type="tel"
            placeholder="Phone"
            className="rounded-lg border border-aqua-100 px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            required
            type="date"
            className="rounded-lg border border-aqua-100 px-3 py-2"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
          />
          <input
            required
            placeholder="Property address"
            className="sm:col-span-2 rounded-lg border border-aqua-100 px-3 py-2"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </section>

        <section className="rounded-xl bg-aqua-50 p-5">
          <div className="flex justify-between text-ink/70">
            <span>Estimated total</span>
            <span className="font-medium text-ink">
              ${total.toFixed(2)}
            </span>
          </div>
          {deposit > 0 ? (
            <div className="mt-1 flex justify-between text-sm text-aqua-700">
              <span>Deposit due to book (50%)</span>
              <span>${deposit.toFixed(2)}</span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-aqua-700">
              No deposit needed — pay after the job is done.
            </p>
          )}
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-aqua-500 py-3 text-white font-medium hover:bg-aqua-700 transition-colors disabled:opacity-60"
        >
          {submitting
            ? "Submitting…"
            : deposit > 0
            ? "Continue to deposit payment"
            : "Confirm booking"}
        </button>
      </form>
    </main>
  );
}
