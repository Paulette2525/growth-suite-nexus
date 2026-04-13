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
import { Plus, Search, Calendar, FolderKanban } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ActionMenu } from "@/components/ActionMenu";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const statusColors: Record<string, string> = {
  "En cours": "bg-primary/10 text-primary",
  "Terminé": "bg-success/10 text-success",
  "En pause": "bg-muted text-muted-foreground",
  "En retard": "bg-destructive/10 text-destructive",
};

const priorityColors: Record<string, string> = {
  Haute: "bg-destructive/10 text-destructive",
  Moyenne: "bg-warning/10 text-warning",
  Basse: "bg-muted text-muted-foreground",
};

export default function Projects() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("Site");
  const [priority, setPriority] = useState("Moyenne");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [clientId, setClientId] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, clients(name), tasks(status)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name");
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setName(""); setType("Site"); setPriority("Moyenne");
    setDescription(""); setStartDate(""); setDeadline(""); setClientId("");
    setEditingProject(null);
  };

  const openEdit = (p: any) => {
    setEditingProject(p);
    setName(p.name);
    setType(p.type);
    setPriority(p.priority);
    setDescription(p.description || "");
    setStartDate(p.start_date || "");
    setDeadline(p.deadline || "");
    setClientId(p.client_id || "");
    setOpen(true);
  };

  const saveProject = useMutation({
    mutationFn: async () => {
      const payload = {
        name, type, priority,
        description: description || null,
        start_date: startDate || null,
        deadline: deadline || null,
        client_id: clientId || null,
      };
      if (editingProject) {
        const { error } = await supabase.from("projects").update(payload).eq("id", editingProject.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("projects").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
      resetForm();
      toast({ title: editingProject ? "Projet modifié" : "Projet créé avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setDeleteId(null);
      toast({ title: "Projet supprimé" });
    },
  });

  const filtered = projects.filter((p: any) => {
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
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nouveau projet</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingProject ? "Modifier le projet" : "Créer un projet"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveProject.mutate(); }} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nom du projet</Label>
                <Input placeholder="Mon super projet" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Site">Site</SelectItem>
                      <SelectItem value="SaaS">SaaS</SelectItem>
                      <SelectItem value="Plateforme">Plateforme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priorité</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de début</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Date de fin</Label>
                  <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="Décrivez le projet..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={saveProject.isPending}>
                {saveProject.isPending ? "Enregistrement..." : editingProject ? "Enregistrer" : "Créer le projet"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FolderKanban className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Aucun projet pour le moment</p>
          <p className="text-sm">Créez votre premier projet pour commencer</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((project: any) => {
          const projectTasks = project.tasks || [];
          const doneTasks = projectTasks.filter((t: any) => t.status === "done").length;
          const progress = projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0;

          return (
            <Card
              key={project.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/projets/${project.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base flex-1 min-w-0 pr-2">{project.name}</CardTitle>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge className={priorityColors[project.priority]} variant="secondary">
                      {project.priority}
                    </Badge>
                    <ActionMenu
                      onEdit={() => openEdit(project)}
                      onDelete={() => setDeleteId(project.id)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{project.type}</Badge>
                  <Badge className={`text-xs ${statusColors[project.status] || ""}`} variant="secondary">
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {project.clients?.name || "Pas de client"}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progression</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{project.deadline || "—"}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Supprimer le projet"
        description="Cette action est irréversible. Toutes les tâches associées seront également supprimées."
        onConfirm={() => deleteId && deleteProject.mutate(deleteId)}
        loading={deleteProject.isPending}
      />
    </div>
  );
}
