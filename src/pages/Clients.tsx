import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Mail, Phone, FolderKanban, UserCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Clients() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*, projects(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createClient = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clients").insert({
        user_id: user!.id,
        name,
        email: email || null,
        phone: phone || null,
        company: company || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setOpen(false);
      setName(""); setEmail(""); setPhone(""); setCompany("");
      toast({ title: "Client ajouté avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const filtered = clients.filter((c: any) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">Gérez vos clients et leurs projets associés</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Ajouter un client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un client</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createClient.mutate(); }} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input placeholder="Nom du client" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Entreprise</Label>
                <Input placeholder="Nom de l'entreprise" value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="email@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input placeholder="+33 6 12 34 56 78" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={createClient.isPending}>
                {createClient.isPending ? "Ajout..." : "Ajouter le client"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher un client..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <UserCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Aucun client pour le moment</p>
          <p className="text-sm">Ajoutez votre premier client pour commencer</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((client: any) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold">{client.name}</h3>
                <Badge variant={client.status === "Actif" ? "default" : "secondary"}>
                  {client.status}
                </Badge>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                {client.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4" />{client.email}</p>}
                {client.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{client.phone}</p>}
                <p className="flex items-center gap-2">
                  <FolderKanban className="h-4 w-4" />
                  {client.projects?.length || 0} projet{(client.projects?.length || 0) > 1 ? "s" : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
