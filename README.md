# Sparkle — home services booking app (GitHub Pages edition)

Booking app for window cleaning, pressure washing, soft washing, gutter
cleaning, and holiday lights. Statically exported Next.js PWA, hosted free
on **GitHub Pages**, backed by **Supabase** (database + auth + Edge
Functions) and **Stripe** (deposit payments).

## Why this version looks different from a typical Next.js app

GitHub Pages only serves static files — it can't run a Node server. So:

- `output: "export"` in `next.config.mjs` builds the whole site to plain
  HTML/JS/CSS in an `out/` folder.
- There are **no `app/api/*` routes**. The two bits of server logic
  (creating a Stripe deposit checkout, and confirming payment via
  webhook) now live in **Supabase Edge Functions** instead
  (`supabase/functions/`), which Supabase hosts for you.
- The booking form calls those Edge Functions directly over HTTPS.

## What's here

```
app/
  page.tsx                          landing page + service catalog
  booking/page.tsx                  booking form + instant estimate
  booking/confirmation/page.tsx     post-booking / post-payment page
lib/
  pricing.ts                        service catalog + pricing/deposit rules
  supabase/client.ts                browser Supabase client
supabase/
  schema.sql                        tables + Row Level Security policies
  functions/create-checkout-session Edge Function: creates Stripe deposit checkout
  functions/stripe-webhook          Edge Function: confirms payment, updates booking
.github/workflows/deploy.yml        builds + deploys to GitHub Pages on every push
```

## 1. Create your Supabase project

1. supabase.com → New project → copy the **Project URL** and **anon
   public key** (Project Settings → API).
2. SQL editor → paste in `supabase/schema.sql` → Run. This creates the
   `customers`, `properties`, `bookings`, `payments` tables with Row
   Level Security already configured.

## 2. Deploy the Edge Functions

Install the Supabase CLI, then from the project root:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF

supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set SITE_URL=https://YOUR_USERNAME.github.io/YOUR_REPO

supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook --no-verify-jwt
```

In the Stripe dashboard, add a webhook endpoint pointing to:
`https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`,
listening for `checkout.session.completed` — then copy its signing
secret into `STRIPE_WEBHOOK_SECRET` above.

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Initial booking app scaffold"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 4. Add repo secrets (for the build)

In your GitHub repo → **Settings → Secrets and variables → Actions** →
add two repository secrets:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

(These are safe to expose in a static bundle — they rely on Row Level
Security, not secrecy, for protection.)

## 5. Turn on GitHub Pages

Repo → **Settings → Pages** → under "Build and deployment", set
**Source** to **GitHub Actions**. That's it — the workflow in
`.github/workflows/deploy.yml` will build and publish the site
automatically on every push to `main`.

Your live demo will be at:
```
https://YOUR_USERNAME.github.io/YOUR_REPO/
```

## How pricing & deposits work

- `lib/pricing.ts` is the source of truth for prices shown in the app.
- The **create-checkout-session** Edge Function has its own copy of the
  same pricing rules and recalculates the total server-side before
  creating any Stripe charge — the browser's number is never trusted.
- Jobs over $1,000 require a 50% deposit through Stripe Checkout before
  the booking is marked `confirmed`. Jobs at or under $1,000 are
  confirmed immediately and invoiced after the job is done.

## Managing bookings (no dashboard yet)

Use the Supabase Table Editor (Table Editor → `bookings`) to see incoming
jobs and mark them `completed`. A proper scheduling dashboard is a
natural next phase once you outgrow this.

## Still to do before going live

- Generate real app icons (`public/icons/icon-192.png`, `icon-512.png`)
- Hook up email/SMS confirmations (e.g. Resend or Twilio) as a third
  Edge Function triggered on booking creation
- Add your real service-area, terms, and cancellation policy copy
- If you ever outgrow GitHub Pages' static-only limits (e.g. you want
  server-rendered pages or an admin dashboard with real-time updates),
  the app can be redeployed to Vercel with minimal changes — see the
  git history for the pre-static-export version
