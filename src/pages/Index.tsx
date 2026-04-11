import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, ListTodo, Users, Receipt, AlertTriangle, Clock } from "lucide-react";

const kpis = [
  { label: "Projets actifs", value: 8, icon: FolderKanban, color: "text-primary" },
  { label: "Tâches en cours", value: 23, icon: ListTodo, color: "text-warning" },
  { label: "Membres", value: 5, icon: Users, color: "text-success" },
  { label: "Factures en attente", value: 3, icon: Receipt, color: "text-destructive" },
];

const projects = [
  { name: "Site e-commerce Luxe", type: "Site", progress: 72, status: "En cours" },
  { name: "SaaS Analytics Pro", type: "SaaS", progress: 45, status: "En cours" },
  { name: "Plateforme RH", type: "Plateforme", progress: 90, status: "En cours" },
  { name: "App Mobile Fitness", type: "Site", progress: 20, status: "En retard" },
];

const activities = [
  { text: "Nouvelle tâche ajoutée au projet SaaS Analytics", time: "Il y a 2h", icon: ListTodo },
  { text: "Marie a terminé le design de la page d'accueil", time: "Il y a 4h", icon: FolderKanban },
  { text: "Facture #1042 envoyée au client Dupont", time: "Hier", icon: Receipt },
  { text: "Thomas a rejoint l'équipe", time: "Hier", icon: Users },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Vue d'ensemble de vos projets et activités</p>
      </div>

      {/* KPI Cards */}
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
        {/* Projects Progress */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Avancement des projets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {projects.map((project) => (
              <div key={project.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{project.name}</span>
                    <Badge variant="secondary" className="text-xs">{project.type}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {project.status === "En retard" && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-sm text-muted-foreground">{project.progress}%</span>
                  </div>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.map((activity, i) => (
                <div key={i} className="flex gap-3">
                  <div className="p-2 rounded-lg bg-accent shrink-0">
                    <activity.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm leading-snug">{activity.text}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
