import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Mail, FolderKanban, ListTodo, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ActionMenu } from "@/components/ActionMenu";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const roleColors: Record<string, string> = {
  Admin: "bg-primary/10 text-primary",
  Développeur: "bg-success/10 text-success",
  Designer: "bg-warning/10 text-warning",
  "Chef de projet": "bg-accent text-accent-foreground",
};

const avatarColors = ["bg-primary", "bg-success", "bg-warning", "bg-destructive"];

export default function Team() {
  const [open, setOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Développeur");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["all-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: projectMembers = [] } = useQuery({
    queryKey: ["project-members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("project_members").select("*");
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setFullName(""); setEmail(""); setRole("Développeur");
    setEditingMember(null);
  };

  const openEdit = (m: any) => {
    setEditingMember(m);
    setFullName(m.full_name || "");
    setEmail(m.email || "");
    setRole(m.role || "Développeur");
    setOpen(true);
  };

  const saveMember = useMutation({
    mutationFn: async () => {
      if (editingMember) {
        const { error } = await supabase.from("profiles").update({
          full_name: fullName,
          email: email || null,
          role,
        }).eq("id", editingMember.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("profiles").insert({
          id: crypto.randomUUID(),
          full_name: fullName,
          email: email || null,
          role,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setOpen(false);
      resetForm();
      toast({ title: editingMember ? "Membre modifié" : "Membre ajouté avec succès" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setDeleteId(null);
      toast({ title: "Membre supprimé" });
    },
  });

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t: any) => t.status === "done").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Équipe</h1>
          <p className="text-muted-foreground mt-1">Gérez vos membres et leur charge de travail</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Ajouter un membre</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMember ? "Modifier le membre" : "Ajouter un membre"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMember.mutate(); }} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nom complet</Label>
                <Input placeholder="Jean Dupont" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="jean@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Chef de projet">Chef de projet</SelectItem>
                    <SelectItem value="Développeur">Développeur</SelectItem>
                    <SelectItem value="Designer">Designer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={saveMember.isPending}>
                {saveMember.isPending ? "Enregistrement..." : editingMember ? "Enregistrer" : "Ajouter le membre"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-heading font-bold">{profiles.length}</p>
              <p className="text-sm text-muted-foreground">Membres</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-warning/10"><ListTodo className="h-5 w-5 text-warning" /></div>
            <div>
              <p className="text-2xl font-heading font-bold">{totalTasks}</p>
              <p className="text-sm text-muted-foreground">Tâches totales</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-success/10"><FolderKanban className="h-5 w-5 text-success" /></div>
            <div>
              <p className="text-2xl font-heading font-bold">
                {totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}%
              </p>
              <p className="text-sm text-muted-foreground">Complétion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {profiles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Aucun membre pour le moment</p>
          <p className="text-sm">Ajoutez votre premier membre d'équipe</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {profiles.map((member: any, i: number) => {
          const memberTasks = tasks.filter((t: any) => t.assignee_id === member.id);
          const memberDone = memberTasks.filter((t: any) => t.status === "done").length;
          const memberProjects = projectMembers.filter((pm: any) => pm.profile_id === member.id).length;

          return (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className={`${avatarColors[i % avatarColors.length]} text-primary-foreground font-heading font-semibold`}>
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate pr-2">{member.full_name || "Sans nom"}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge className={roleColors[member.role] || ""} variant="secondary">{member.role}</Badge>
                        <ActionMenu
                          onEdit={() => openEdit(member)}
                          onDelete={() => setDeleteId(member.id)}
                        />
                      </div>
                    </div>
                    {member.email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" />{member.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    <span>{memberProjects} projets</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <ListTodo className="h-4 w-4 text-muted-foreground" />
                    <span>{memberTasks.length} tâches</span>
                  </div>
                </div>

                {memberTasks.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Charge de travail</span>
                      <span>{memberDone}/{memberTasks.length}</span>
                    </div>
                    <Progress value={(memberDone / memberTasks.length) * 100} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Supprimer le membre"
        description="Ce membre sera définitivement supprimé de l'équipe."
        onConfirm={() => deleteId && deleteMember.mutate(deleteId)}
        loading={deleteMember.isPending}
      />
    </div>
  );
}
