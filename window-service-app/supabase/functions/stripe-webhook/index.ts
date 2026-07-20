// Deploy with: supabase functions deploy stripe-webhook --no-verify-jwt
// Set secrets with: supabase secrets set STRIPE_WEBHOOK_SECRET=...
// Then in the Stripe dashboard, point the webhook endpoint at:
//   https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
import Stripe from "npm:stripe@16";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

Deno.serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
    });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;

    if (bookingId) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await supabase
        .from("payments")
        .update({ status: "paid" })
        .eq("stripe_session_id", session.id);

      await supabase
        .from("bookings")
        .update({ status: "confirmed", deposit_paid: true })
        .eq("id", bookingId);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
