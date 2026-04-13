import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, CheckCircle2, ListTodo, FolderKanban, Clock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const taskStatusLabels: Record<string, string> = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminé",
};

const taskStatusColors: Record<string, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-primary/10 text-primary",
  done: "bg-success/10 text-success",
};

export default function TeamMemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: member } = useQuery({
    queryKey: ["profile", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["member-tasks", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*, projects(name)").eq("assignee_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: memberProjects = [] } = useQuery({
    queryKey: ["member-projects", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("project_members").select("*, projects(*)").eq("profile_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (!member) return null;

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const doneTasks = tasks.filter((t: any) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t: any) => t.status === "in_progress").length;
  const todoTasks = tasks.filter((t: any) => t.status === "todo").length;
  const completionRate = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  // Tasks done this month
  const now = new Date();
  const thisMonthDone = tasks.filter((t: any) => {
    if (t.status !== "done") return false;
    const d = new Date(t.updated_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/equipe")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Retour à l'équipe
      </Button>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="bg-primary text-primary-foreground font-heading font-semibold text-xl">
            {getInitials(member.full_name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-heading font-bold">{member.full_name || "Sans nom"}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="secondary">{member.role}</Badge>
            {member.email && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />{member.email}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Tâches terminées</p>
              <p className="text-2xl font-heading font-bold">{doneTasks}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10"><ListTodo className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Taux de complétion</p>
              <p className="text-2xl font-heading font-bold">{completionRate}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-warning/10"><FolderKanban className="h-5 w-5 text-warning" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Projets assignés</p>
              <p className="text-2xl font-heading font-bold">{memberProjects.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-accent"><Clock className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Fait ce mois</p>
              <p className="text-2xl font-heading font-bold">{thisMonthDone}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charge de travail */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Charge de travail</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression globale</span>
              <span className="font-medium">{doneTasks}/{tasks.length} tâches</span>
            </div>
            <Progress value={completionRate} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{todoTasks}</p>
                <p className="text-muted-foreground">À faire</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/5">
                <p className="text-2xl font-bold">{inProgressTasks}</p>
                <p className="text-muted-foreground">En cours</p>
              </div>
              <div className="p-3 rounded-lg bg-success/5">
                <p className="text-2xl font-bold">{doneTasks}</p>
                <p className="text-muted-foreground">Terminées</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Projets</CardTitle></CardHeader>
        <CardContent>
          {memberProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucun projet assigné</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Priorité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberProjects.map((pm: any) => (
                  <TableRow key={pm.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/projets/${pm.project_id}`)}>
                    <TableCell className="font-medium">{pm.projects?.name || "—"}</TableCell>
                    <TableCell><Badge variant="secondary">{pm.projects?.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{pm.projects?.priority}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Tâches assignées</CardTitle></CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucune tâche assignée</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tâche</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell className="text-muted-foreground">{t.projects?.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{t.priority}</TableCell>
                    <TableCell>
                      <Badge className={taskStatusColors[t.status] || ""} variant="secondary">
                        {taskStatusLabels[t.status] || t.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
