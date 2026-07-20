"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const booking = searchParams.get("booking");

  return (
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
  );
}

export default function ConfirmationPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <Suspense fallback={null}>
        <ConfirmationContent />
      </Suspense>
    </main>
  );
}
