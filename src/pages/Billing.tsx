import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Euro, FileText, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ActionMenu } from "@/components/ActionMenu";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const statusColors: Record<string, string> = {
  Payé: "bg-success/10 text-success",
  Envoyé: "bg-primary/10 text-primary",
  Brouillon: "bg-muted text-muted-foreground",
};

export default function Billing() {
  const [open, setOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState("Brouillon");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, clients(name), projects(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name");
      if (error) throw error;
      return data;
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, name");
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setInvoiceNumber(""); setAmount(""); setClientId(""); setProjectId(""); setStatus("Brouillon");
    setEditingInvoice(null);
  };

  const openEdit = (inv: any) => {
    setEditingInvoice(inv);
    setInvoiceNumber(inv.invoice_number);
    setAmount(String(inv.amount));
    setClientId(inv.client_id || "");
    setProjectId(inv.project_id || "");
    setStatus(inv.status);
    setOpen(true);
  };

  const saveInvoice = useMutation({
    mutationFn: async () => {
      const payload = {
        invoice_number: invoiceNumber,
        amount: parseFloat(amount),
        client_id: clientId || null,
        project_id: projectId || null,
        status,
      };
      if (editingInvoice) {
        const { error } = await supabase.from("invoices").update(payload).eq("id", editingInvoice.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("invoices").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setOpen(false);
      resetForm();
      toast({ title: editingInvoice ? "Facture modifiée" : "Facture créée avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setDeleteId(null);
      toast({ title: "Facture supprimée" });
    },
  });

  const total = invoices.reduce((s: number, i: any) => s + Number(i.amount), 0);
  const paid = invoices.filter((i: any) => i.status === "Payé").reduce((s: number, i: any) => s + Number(i.amount), 0);
  const pending = invoices.filter((i: any) => i.status === "Envoyé").reduce((s: number, i: any) => s + Number(i.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Facturation</h1>
          <p className="text-muted-foreground mt-1">Suivez vos devis et factures</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nouvelle facture</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingInvoice ? "Modifier la facture" : "Créer une facture"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveInvoice.mutate(); }} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Numéro de facture</Label>
                  <Input placeholder="INV-001" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Montant (€)</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Projet</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {projects.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Brouillon">Brouillon</SelectItem>
                    <SelectItem value="Envoyé">Envoyé</SelectItem>
                    <SelectItem value="Payé">Payé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={saveInvoice.isPending}>
                {saveInvoice.isPending ? "Enregistrement..." : editingInvoice ? "Enregistrer" : "Créer la facture"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune facture pour le moment</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                    <TableCell>{inv.clients?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{inv.projects?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{inv.date}</TableCell>
                    <TableCell className="text-right font-medium">{Number(inv.amount).toLocaleString("fr-FR")} €</TableCell>
                    <TableCell>
                      <Badge className={statusColors[inv.status] || ""} variant="secondary">{inv.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <ActionMenu
                        onEdit={() => openEdit(inv)}
                        onDelete={() => setDeleteId(inv.id)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Supprimer la facture"
        description="Cette facture sera définitivement supprimée."
        onConfirm={() => deleteId && deleteInvoice.mutate(deleteId)}
        loading={deleteInvoice.isPending}
      />
    </div>
  );
}
