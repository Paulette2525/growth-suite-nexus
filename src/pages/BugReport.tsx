import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bug, Loader2, CheckCircle2, ImagePlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function BugReport() {
  const { projectId } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    reporterName: "",
    reporterEmail: "",
    title: "",
    description: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image trop lourde", description: "Maximum 5 Mo", variant: "destructive" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setLoading(true);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${projectId}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("bug-images")
          .upload(path, imageFile);
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from("bug-images")
          .getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("bug_reports").insert({
        project_id: projectId,
        title: form.title,
        description: form.description,
        reporter_name: form.reporterName,
        reporter_email: form.reporterEmail || null,
        image_url: imageUrl,
      });
      if (error) throw error;

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
              Votre rapport de bug a été enregistré. Nous allons le traiter rapidement et vous tiendrons informé par email.
            </p>
          </CardContent>
        </Card>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2 py-4">
          <Bug className="h-8 w-8 text-destructive mx-auto" />
          <h1 className="text-2xl font-heading font-bold">Signaler un bug</h1>
          <p className="text-muted-foreground">
            Décrivez le problème rencontré. Ajoutez une capture d'écran si possible.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Vos informations</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Votre nom *</Label>
                  <Input value={form.reporterName} onChange={(e) => update("reporterName", e.target.value)} required placeholder="Jean Dupont" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.reporterEmail} onChange={(e) => update("reporterEmail", e.target.value)} placeholder="jean@exemple.com" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Le bug</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Titre du bug *</Label>
                <Input value={form.title} onChange={(e) => update("title", e.target.value)} required placeholder="Ex: Le bouton de paiement ne fonctionne pas" />
              </div>
              <div className="space-y-2">
                <Label>Description détaillée *</Label>
                <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} required placeholder="Décrivez le problème, les étapes pour le reproduire, ce que vous attendiez..." rows={5} />
              </div>
              <div className="space-y-2">
                <Label>Capture d'écran</Label>
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg border" />
                    <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-80">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 cursor-pointer border border-dashed rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Cliquez pour ajouter une image (max 5 Mo)</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Envoi en cours...</>
            ) : (
              <>Envoyer le rapport de bug</>
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground pb-6">
          Merci de votre aide pour améliorer le projet
        </p>
      </div>
      <Toaster />
    </div>
  );
}
