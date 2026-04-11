import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Mail, Phone, FolderKanban } from "lucide-react";

const clients = [
  { id: "1", name: "Maison Dupont", email: "contact@dupont.fr", phone: "+33 1 23 45 67 89", projects: 2, status: "Actif" },
  { id: "2", name: "TechCorp", email: "hello@techcorp.io", phone: "+33 6 78 90 12 34", projects: 1, status: "Actif" },
  { id: "3", name: "GroupeRH", email: "info@grouperh.com", phone: "+33 1 98 76 54 32", projects: 1, status: "Actif" },
  { id: "4", name: "FitLife", email: "team@fitlife.fr", phone: "+33 6 11 22 33 44", projects: 1, status: "Actif" },
  { id: "5", name: "BankPlus", email: "digital@bankplus.fr", phone: "+33 1 55 66 77 88", projects: 1, status: "Inactif" },
];

export default function Clients() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">Gérez vos clients et leurs projets associés</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Ajouter un client</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher un client..." className="pl-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {clients.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold">{client.name}</h3>
                <Badge variant={client.status === "Actif" ? "default" : "secondary"}>
                  {client.status}
                </Badge>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><Mail className="h-4 w-4" />{client.email}</p>
                <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{client.phone}</p>
                <p className="flex items-center gap-2"><FolderKanban className="h-4 w-4" />{client.projects} projet{client.projects > 1 ? "s" : ""}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
