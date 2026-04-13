import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { intakeId, projectId } = await req.json();
    if (!intakeId || !projectId) {
      return new Response(JSON.stringify({ error: "intakeId and projectId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch intake form
    const { data: intake, error: fetchErr } = await supabase
      .from("client_intake_forms")
      .select("*")
      .eq("id", intakeId)
      .single();
    if (fetchErr) throw fetchErr;

    const formSummary = `
Projet: ${intake.project_name}
Type: ${intake.project_type}
Description: ${intake.description}
Audience cible: ${intake.target_audience || "Non spécifié"}
Fonctionnalités clés: ${intake.key_features || "Non spécifié"}
Références design: ${intake.design_references || "Non spécifié"}
Budget: ${intake.budget_range || "Non spécifié"}
Deadline: ${intake.desired_deadline || "Non spécifié"}
Préférences techniques: ${intake.tech_preferences || "Non spécifié"}
Branding existant: ${intake.has_existing_branding ? "Oui" : "Non"}
Notes: ${intake.additional_notes || "Aucune"}
    `.trim();

    // --- STEP 1: Generate tasks ---
    const tasksResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Tu es un chef de projet technique expert en développement SaaS. À partir du brief client, génère une liste de tâches de développement ordonnées et priorisées. Utilise l'outil fourni pour structurer ta réponse.`,
          },
          {
            role: "user",
            content: `Voici le brief client :\n\n${formSummary}\n\nGénère les tâches de développement.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_tasks",
              description: "Génère une liste de tâches de développement ordonnées",
              parameters: {
                type: "object",
                properties: {
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Titre court de la tâche" },
                        description: { type: "string", description: "Description détaillée" },
                        priority: { type: "string", enum: ["Haute", "Moyenne", "Basse"] },
                      },
                      required: ["title", "description", "priority"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["tasks"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_tasks" } },
      }),
    });

    if (!tasksResponse.ok) {
      const errText = await tasksResponse.text();
      console.error("AI tasks error:", tasksResponse.status, errText);
      throw new Error(`AI tasks generation failed: ${tasksResponse.status}`);
    }

    const tasksResult = await tasksResponse.json();
    const toolCall = tasksResult.choices?.[0]?.message?.tool_calls?.[0];
    let generatedTasks: any[] = [];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      generatedTasks = parsed.tasks || [];
    }

    // Insert tasks into DB
    if (generatedTasks.length > 0) {
      const taskRows = generatedTasks.map((t: any) => ({
        project_id: projectId,
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: "todo",
      }));
      const { error: insertErr } = await supabase.from("tasks").insert(taskRows);
      if (insertErr) console.error("Task insert error:", insertErr);
    }

    // --- STEP 2: Generate Lovable prompt ---
    const promptResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Tu es un expert en développement SaaS avec Lovable.dev. Génère un prompt structuré et détaillé à donner à Lovable pour démarrer le développement de l'application. Le prompt doit inclure : le nom du projet, la stack technique, les pages à créer, les composants UI, le design system, les fonctionnalités backend (Supabase), et toute intégration nécessaire. Sois précis et actionnable. Écris le prompt en français.`,
          },
          {
            role: "user",
            content: `Voici le brief client :\n\n${formSummary}\n\nGénère le prompt Lovable.`,
          },
        ],
      }),
    });

    let generatedPrompt = "";
    if (promptResponse.ok) {
      const promptResult = await promptResponse.json();
      generatedPrompt = promptResult.choices?.[0]?.message?.content || "";
    }

    // Update intake form with generated data
    await supabase
      .from("client_intake_forms")
      .update({
        generated_tasks: generatedTasks,
        generated_prompt: generatedPrompt,
        status: "traité",
      })
      .eq("id", intakeId);

    // Also store prompt on project description if empty
    if (generatedPrompt && !intake.description) {
      await supabase.from("projects").update({ description: intake.description }).eq("id", projectId);
    }

    return new Response(
      JSON.stringify({ success: true, tasksCount: generatedTasks.length, hasPrompt: !!generatedPrompt }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-tasks error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
