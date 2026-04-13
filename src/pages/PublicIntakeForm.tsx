import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Loader2, CheckCircle2, Upload } from "lucide-react";
import { VoiceInput } from "@/components/VoiceInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

const projectTypes = ["SaaS", "Site vitrine", "Plateforme", "App mobile", "E-commerce", "Dashboard"];

const pageOptions = [
  "Accueil", "À propos", "Services / Offres", "Contact", "Blog",
  "Témoignages", "FAQ", "Espace client", "Portfolio", "Boutique en ligne",
];

const visualStyles = ["Moderne & épuré", "Coloré & dynamique", "Sobre & professionnel", "Luxe & élégant"];
const brandTones = ["Sérieux", "Décontracté", "Premium", "Jeune & fun"];

export default function PublicIntakeForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [brandGuideFile, setBrandGuideFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    clientCompany: "",
    // Activité & Offres
    productDescription: "",
    offersDescription: "",
    existingWebsite: "",
    // Cible & Marché
    idealCustomer: "",
    competitors: "",
    positioning: "",
    // Projet
    projectName: "",
    projectType: "SaaS",
    description: "",
    desiredPages: [] as string[],
    designReferences: "",
    // Identité visuelle
    primaryColors: "",
    visualStyle: "",
    brandTone: "",
    hasExistingBranding: false,
    // Délais & Notes
    desiredDeadline: "",
    additionalNotes: "",
  });

  const update = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const togglePage = (page: string) => {
    setForm((prev) => ({
      ...prev,
      desiredPages: prev.desiredPages.includes(page)
        ? prev.desiredPages.filter((p) => p !== page)
        : [...prev.desiredPages, page],
    }));
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("client-assets").upload(path, file);
    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    const { data } = supabase.storage.from("client-assets").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload files
      let logoUrl: string | null = null;
      let brandGuideUrl: string | null = null;
      if (logoFile) logoUrl = await uploadFile(logoFile, "logos");
      if (brandGuideFile) brandGuideUrl = await uploadFile(brandGuideFile, "brand-guides");

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
          target_audience: form.idealCustomer || null,
          key_features: form.offersDescription || null,
          design_references: form.designReferences || null,
          desired_deadline: form.desiredDeadline || null,
          has_existing_branding: form.hasExistingBranding,
          additional_notes: form.additionalNotes || null,
          client_id: client.id,
          project_id: project.id,
          product_description: form.productDescription || null,
          offers_description: form.offersDescription || null,
          existing_website: form.existingWebsite || null,
          ideal_customer: form.idealCustomer || null,
          competitors: form.competitors || null,
          positioning: form.positioning || null,
          desired_pages: form.desiredPages,
          primary_colors: form.primaryColors || null,
          visual_style: form.visualStyle || null,
          brand_tone: form.brandTone || null,
          logo_url: logoUrl,
          brand_guide_url: brandGuideUrl,
        } as any)
        .select()
        .single();
      if (intakeErr) throw intakeErr;

      // 4. Call AI
      supabase.functions.invoke("generate-tasks", {
        body: { intakeId: intake.id, projectId: project.id },
      });

      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-2xl font-heading font-bold">Merci !</h2>
            <p className="text-muted-foreground">
              Votre demande de projet a bien été enregistrée. Notre équipe va analyser vos besoins et reviendra vers vous rapidement.
            </p>
          </CardContent>
        </Card>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 py-4">
          <h1 className="text-2xl font-heading font-bold flex items-center justify-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Demande de projet
          </h1>
          <p className="text-muted-foreground">
            Remplissez ce formulaire pour nous décrire votre projet. Plus vous êtes précis, plus nous pourrons vous proposer une première version rapidement.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Client info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Vos informations</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Votre nom *</Label>
                  <Input value={form.clientName} onChange={(e) => update("clientName", e.target.value)} required placeholder="Jean Dupont" />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={form.clientEmail} onChange={(e) => update("clientEmail", e.target.value)} required placeholder="jean@exemple.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Entreprise</Label>
                <Input value={form.clientCompany} onChange={(e) => update("clientCompany", e.target.value)} placeholder="Nom de votre entreprise" />
              </div>
            </CardContent>
          </Card>

          {/* 2. Activité & Offres */}
          <Card>
            <CardHeader><CardTitle className="text-base">Votre activité & Offres</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Que vendez-vous / proposez-vous ? *</Label>
                  <VoiceInput onTranscript={(t) => update("productDescription", form.productDescription + (form.productDescription ? " " : "") + t)} />
                </div>
                <Textarea value={form.productDescription} onChange={(e) => update("productDescription", e.target.value)} required placeholder="Décrivez votre produit ou service principal..." rows={3} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Vos offres / formules / tarifs *</Label>
                  <VoiceInput onTranscript={(t) => update("offersDescription", form.offersDescription + (form.offersDescription ? " " : "") + t)} />
                </div>
                <Textarea value={form.offersDescription} onChange={(e) => update("offersDescription", e.target.value)} required placeholder="Listez vos offres, formules ou grille tarifaire..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Site web ou réseau social existant</Label>
                <Input type="url" value={form.existingWebsite} onChange={(e) => update("existingWebsite", e.target.value)} placeholder="https://..." />
              </div>
            </CardContent>
          </Card>

          {/* 3. Cible & Marché */}
          <Card>
            <CardHeader><CardTitle className="text-base">Cible & Marché</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Qui est votre client idéal ? *</Label>
                  <VoiceInput onTranscript={(t) => update("idealCustomer", form.idealCustomer + (form.idealCustomer ? " " : "") + t)} />
                </div>
                <Textarea value={form.idealCustomer} onChange={(e) => update("idealCustomer", e.target.value)} required placeholder="Décrivez votre client type : âge, profession, besoins..." rows={3} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Vos principaux concurrents</Label>
                  <VoiceInput onTranscript={(t) => update("competitors", form.competitors + (form.competitors ? " " : "") + t)} />
                </div>
                <Textarea value={form.competitors} onChange={(e) => update("competitors", e.target.value)} placeholder="Noms ou liens de vos concurrents principaux..." rows={2} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Votre positionnement / différence clé</Label>
                  <VoiceInput onTranscript={(t) => update("positioning", form.positioning + (form.positioning ? " " : "") + t)} />
                </div>
                <Textarea value={form.positioning} onChange={(e) => update("positioning", e.target.value)} placeholder="Qu'est-ce qui vous distingue de la concurrence ?" rows={2} />
              </div>
            </CardContent>
          </Card>

          {/* 4. Projet */}
          <Card>
            <CardHeader><CardTitle className="text-base">Votre projet</CardTitle></CardHeader>
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
                <div className="flex items-center justify-between">
                  <Label>Décrivez votre projet en détail *</Label>
                  <VoiceInput onTranscript={(t) => update("description", form.description + (form.description ? " " : "") + t)} />
                </div>
                <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} required placeholder="Quels sont les objectifs de votre projet ? Comment souhaitez-vous qu'il fonctionne ?" rows={4} />
              </div>

              {/* Pages checkboxes */}
              <div className="space-y-3">
                <Label>Quelles pages souhaitez-vous ?</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {pageOptions.map((page) => (
                    <div key={page} className="flex items-center space-x-2">
                      <Checkbox
                        id={`page-${page}`}
                        checked={form.desiredPages.includes(page)}
                        onCheckedChange={() => togglePage(page)}
                      />
                      <label htmlFor={`page-${page}`} className="text-sm cursor-pointer">{page}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Exemples de sites qui vous plaisent</Label>
                  <VoiceInput onTranscript={(t) => update("designReferences", form.designReferences + (form.designReferences ? " " : "") + t)} />
                </div>
                <Textarea value={form.designReferences} onChange={(e) => update("designReferences", e.target.value)} placeholder="URLs de sites ou applications qui vous inspirent..." rows={2} />
              </div>
            </CardContent>
          </Card>

          {/* 5. Identité visuelle */}
          <Card>
            <CardHeader><CardTitle className="text-base">Identité visuelle</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Upload votre logo</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      className="text-sm"
                    />
                  </div>
                  {logoFile && <p className="text-xs text-muted-foreground">{logoFile.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Charte graphique (PDF / image)</Label>
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setBrandGuideFile(e.target.files?.[0] || null)}
                    className="text-sm"
                  />
                  {brandGuideFile && <p className="text-xs text-muted-foreground">{brandGuideFile.name}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Couleurs préférées</Label>
                  <VoiceInput onTranscript={(t) => update("primaryColors", form.primaryColors + (form.primaryColors ? " " : "") + t)} />
                </div>
                <Input value={form.primaryColors} onChange={(e) => update("primaryColors", e.target.value)} placeholder="Ex: bleu marine, doré, blanc..." />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Style visuel</Label>
                  <Select value={form.visualStyle} onValueChange={(v) => update("visualStyle", v)}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {visualStyles.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ambiance / ton</Label>
                  <Select value={form.brandTone} onValueChange={(v) => update("brandTone", v)}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {brandTones.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={form.hasExistingBranding} onCheckedChange={(v) => update("hasExistingBranding", v)} />
                <Label>J'ai déjà un logo, des couleurs et une charte graphique</Label>
              </div>
            </CardContent>
          </Card>

          {/* 6. Délais & Notes */}
          <Card>
            <CardHeader><CardTitle className="text-base">Délais & Notes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Deadline souhaitée</Label>
                <Input type="date" value={form.desiredDeadline} onChange={(e) => update("desiredDeadline", e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Autre chose à nous dire ?</Label>
                  <VoiceInput onTranscript={(t) => update("additionalNotes", form.additionalNotes + (form.additionalNotes ? " " : "") + t)} />
                </div>
                <Textarea value={form.additionalNotes} onChange={(e) => update("additionalNotes", e.target.value)} placeholder="Toute information utile..." rows={3} />
              </div>
            </CardContent>
          </Card>

          <Separator />

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Envoi en cours...</>
            ) : (
              <>Envoyer ma demande de projet</>
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground pb-6">
          Merci de votre confiance
        </p>
      </div>
      <Toaster />
    </div>
  );
}
