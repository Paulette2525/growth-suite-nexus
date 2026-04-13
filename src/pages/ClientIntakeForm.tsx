import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link2, Copy, Check, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ClientIntakeForm() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const formUrl = "https://growth-suite-nexus.lovable.app/formulaire";

  const handleCopy = () => {
    navigator.clipboard.writeText(formUrl);
    setCopied(true);
    toast({ title: "Lien copié !" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Link2 className="h-6 w-6 text-primary" />
          Nouveau projet client
        </h1>
        <p className="text-muted-foreground mt-1">
          Envoyez ce lien à votre client pour qu'il remplisse le formulaire de demande de projet. Les informations seront automatiquement enregistrées et l'IA générera les tâches.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lien du formulaire client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Copiez ce lien et envoyez-le à votre client. Il accédera à un formulaire simple sans voir votre plateforme.
          </p>
          <div className="flex gap-2">
            <Input value={formUrl} readOnly className="font-mono text-sm" />
            <Button onClick={handleCopy} variant="outline" size="icon" className="shrink-0">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={formUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Prévisualiser le formulaire
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comment ça marche ?</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Copiez le lien ci-dessus et envoyez-le à votre client</li>
            <li>Le client remplit le formulaire avec les détails de son projet</li>
            <li>Le client et le projet sont automatiquement créés dans votre base</li>
            <li>L'IA génère les tâches et le prompt Lovable pour démarrer le développement</li>
            <li>Vous retrouvez tout dans la section <strong>Projets</strong></li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
