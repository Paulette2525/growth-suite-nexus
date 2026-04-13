import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Euro, FileText, Clock, RefreshCw, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ActionMenu } from "@/components/ActionMenu";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { differenceInDays, format } from "date-fns";
import { fr } from "date-fns/locale";

const statusColors: Record<string, string> = {
  Payé: "bg-success/10 text-success",
  Envoyé: "bg-primary/10 text-primary",
  Brouillon: "bg-muted text-muted-foreground",
};

const subStatusColors: Record<string, string> = {
  actif: "bg-success/10 text-success",
  expiré: "bg-destructive/10 text-destructive",
  annulé: "bg-muted text-muted-foreground",
};

const categoryLabels: Record<string, string> = {
  api: "API",
  domaine: "Domaine",
  hébergement: "Hébergement",
  autre: "Autre",
};

export default function Billing() {
  // Invoice state
  const [openInvoice, setOpenInvoice] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceClientId, setInvoiceClientId] = useState("");
  const [invoiceProjectId, setInvoiceProjectId] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState("Brouillon");

  // Subscription state
  const [openSub, setOpenSub] = useState(false);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [deleteSubId, setDeleteSubId] = useState<string | null>(null);
  const [subName, setSubName] = useState("");
  const [subProjectId, setSubProjectId] = useState("");
  const [subType, setSubType] = useState("mensuel");
  const [subAmount, setSubAmount] = useState("");
  const [subStartDate, setSubStartDate] = useState("");
  const [subRenewalDate, setSubRenewalDate] = useState("");
  const [subStatus, setSubStatus] = useState("actif");
  const [subCategory, setSubCategory] = useState("autre");
  const [subNotes, setSubNotes] = useState("");

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

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*, projects(name)")
        .order("renewal_date", { ascending: true });
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

  // Invoice mutations
  const resetInvoiceForm = () => {
    setInvoiceNumber(""); setInvoiceAmount(""); setInvoiceClientId(""); setInvoiceProjectId(""); setInvoiceStatus("Brouillon");
    setEditingInvoice(null);
  };

  const openEditInvoice = (inv: any) => {
    setEditingInvoice(inv);
    setInvoiceNumber(inv.invoice_number);
    setInvoiceAmount(String(inv.amount));
    setInvoiceClientId(inv.client_id || "");
    setInvoiceProjectId(inv.project_id || "");
    setInvoiceStatus(inv.status);
    setOpenInvoice(true);
  };

  const saveInvoice = useMutation({
    mutationFn: async () => {
      const payload = {
        invoice_number: invoiceNumber,
        amount: parseFloat(invoiceAmount),
        client_id: invoiceClientId || null,
        project_id: invoiceProjectId || null,
        status: invoiceStatus,
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
      setOpenInvoice(false);
      resetInvoiceForm();
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
      setDeleteInvoiceId(null);
      toast({ title: "Facture supprimée" });
    },
  });

  // Subscription mutations
  const resetSubForm = () => {
    setSubName(""); setSubProjectId(""); setSubType("mensuel"); setSubAmount("");
    setSubStartDate(""); setSubRenewalDate(""); setSubStatus("actif"); setSubCategory("autre"); setSubNotes("");
    setEditingSub(null);
  };

  const openEditSub = (sub: any) => {
    setEditingSub(sub);
    setSubName(sub.name);
    setSubProjectId(sub.project_id || "");
    setSubType(sub.type);
    setSubAmount(String(sub.amount));
    setSubStartDate(sub.start_date);
    setSubRenewalDate(sub.renewal_date);
    setSubStatus(sub.status);
    setSubCategory(sub.category);
    setSubNotes(sub.notes || "");
    setOpenSub(true);
  };

  const saveSub = useMutation({
    mutationFn: async () => {
      const payload = {
        name: subName,
        project_id: subProjectId || null,
        type: subType,
        amount: parseFloat(subAmount),
        start_date: subStartDate,
        renewal_date: subRenewalDate,
        status: subStatus,
        category: subCategory,
        notes: subNotes || null,
      };
      if (editingSub) {
        const { error } = await supabase.from("subscriptions").update(payload).eq("id", editingSub.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subscriptions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setOpenSub(false);
      resetSubForm();
      toast({ title: editingSub ? "Abonnement modifié" : "Abonnement ajouté" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteSub = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subscriptions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setDeleteSubId(null);
      toast({ title: "Abonnement supprimé" });
    },
  });

  // Stats
  const totalInvoiced = invoices.reduce((s: number, i: any) => s + Number(i.amount), 0);
  const paid = invoices.filter((i: any) => i.status === "Payé").reduce((s: number, i: any) => s + Number(i.amount), 0);
  const pending = invoices.filter((i: any) => i.status === "Envoyé").reduce((s: number, i: any) => s + Number(i.amount), 0);

  const activeSubs = subscriptions.filter((s: any) => s.status === "actif");
  const monthlySubCost = activeSubs.reduce((sum: number, s: any) => {
    const amt = Number(s.amount);
    return sum + (s.type === "annuel" ? amt / 12 : amt);
  }, 0);

  const getDaysUntilRenewal = (date: string) => differenceInDays(new Date(date), new Date());

  const nearestRenewal = activeSubs.length > 0
    ? activeSubs.reduce((nearest: any, s: any) => {
        const d = getDaysUntilRenewal(s.renewal_date);
        return d >= 0 && (nearest === null || d < getDaysUntilRenewal(nearest.renewal_date)) ? s : nearest;
      }, null)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Facturation</h1>
          <p className="text-muted-foreground mt-1">Suivez vos factures et abonnements</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-accent"><Euro className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total facturé</p>
              <p className="text-2xl font-heading font-bold">{totalInvoiced.toLocaleString("fr-FR")} €</p>
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
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-destructive/10"><RefreshCw className="h-5 w-5 text-destructive" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Abonnements/mois</p>
              <p className="text-2xl font-heading font-bold">{monthlySubCost.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Factures ({invoices.length})</TabsTrigger>
          <TabsTrigger value="subscriptions">
            Abonnements ({activeSubs.length})
            {activeSubs.some((s: any) => getDaysUntilRenewal(s.renewal_date) <= 14 && getDaysUntilRenewal(s.renewal_date) >= 0) && (
              <AlertTriangle className="h-3.5 w-3.5 ml-1.5 text-warning" />
            )}
          </TabsTrigger>
        </TabsList>

        {/* ===== FACTURES TAB ===== */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Factures</CardTitle>
              <Dialog open={openInvoice} onOpenChange={(v) => { setOpenInvoice(v); if (!v) resetInvoiceForm(); }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nouvelle facture</Button>
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
                        <Input type="number" step="0.01" placeholder="0.00" value={invoiceAmount} onChange={(e) => setInvoiceAmount(e.target.value)} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Client</Label>
                        <Select value={invoiceClientId} onValueChange={setInvoiceClientId}>
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
                        <Select value={invoiceProjectId} onValueChange={setInvoiceProjectId}>
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
                      <Select value={invoiceStatus} onValueChange={setInvoiceStatus}>
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
                            onEdit={() => openEditInvoice(inv)}
                            onDelete={() => setDeleteInvoiceId(inv.id)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== ABONNEMENTS TAB ===== */}
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Abonnements</CardTitle>
              <Dialog open={openSub} onOpenChange={(v) => { setOpenSub(v); if (!v) resetSubForm(); }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nouvel abonnement</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingSub ? "Modifier l'abonnement" : "Ajouter un abonnement"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); saveSub.mutate(); }} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nom</Label>
                        <Input placeholder="Ex: Domaine OVH" value={subName} onChange={(e) => setSubName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Catégorie</Label>
                        <Select value={subCategory} onValueChange={setSubCategory}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="api">API</SelectItem>
                            <SelectItem value="domaine">Domaine</SelectItem>
                            <SelectItem value="hébergement">Hébergement</SelectItem>
                            <SelectItem value="autre">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Projet</Label>
                        <Select value={subProjectId} onValueChange={setSubProjectId}>
                          <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                          <SelectContent>
                            {projects.map((p: any) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={subType} onValueChange={setSubType}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mensuel">Mensuel</SelectItem>
                            <SelectItem value="annuel">Annuel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Montant (€)</Label>
                        <Input type="number" step="0.01" placeholder="0.00" value={subAmount} onChange={(e) => setSubAmount(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Date de début</Label>
                        <Input type="date" value={subStartDate} onChange={(e) => setSubStartDate(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Prochaine échéance</Label>
                        <Input type="date" value={subRenewalDate} onChange={(e) => setSubRenewalDate(e.target.value)} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Statut</Label>
                        <Select value={subStatus} onValueChange={setSubStatus}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="actif">Actif</SelectItem>
                            <SelectItem value="expiré">Expiré</SelectItem>
                            <SelectItem value="annulé">Annulé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Input placeholder="Notes optionnelles" value={subNotes} onChange={(e) => setSubNotes(e.target.value)} />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={saveSub.isPending}>
                      {saveSub.isPending ? "Enregistrement..." : editingSub ? "Enregistrer" : "Ajouter l'abonnement"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {subscriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Aucun abonnement pour le moment</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Projet</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Échéance</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub: any) => {
                      const daysLeft = getDaysUntilRenewal(sub.renewal_date);
                      const isUrgent = sub.status === "actif" && daysLeft >= 0 && daysLeft <= 14;
                      const isOverdue = sub.status === "actif" && daysLeft < 0;
                      return (
                        <TableRow key={sub.id} className={isUrgent ? "bg-warning/5" : isOverdue ? "bg-destructive/5" : ""}>
                          <TableCell className="font-medium">{sub.name}</TableCell>
                          <TableCell className="text-muted-foreground">{sub.projects?.name || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{categoryLabels[sub.category] || sub.category}</Badge>
                          </TableCell>
                          <TableCell className="capitalize">{sub.type}</TableCell>
                          <TableCell className="text-right font-medium">{Number(sub.amount).toLocaleString("fr-FR")} €</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {isUrgent && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                              {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                              <span className={isUrgent ? "text-warning font-medium" : isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}>
                                {format(new Date(sub.renewal_date), "dd MMM yyyy", { locale: fr })}
                              </span>
                              {isUrgent && <span className="text-xs text-warning">({daysLeft}j)</span>}
                              {isOverdue && <span className="text-xs text-destructive">(expiré)</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={subStatusColors[sub.status] || ""} variant="secondary">{sub.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <ActionMenu
                              onEdit={() => openEditSub(sub)}
                              onDelete={() => setDeleteSubId(sub.id)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!deleteInvoiceId}
        onOpenChange={() => setDeleteInvoiceId(null)}
        title="Supprimer la facture"
        description="Cette facture sera définitivement supprimée."
        onConfirm={() => deleteInvoiceId && deleteInvoice.mutate(deleteInvoiceId)}
        loading={deleteInvoice.isPending}
      />
      <ConfirmDialog
        open={!!deleteSubId}
        onOpenChange={() => setDeleteSubId(null)}
        title="Supprimer l'abonnement"
        description="Cet abonnement sera définitivement supprimé."
        onConfirm={() => deleteSubId && deleteSub.mutate(deleteSubId)}
        loading={deleteSub.isPending}
      />
    </div>
  );
}
