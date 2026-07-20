import Link from "next/link";
import { SERVICES } from "@/lib/pricing";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-16">
        <p className="font-sans text-sm font-medium tracking-wide text-aqua-700 uppercase">
          Booking made simple
        </p>
        <h1 className="mt-4 font-display text-5xl sm:text-6xl font-medium text-ink leading-[1.05]">
          A cleaner home,
          <br />
          without the phone tag.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-ink/70">
          Window cleaning, pressure washing, soft washing, gutter cleaning,
          and holiday lights — booked online in a couple of minutes, done
          while you're at work.
        </p>
        <Link
          href="/booking"
          className="mt-8 inline-flex items-center rounded-xl bg-aqua-500 px-6 py-3 text-white font-medium hover:bg-aqua-700 transition-colors"
        >
          Get an instant estimate
        </Link>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="font-display text-2xl font-medium mb-6">Services</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map((svc) => (
            <div
              key={svc.id}
              className="rounded-xl bg-card border border-aqua-100 p-5"
            >
              <h3 className="font-display text-lg font-medium">
                {svc.label}
              </h3>
              <p className="mt-1 text-sm text-ink/60">{svc.description}</p>
              <p className="mt-3 text-xs text-aqua-700">
                From ${svc.minimumPrice}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="rounded-xl bg-aqua-900 text-white p-8 sm:p-10">
          <h2 className="font-display text-2xl font-medium">How it works</h2>
          <ol className="mt-4 space-y-2 text-white/80">
            <li>1. Pick your services and property details</li>
            <li>2. Get an instant estimate and pick a date</li>
            <li>
              3. Jobs over $1,000 need a 50% deposit to lock the date — smaller
              jobs are invoiced after the work is done
            </li>
            <li>4. We show up, you get your time back</li>
          </ol>
        </div>
      </section>
    </main>
  );
}
