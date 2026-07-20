"use client";

// A client component because this is a static export — there's no server
// to read the query string, so we read it from the browser after Stripe
// (or router.push) redirects here.
import { useSearchParams } from "next/navigation";

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const booking = searchParams.get("booking");

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl font-medium">
          You're booked!
        </h1>
        <p className="mt-3 text-ink/70">
          Confirmation #{booking?.slice(0, 8) ?? ""} — we'll email you the
          details and reach out if we have any questions before your
          service date.
        </p>
      </div>
    </main>
  );
}
