import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Euro, FileText, Clock } from "lucide-react";

const invoices = [
  { id: "INV-1042", client: "Maison Dupont", project: "Site e-commerce Luxe", amount: 15000, status: "Payé", date: "2026-03-15" },
  { id: "INV-1043", client: "TechCorp", project: "SaaS Analytics Pro", amount: 25000, status: "Envoyé", date: "2026-04-01" },
  { id: "INV-1044", client: "GroupeRH", project: "Plateforme RH", amount: 12000, status: "Brouillon", date: "2026-04-10" },
  { id: "INV-1045", client: "FitLife", project: "App Mobile Fitness", amount: 8000, status: "Envoyé", date: "2026-04-05" },
  { id: "INV-1046", client: "BankPlus", project: "Portail Client Banque", amount: 30000, status: "Brouillon", date: "2026-04-10" },
];

const statusColors: Record<string, string> = {
  Payé: "bg-success/10 text-success",
  Envoyé: "bg-primary/10 text-primary",
  Brouillon: "bg-muted text-muted-foreground",
};

export default function Billing() {
  const total = invoices.reduce((s, i) => s + i.amount, 0);
  const paid = invoices.filter((i) => i.status === "Payé").reduce((s, i) => s + i.amount, 0);
  const pending = invoices.filter((i) => i.status === "Envoyé").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Facturation</h1>
          <p className="text-muted-foreground mt-1">Suivez vos devis et factures</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Nouvelle facture</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-accent"><Euro className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total facturé</p>
              <p className="text-2xl font-heading font-bold">{total.toLocaleString("fr-FR")} €</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-success/10"><FileText className="h-5 w-5 text-success" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Payé</p>
              <p className="text-2xl font-heading font-bold">{paid.toLocaleString("fr-FR")} €</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div>
            <div>
              <p className="text-sm text-muted-foreground">En attente</p>
              <p className="text-2xl font-heading font-bold">{pending.toLocaleString("fr-FR")} €</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Factures récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Projet</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id} className="cursor-pointer">
                  <TableCell className="font-medium">{inv.id}</TableCell>
                  <TableCell>{inv.client}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.project}</TableCell>
                  <TableCell className="text-muted-foreground">{inv.date}</TableCell>
                  <TableCell className="text-right font-medium">{inv.amount.toLocaleString("fr-FR")} €</TableCell>
                  <TableCell>
                    <Badge className={statusColors[inv.status]} variant="secondary">{inv.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
