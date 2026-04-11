import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Calendar, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  name: string;
  type: "Site" | "SaaS" | "Plateforme";
  status: "En cours" | "Terminé" | "En pause" | "En retard";
  priority: "Haute" | "Moyenne" | "Basse";
  progress: number;
  client: string;
  members: number;
  deadline: string;
}

const mockProjects: Project[] = [
  { id: "1", name: "Site e-commerce Luxe", type: "Site", status: "En cours", priority: "Haute", progress: 72, client: "Maison Dupont", members: 3, deadline: "2026-05-15" },
  { id: "2", name: "SaaS Analytics Pro", type: "SaaS", status: "En cours", priority: "Haute", progress: 45, client: "TechCorp", members: 4, deadline: "2026-06-30" },
  { id: "3", name: "Plateforme RH", type: "Plateforme", status: "En cours", priority: "Moyenne", progress: 90, client: "GroupeRH", members: 2, deadline: "2026-04-30" },
  { id: "4", name: "App Mobile Fitness", type: "Site", status: "En retard", priority: "Haute", progress: 20, client: "FitLife", members: 3, deadline: "2026-04-20" },
  { id: "5", name: "Portail Client Banque", type: "Plateforme", status: "En pause", priority: "Basse", progress: 60, client: "BankPlus", members: 2, deadline: "2026-08-01" },
];

const statusColors: Record<string, string> = {
  "En cours": "bg-primary/10 text-primary",
  "Terminé": "bg-success/10 text-success",
  "En pause": "bg-muted text-muted-foreground",
  "En retard": "bg-destructive/10 text-destructive",
};

const priorityColors: Record<string, string> = {
  "Haute": "bg-destructive/10 text-destructive",
  "Moyenne": "bg-warning/10 text-warning",
  "Basse": "bg-muted text-muted-foreground",
};

export default function Projects() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const navigate = useNavigate();

  const filtered = mockProjects.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterType !== "all" && p.type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Projets</h1>
          <p className="text-muted-foreground mt-1">Gérez tous vos projets en un seul endroit</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nouveau projet</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer un projet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nom du projet</Label>
                <Input placeholder="Mon super projet" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Site">Site</SelectItem>
                      <SelectItem value="SaaS">SaaS</SelectItem>
                      <SelectItem value="Plateforme">Plateforme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priorité</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Priorité" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Haute">Haute</SelectItem>
                      <SelectItem value="Moyenne">Moyenne</SelectItem>
                      <SelectItem value="Basse">Basse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Client</Label>
                <Input placeholder="Nom du client" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de début</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Date de fin</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Décrivez le projet..." />
              </div>
              <Button className="w-full">Créer le projet</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un projet..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="En cours">En cours</SelectItem>
            <SelectItem value="Terminé">Terminé</SelectItem>
            <SelectItem value="En pause">En pause</SelectItem>
            <SelectItem value="En retard">En retard</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="Site">Site</SelectItem>
            <SelectItem value="SaaS">SaaS</SelectItem>
            <SelectItem value="Plateforme">Plateforme</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((project) => (
          <Card
            key={project.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/projets/${project.id}`)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{project.name}</CardTitle>
                <Badge className={priorityColors[project.priority]} variant="secondary">
                  {project.priority}
                </Badge>
              </div>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-xs">{project.type}</Badge>
                <Badge className={`text-xs ${statusColors[project.status]}`} variant="secondary">
                  {project.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">{project.client}</div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{project.members} membres</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{project.deadline}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
