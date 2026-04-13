const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const BodySchema = z.object({
  bugTitle: z.string().min(1),
  reporterEmail: z.string().email(),
  reporterName: z.string().min(1),
  projectName: z.string().min(1),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { bugTitle, reporterEmail, reporterName, projectName } = parsed.data;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Automax-dev <onboarding@resend.dev>",
        to: [reporterEmail],
        subject: `✅ Bug résolu — ${bugTitle}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #3b82f6;">Bug résolu !</h2>
            <p>Bonjour <strong>${reporterName}</strong>,</p>
            <p>Le bug que vous avez signalé sur le projet <strong>${projectName}</strong> a été résolu :</p>
            <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0; font-weight: 600;">${bugTitle}</p>
            </div>
            <p>Merci pour votre retour, il nous aide à améliorer le projet !</p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">— L'équipe de développement</p>
          </div>
        `,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Resend API error [${res.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error sending bug resolved email:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
