import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Calendar, Users, GripVertical } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, clients(name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, profiles(full_name)")
        .eq("project_id", id!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", id] }),
  });

  const createTask = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tasks").insert({
        project_id: id!,
        title: newTaskTitle,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
      setNewTaskTitle("");
      setAddingTask(false);
      toast({ title: "Tâche ajoutée" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const handleDrop = (columnId: string) => {
    if (!draggedTask) return;
    updateTaskStatus.mutate({ taskId: draggedTask, status: columnId });
    setDraggedTask(null);
  };

  const doneCount = tasks.filter((t: any) => t.status === "done").length;
  const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/projets")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold">{project.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{project.type}</Badge>
            <Badge className="bg-primary/10 text-primary" variant="secondary">{project.status}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Échéance</p>
              <p className="text-sm font-medium">{project.deadline || "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Tâches</p>
              <p className="text-sm font-medium">{tasks.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Client</p>
            <p className="text-sm font-medium">{project.clients?.name || "—"}</p>
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
                  {tasks.filter((t: any) => t.status === col.id).length}
                </span>
              </h3>
              {col.id === "todo" && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAddingTask(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>

            {col.id === "todo" && addingTask && (
              <form onSubmit={(e) => { e.preventDefault(); createTask.mutate(); }} className="mb-3">
                <Input
                  autoFocus
                  placeholder="Titre de la tâche..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onBlur={() => { if (!newTaskTitle) setAddingTask(false); }}
                />
              </form>
            )}

            <div className="space-y-3">
              {tasks
                .filter((t: any) => t.status === col.id)
                .map((task: any) => (
                  <Card
                    key={task.id}
                    className="cursor-grab active:cursor-grabbing shadow-sm"
                    draggable
                    onDragStart={() => setDraggedTask(task.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="space-y-2 flex-1 min-w-0">
                          <p className="text-sm font-medium">{task.title}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {task.profiles?.full_name || "Non assigné"}
                            </span>
                            <div className="flex items-center gap-1">
                              <div className={`h-2 w-2 rounded-full ${priorityDot[task.priority] || "bg-muted-foreground"}`} />
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
