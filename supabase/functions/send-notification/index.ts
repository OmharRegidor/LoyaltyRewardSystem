// supabase/functions/send-notification/index.ts
//
// Database Webhook handler: fires on INSERT into `notifications` table.
// Looks up the customer's Expo push tokens and sends a push notification
// via the Expo Push API.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: {
    id: string;
    customer_id: string;
    business_id: string;
    title: string;
    body: string;
    data: Record<string, unknown>;
  };
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound: "default";
}

Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();
    const notification = payload.record;

    if (!notification?.customer_id) {
      return new Response(JSON.stringify({ error: "Missing customer_id" }), {
        status: 400,
      });
    }

    // Create admin Supabase client to query push_tokens
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get push tokens for this customer
    const { data: tokens, error } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("customer_id", notification.customer_id);

    if (error || !tokens?.length) {
      return new Response(
        JSON.stringify({ message: "No push tokens found" }),
        { status: 200 },
      );
    }

    // Build Expo push messages
    const messages: ExpoPushMessage[] = tokens.map((t) => ({
      to: t.token,
      title: notification.title,
      body: notification.body,
      data: {
        notification_id: notification.id,
        business_id: notification.business_id,
        ...notification.data,
      },
      sound: "default" as const,
    }));

    // Send via Expo Push API
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });

    const result = await response.json();

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
    });
  } catch (err) {
    console.error("send-notification error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500 },
    );
  }
});
