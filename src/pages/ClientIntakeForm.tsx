import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { FileText, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const projectTypes = ["SaaS", "Site vitrine", "Plateforme", "App mobile", "E-commerce", "Dashboard"];
const budgetRanges = ["< 500€", "500€ - 2 000€", "2 000€ - 5 000€", "5 000€ - 10 000€", "> 10 000€"];

export default function ClientIntakeForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    clientCompany: "",
    projectName: "",
    projectType: "SaaS",
    description: "",
    targetAudience: "",
    keyFeatures: "",
    designReferences: "",
    budgetRange: "",
    desiredDeadline: "",
    techPreferences: "",
    hasExistingBranding: false,
    additionalNotes: "",
  });

  const update = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create client
      const { data: client, error: clientErr } = await supabase
        .from("clients")
        .insert({
          name: form.clientName,
          email: form.clientEmail || null,
          company: form.clientCompany || null,
        })
        .select()
        .single();
      if (clientErr) throw clientErr;

      // 2. Create project
      const { data: project, error: projErr } = await supabase
        .from("projects")
        .insert({
          name: form.projectName,
          type: form.projectType,
          description: form.description,
          client_id: client.id,
          deadline: form.desiredDeadline || null,
        })
        .select()
        .single();
      if (projErr) throw projErr;

      // 3. Save intake form
      const { data: intake, error: intakeErr } = await supabase
        .from("client_intake_forms")
        .insert({
          client_name: form.clientName,
          client_email: form.clientEmail || null,
          client_company: form.clientCompany || null,
          project_name: form.projectName,
          project_type: form.projectType,
          description: form.description,
          target_audience: form.targetAudience || null,
          key_features: form.keyFeatures || null,
          design_references: form.designReferences || null,
          budget_range: form.budgetRange || null,
          desired_deadline: form.desiredDeadline || null,
          tech_preferences: form.techPreferences || null,
          has_existing_branding: form.hasExistingBranding,
          additional_notes: form.additionalNotes || null,
          client_id: client.id,
          project_id: project.id,
        })
        .select()
        .single();
      if (intakeErr) throw intakeErr;

      // 4. Call AI to generate tasks + prompt
      toast({ title: "Formulaire enregistré", description: "Génération des tâches par l'IA en cours..." });

      const { data: aiData, error: aiErr } = await supabase.functions.invoke("generate-tasks", {
        body: { intakeId: intake.id, projectId: project.id },
      });

      if (aiErr) {
        console.error("AI error:", aiErr);
        toast({ title: "Projet créé", description: "L'IA n'a pas pu générer les tâches. Vous pouvez les ajouter manuellement.", variant: "destructive" });
      } else {
        toast({ title: "Tâches générées par l'IA !" });
      }

      navigate(`/projets/${project.id}`);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Nouveau projet client
        </h1>
        <p className="text-muted-foreground mt-1">
          Remplissez ce formulaire pour démarrer un nouveau projet. L'IA générera automatiquement les tâches et le prompt Lovable.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client info */}
        <Card>
          <CardHeader><CardTitle className="text-base">Informations client</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom du client *</Label>
                <Input value={form.clientName} onChange={(e) => update("clientName", e.target.value)} required placeholder="Jean Dupont" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.clientEmail} onChange={(e) => update("clientEmail", e.target.value)} placeholder="jean@exemple.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Entreprise</Label>
              <Input value={form.clientCompany} onChange={(e) => update("clientCompany", e.target.value)} placeholder="Nom de l'entreprise" />
            </div>
          </CardContent>
        </Card>

        {/* Project info */}
        <Card>
          <CardHeader><CardTitle className="text-base">Détails du projet</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom du projet *</Label>
                <Input value={form.projectName} onChange={(e) => update("projectName", e.target.value)} required placeholder="Mon Super SaaS" />
              </div>
              <div className="space-y-2">
                <Label>Type de projet *</Label>
                <Select value={form.projectType} onValueChange={(v) => update("projectType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {projectTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description détaillée du projet *</Label>
              <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} required placeholder="Décrivez le projet en détail : objectifs, problème résolu, fonctionnement souhaité..." rows={4} />
            </div>
            <div className="space-y-2">
              <Label>Audience cible</Label>
              <Input value={form.targetAudience} onChange={(e) => update("targetAudience", e.target.value)} placeholder="Ex: PME, freelances, étudiants..." />
            </div>
          </CardContent>
        </Card>

        {/* Features & Design */}
        <Card>
          <CardHeader><CardTitle className="text-base">Fonctionnalités & Design</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Fonctionnalités clés souhaitées *</Label>
              <Textarea value={form.keyFeatures} onChange={(e) => update("keyFeatures", e.target.value)} required placeholder="Listez les fonctionnalités principales (une par ligne) :&#10;- Authentification&#10;- Dashboard&#10;- Gestion des utilisateurs&#10;- Paiement Stripe..." rows={5} />
            </div>
            <div className="space-y-2">
              <Label>Références de design</Label>
              <Textarea value={form.designReferences} onChange={(e) => update("designReferences", e.target.value)} placeholder="URLs de sites/apps qui vous inspirent, style visuel souhaité..." rows={2} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.hasExistingBranding} onCheckedChange={(v) => update("hasExistingBranding", v)} />
              <Label>Le client a déjà un branding (logo, couleurs, charte graphique)</Label>
            </div>
          </CardContent>
        </Card>

        {/* Budget & Timeline */}
        <Card>
          <CardHeader><CardTitle className="text-base">Budget & Délais</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Budget estimé</Label>
                <Select value={form.budgetRange} onValueChange={(v) => update("budgetRange", v)}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {budgetRanges.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Deadline souhaitée</Label>
                <Input type="date" value={form.desiredDeadline} onChange={(e) => update("desiredDeadline", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Préférences techniques</Label>
              <Input value={form.techPreferences} onChange={(e) => update("techPreferences", e.target.value)} placeholder="Ex: React, Supabase, Stripe, API tierce..." />
            </div>
            <div className="space-y-2">
              <Label>Notes additionnelles</Label>
              <Textarea value={form.additionalNotes} onChange={(e) => update("additionalNotes", e.target.value)} placeholder="Tout ce qui peut être utile..." rows={3} />
            </div>
          </CardContent>
        </Card>

        <Separator />

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Création en cours...</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" />Créer le projet & générer les tâches avec l'IA</>
          )}
        </Button>
      </form>
    </div>
  );
}
