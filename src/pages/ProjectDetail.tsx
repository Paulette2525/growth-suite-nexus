import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Plus, Calendar, Users, GripVertical } from "lucide-react";
import { useState } from "react";

interface Task {
  id: string;
  title: string;
  assignee: string;
  priority: "Haute" | "Moyenne" | "Basse";
  status: "todo" | "in_progress" | "done";
}

const initialTasks: Task[] = [
  { id: "1", title: "Maquettes UI/UX", assignee: "Marie", priority: "Haute", status: "done" },
  { id: "2", title: "Développement frontend", assignee: "Thomas", priority: "Haute", status: "in_progress" },
  { id: "3", title: "Intégration API", assignee: "Lucas", priority: "Moyenne", status: "in_progress" },
  { id: "4", title: "Tests unitaires", assignee: "Marie", priority: "Moyenne", status: "todo" },
  { id: "5", title: "Déploiement staging", assignee: "Thomas", priority: "Basse", status: "todo" },
  { id: "6", title: "Documentation", assignee: "Lucas", priority: "Basse", status: "todo" },
];

const columns = [
  { id: "todo" as const, title: "À faire", color: "bg-muted" },
  { id: "in_progress" as const, title: "En cours", color: "bg-primary/10" },
  { id: "done" as const, title: "Terminé", color: "bg-success/10" },
];

const priorityDot: Record<string, string> = {
  Haute: "bg-destructive",
  Moyenne: "bg-warning",
  Basse: "bg-muted-foreground",
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDrop = (columnId: "todo" | "in_progress" | "done") => {
    if (!draggedTask) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === draggedTask ? { ...t, status: columnId } : t))
    );
    setDraggedTask(null);
  };

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const progress = Math.round((doneCount / tasks.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/projets")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold">Site e-commerce Luxe</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">Site</Badge>
            <Badge className="bg-primary/10 text-primary" variant="secondary">En cours</Badge>
          </div>
        </div>
      </div>

      {/* Project Info Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Échéance</p>
              <p className="text-sm font-medium">15 mai 2026</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Membres</p>
              <p className="text-sm font-medium">3 assignés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Client</p>
            <p className="text-sm font-medium">Maison Dupont</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progression</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => (
          <div
            key={col.id}
            className={`rounded-xl p-4 ${col.color} min-h-[300px]`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(col.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-sm">
                {col.title}
                <span className="ml-2 text-muted-foreground font-normal">
                  {tasks.filter((t) => t.status === col.id).length}
                </span>
              </h3>
              {col.id === "todo" && (
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {tasks
                .filter((t) => t.status === col.id)
                .map((task) => (
                  <Card
                    key={task.id}
                    className="cursor-grab active:cursor-grabbing shadow-sm"
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="space-y-2 flex-1 min-w-0">
                          <p className="text-sm font-medium">{task.title}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{task.assignee}</span>
                            <div className="flex items-center gap-1">
                              <div className={`h-2 w-2 rounded-full ${priorityDot[task.priority]}`} />
                              <span className="text-xs text-muted-foreground">{task.priority}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
