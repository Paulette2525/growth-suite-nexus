import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, ListTodo, Users, Receipt, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*");
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

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("invoices").select("*");
      if (error) throw error;
      return data;
    },
  });

  const activeProjects = projects.filter((p) => p.status === "En cours").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const pendingInvoices = invoices.filter((i) => i.status !== "Payé").length;

  const kpis = [
    { label: "Projets actifs", value: activeProjects, icon: FolderKanban, color: "text-primary" },
    { label: "Tâches en cours", value: inProgressTasks, icon: ListTodo, color: "text-warning" },
    { label: "Membres", value: profiles.length, icon: Users, color: "text-success" },
    { label: "Factures en attente", value: pendingInvoices, icon: Receipt, color: "text-destructive" },
  ];

  // Calculate progress per project based on tasks
  const projectsWithProgress = projects.slice(0, 4).map((project) => {
    const projectTasks = tasks.filter((t) => t.project_id === project.id);
    const doneTasks = projectTasks.filter((t) => t.status === "done").length;
    const progress = projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0;
    return { ...project, progress };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Vue d'ensemble de vos projets et activités</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-3xl font-heading font-bold mt-1">{kpi.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-accent ${kpi.color}`}>
                  <kpi.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Avancement des projets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {projectsWithProgress.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun projet pour le moment.</p>
            )}
            {projectsWithProgress.map((project) => (
              <div key={project.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{project.name}</span>
                    <Badge variant="secondary" className="text-xs">{project.type}</Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Les activités apparaîtront ici au fur et à mesure.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
