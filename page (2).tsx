// Deploy with: supabase functions deploy create-checkout-session
// Set secrets with: supabase secrets set STRIPE_SECRET_KEY=... SITE_URL=...
import Stripe from "npm:stripe@16";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const DEPOSIT_THRESHOLD = 1000;
const DEPOSIT_RATE = 0.5;

// Keep this in sync with lib/pricing.ts in the Next.js app.
const SERVICES: Record<string, { basePrice: number; minimumPrice: number }> = {
  window_cleaning: { basePrice: 8, minimumPrice: 120 },
  pressure_washing: { basePrice: 0.25, minimumPrice: 150 },
  soft_washing: { basePrice: 0.35, minimumPrice: 200 },
  gutter_cleaning: { basePrice: 2.5, minimumPrice: 130 },
  holiday_lights: { basePrice: 6, minimumPrice: 350 },
};

function estimateTotal(items: { serviceId: string; quantity: number }[]) {
  let total = 0;
  for (const item of items) {
    const svc = SERVICES[item.serviceId];
    if (!svc) continue;
    total += Math.max(svc.basePrice * item.quantity, svc.minimumPrice);
  }
  return Math.round(total * 100) / 100;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { bookingId } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*, customers(email)")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Never trust a total sent from the browser — recompute it here.
    const total = estimateTotal(booking.services);
    const deposit =
      total > DEPOSIT_THRESHOLD
        ? Math.round(total * DEPOSIT_RATE * 100) / 100
        : 0;

    if (deposit <= 0) {
      return new Response(
        JSON.stringify({ error: "This booking does not require a deposit" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const siteUrl = Deno.env.get("SITE_URL")!; // e.g. https://username.github.io/repo-name

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: booking.customers?.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Booking deposit (50%)",
              description: `Deposit for booking ${bookingId}`,
            },
            unit_amount: Math.round(deposit * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { bookingId },
      success_url: `${siteUrl}/booking/confirmation/?booking=${bookingId}`,
      cancel_url: `${siteUrl}/booking/`,
    });

    await supabase.from("payments").insert({
      booking_id: bookingId,
      stripe_session_id: session.id,
      amount: deposit,
      type: "deposit",
      status: "pending",
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
