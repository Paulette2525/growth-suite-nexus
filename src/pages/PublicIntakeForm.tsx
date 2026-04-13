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
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2, CheckCircle2, ArrowLeft, Eye, Pencil } from "lucide-react";
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

// Suggestion chips for key fields
const productSuggestions = ["Coaching / Formation", "Logiciel / App", "Services B2B", "E-commerce / Produits physiques", "Consulting", "Agence créative"];
const audienceSuggestions = ["Entrepreneurs", "PME / TPE", "Particuliers", "Étudiants", "Grandes entreprises", "Freelances"];
const featureSuggestions = [
  "Paiement en ligne", "Réservation / Prise de RDV", "Chat en direct", "Newsletter",
  "Tableau de bord", "Système de notifications", "Avis clients", "Multi-langue",
  "Connexion / Inscription", "Recherche avancée", "Intégration API", "CRM intégré",
];
const colorSuggestions = ["Bleu marine", "Noir & or", "Vert nature", "Rouge & blanc", "Pastel doux", "Violet premium"];

type FormState = {
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  productDescription: string;
  offersDescription: string;
  existingWebsite: string;
  idealCustomer: string;
  competitors: string;
  positioning: string;
  projectName: string;
  projectType: string;
  description: string;
  desiredPages: string[];
  keyFeatures: string[];
  designReferences: string;
  primaryColors: string;
  visualStyle: string;
  brandTone: string;
  hasExistingBranding: boolean;
  desiredDeadline: string;
  additionalNotes: string;
};

function SuggestionChips({ suggestions, onSelect, label }: { suggestions: string[]; onSelect: (s: string) => void; label?: string }) {
  return (
    <div className="space-y-1">
      {label && <p className="text-xs text-muted-foreground">{label}</p>}
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <Badge
            key={s}
            variant="outline"
            className="cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors text-xs"
            onClick={() => onSelect(s)}
          >
            + {s}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function ReviewSection({ title, children, onEdit }: { title: string; children: React.ReactNode; onEdit: () => void }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onEdit} className="gap-1 text-xs h-7">
          <Pencil className="h-3 w-3" /> Modifier
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">{children}</CardContent>
    </Card>
  );
}

function ReviewField({ label, value }: { label: string; value: string | undefined | null }) {
  return (
    <div>
      <span className="text-muted-foreground">{label} : </span>
      <span className="font-medium">{value || <span className="italic text-muted-foreground/60">Non renseigné</span>}</span>
    </div>
  );
}

export default function PublicIntakeForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState<"form" | "review">("form");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [brandGuideFile, setBrandGuideFile] = useState<File | null>(null);

  const [form, setForm] = useState<FormState>({
    clientName: "",
    clientEmail: "",
    clientCompany: "",
    productDescription: "",
    offersDescription: "",
    existingWebsite: "",
    idealCustomer: "",
    competitors: "",
    positioning: "",
    projectName: "",
    projectType: "SaaS",
    description: "",
    desiredPages: [],
    keyFeatures: [],
    designReferences: "",
    primaryColors: "",
    visualStyle: "",
    brandTone: "",
    hasExistingBranding: false,
    desiredDeadline: "",
    additionalNotes: "",
  });

  const update = (field: keyof FormState, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const togglePage = (page: string) => {
    setForm((prev) => ({
      ...prev,
      desiredPages: prev.desiredPages.includes(page)
        ? prev.desiredPages.filter((p) => p !== page)
        : [...prev.desiredPages, page],
    }));
  };

  const toggleFeature = (feature: string) => {
    setForm((prev) => ({
      ...prev,
      keyFeatures: prev.keyFeatures.includes(feature)
        ? prev.keyFeatures.filter((f) => f !== feature)
        : [...prev.keyFeatures, feature],
    }));
  };

  const appendToField = (field: keyof FormState, text: string) => {
    const current = form[field] as string;
    const sep = current ? ", " : "";
    update(field, current + sep + text);
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

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("review");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      let logoUrl: string | null = null;
      let brandGuideUrl: string | null = null;
      if (logoFile) logoUrl = await uploadFile(logoFile, "logos");
      if (brandGuideFile) brandGuideUrl = await uploadFile(brandGuideFile, "brand-guides");

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
          key_features: form.keyFeatures.join(", ") || null,
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

  // ===== REVIEW STEP =====
  if (step === "review") {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          <div className="text-center space-y-2 py-4">
            <h1 className="text-2xl font-heading font-bold flex items-center justify-center gap-2">
              <Eye className="h-6 w-6 text-primary" />
              Vérifiez vos informations
            </h1>
            <p className="text-muted-foreground">
              Relisez attentivement avant de valider. Vous pouvez modifier chaque section.
            </p>
          </div>

          <ReviewSection title="Vos informations" onEdit={() => setStep("form")}>
            <ReviewField label="Nom" value={form.clientName} />
            <ReviewField label="Email" value={form.clientEmail} />
            <ReviewField label="Entreprise" value={form.clientCompany} />
          </ReviewSection>

          <ReviewSection title="Activité & Offres" onEdit={() => setStep("form")}>
            <ReviewField label="Produit / Service" value={form.productDescription} />
            <ReviewField label="Offres / Tarifs" value={form.offersDescription} />
            <ReviewField label="Site existant" value={form.existingWebsite} />
          </ReviewSection>

          <ReviewSection title="Cible & Marché" onEdit={() => setStep("form")}>
            <ReviewField label="Client idéal" value={form.idealCustomer} />
            <ReviewField label="Concurrents" value={form.competitors} />
            <ReviewField label="Positionnement" value={form.positioning} />
          </ReviewSection>

          <ReviewSection title="Votre projet" onEdit={() => setStep("form")}>
            <ReviewField label="Nom du projet" value={form.projectName} />
            <ReviewField label="Type" value={form.projectType} />
            <ReviewField label="Description" value={form.description} />
            {form.desiredPages.length > 0 && (
              <div>
                <span className="text-muted-foreground">Pages : </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {form.desiredPages.map((p) => (
                    <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                  ))}
                </div>
              </div>
            )}
            {form.keyFeatures.length > 0 && (
              <div>
                <span className="text-muted-foreground">Fonctionnalités : </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {form.keyFeatures.map((f) => (
                    <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                  ))}
                </div>
              </div>
            )}
            <ReviewField label="Sites inspirants" value={form.designReferences} />
          </ReviewSection>

          <ReviewSection title="Identité visuelle" onEdit={() => setStep("form")}>
            <ReviewField label="Couleurs" value={form.primaryColors} />
            <ReviewField label="Style visuel" value={form.visualStyle} />
            <ReviewField label="Ambiance / ton" value={form.brandTone} />
            <ReviewField label="Branding existant" value={form.hasExistingBranding ? "Oui" : "Non"} />
            {logoFile && <ReviewField label="Logo" value={logoFile.name} />}
            {brandGuideFile && <ReviewField label="Charte graphique" value={brandGuideFile.name} />}
          </ReviewSection>

          <ReviewSection title="Délais & Notes" onEdit={() => setStep("form")}>
            <ReviewField label="Deadline" value={form.desiredDeadline} />
            <ReviewField label="Notes" value={form.additionalNotes} />
          </ReviewSection>

          <Separator />

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("form")} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Retour au formulaire
            </Button>
            <Button size="lg" className="flex-1" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Envoi en cours...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" />Tout est correct, valider !</>
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground pb-6">Merci de votre confiance</p>
        </div>
        <Toaster />
      </div>
    );
  }

  // ===== FORM STEP =====
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2 py-4">
          <h1 className="text-2xl font-heading font-bold flex items-center justify-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Demande de projet
          </h1>
          <p className="text-muted-foreground">
            Remplissez ce formulaire pour nous décrire votre projet. Plus vous êtes précis, plus nous pourrons vous proposer une première version rapidement.
          </p>
        </div>

        <form onSubmit={handlePreview} className="space-y-6">
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
                <SuggestionChips label="Cliquez pour ajouter :" suggestions={productSuggestions} onSelect={(s) => appendToField("productDescription", s)} />
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
                <SuggestionChips label="Cliquez pour ajouter :" suggestions={audienceSuggestions} onSelect={(s) => appendToField("idealCustomer", s)} />
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

              {/* Features checkboxes */}
              <div className="space-y-3">
                <Label>Fonctionnalités souhaitées</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {featureSuggestions.map((feat) => (
                    <div key={feat} className="flex items-center space-x-2">
                      <Checkbox
                        id={`feat-${feat}`}
                        checked={form.keyFeatures.includes(feat)}
                        onCheckedChange={() => toggleFeature(feat)}
                      />
                      <label htmlFor={`feat-${feat}`} className="text-sm cursor-pointer">{feat}</label>
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
                  <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="text-sm" />
                  {logoFile && <p className="text-xs text-muted-foreground">{logoFile.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Charte graphique (PDF / image)</Label>
                  <Input type="file" accept="image/*,.pdf" onChange={(e) => setBrandGuideFile(e.target.files?.[0] || null)} className="text-sm" />
                  {brandGuideFile && <p className="text-xs text-muted-foreground">{brandGuideFile.name}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Couleurs préférées</Label>
                  <VoiceInput onTranscript={(t) => update("primaryColors", form.primaryColors + (form.primaryColors ? " " : "") + t)} />
                </div>
                <Input value={form.primaryColors} onChange={(e) => update("primaryColors", e.target.value)} placeholder="Ex: bleu marine, doré, blanc..." />
                <SuggestionChips label="Inspirations :" suggestions={colorSuggestions} onSelect={(s) => appendToField("primaryColors", s)} />
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

          <Button type="submit" size="lg" className="w-full gap-2">
            <Eye className="h-4 w-4" />
            Prévisualiser avant d'envoyer
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground pb-6">Merci de votre confiance</p>
      </div>
      <Toaster />
    </div>
  );
}
