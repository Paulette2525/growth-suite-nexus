import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Calendar, Users, GripVertical, ListTodo, Copy, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ActionMenu } from "@/components/ActionMenu";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const columns = [
  { id: "todo" as const, title: "À faire", color: "bg-muted/50" },
  { id: "in_progress" as const, title: "En cours", color: "bg-primary/5" },
  { id: "done" as const, title: "Terminé", color: "bg-success/5" },
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
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Moyenne");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [copied, setCopied] = useState(false);
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

  const { data: intakeForm } = useQuery({
    queryKey: ["intake-form", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_intake_forms")
        .select("generated_prompt")
        .eq("project_id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name");
      if (error) throw error;
      return data;
    },
  });

  const resetTaskForm = () => {
    setNewTaskTitle(""); setNewTaskPriority("Moyenne");
    setNewTaskAssignee(""); setNewTaskDescription("");
    setEditingTask(null);
  };

  const openEditTask = (task: any) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNewTaskPriority(task.priority);
    setNewTaskAssignee(task.assignee_id || "");
    setNewTaskDescription(task.description || "");
    setTaskDialogOpen(true);
  };

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", id] }),
  });

  const saveTask = useMutation({
    mutationFn: async () => {
      const payload = {
        title: newTaskTitle,
        priority: newTaskPriority,
        assignee_id: newTaskAssignee || null,
        description: newTaskDescription || null,
      };
      if (editingTask) {
        const { error } = await supabase.from("tasks").update(payload).eq("id", editingTask.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tasks").insert({
          ...payload,
          project_id: id!,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
      setTaskDialogOpen(false);
      resetTaskForm();
      toast({ title: editingTask ? "Tâche modifiée" : "Tâche ajoutée" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
      setDeleteTaskId(null);
      toast({ title: "Tâche supprimée" });
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
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-heading font-bold truncate">{project.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline">{project.type}</Badge>
            <Badge className="bg-primary/10 text-primary" variant="secondary">{project.status}</Badge>
            {project.clients?.name && (
              <span className="text-sm text-muted-foreground">• {project.clients.name}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Échéance</p>
              <p className="text-sm font-medium truncate">{project.deadline || "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ListTodo className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Tâches</p>
              <p className="text-sm font-medium">{doneCount}/{tasks.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Assignés</p>
              <p className="text-sm font-medium">
                {new Set(tasks.filter((t: any) => t.assignee_id).map((t: any) => t.assignee_id)).size}
              </p>
            </div>
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

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-semibold">Tableau Kanban</h2>
        <Button size="sm" onClick={() => { resetTaskForm(); setTaskDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />Nouvelle tâche
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => (
          <div
            key={col.id}
            className={`rounded-xl p-4 ${col.color} min-h-[250px] border border-border/50`}
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
            </div>

            <div className="space-y-2.5">
              {tasks
                .filter((t: any) => t.status === col.id)
                .map((task: any) => (
                  <Card
                    key={task.id}
                    className="cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow"
                    draggable
                    onDragStart={() => setDraggedTask(task.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-sm font-medium leading-tight">{task.title}</p>
                            <ActionMenu
                              onEdit={() => openEditTask(task)}
                              onDelete={() => setDeleteTaskId(task.id)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground truncate">
                              {task.profiles?.full_name || "Non assigné"}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
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

      {/* Lovable Prompt Section */}
      {intakeForm?.generated_prompt && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Prompt Lovable généré
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(intakeForm.generated_prompt!);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                  toast({ title: "Prompt copié !" });
                }}
              >
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? "Copié" : "Copier"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto font-sans leading-relaxed">
              {intakeForm.generated_prompt}
            </pre>
          </CardContent>
        </Card>
      )}

        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? "Modifier la tâche" : "Nouvelle tâche"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveTask.mutate(); }} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input placeholder="Titre de la tâche..." value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} required autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Haute">Haute</SelectItem>
                    <SelectItem value="Moyenne">Moyenne</SelectItem>
                    <SelectItem value="Basse">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assigné à</Label>
                <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                  <SelectTrigger><SelectValue placeholder="Non assigné" /></SelectTrigger>
                  <SelectContent>
                    {profiles.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name || "Sans nom"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="Description optionnelle..." value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={saveTask.isPending}>
              {saveTask.isPending ? "Enregistrement..." : editingTask ? "Enregistrer" : "Créer la tâche"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTaskId}
        onOpenChange={() => setDeleteTaskId(null)}
        title="Supprimer la tâche"
        description="Cette tâche sera définitivement supprimée."
        onConfirm={() => deleteTaskId && deleteTask.mutate(deleteTaskId)}
        loading={deleteTask.isPending}
      />
    </div>
  );
}
