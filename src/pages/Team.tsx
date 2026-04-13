import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Mail, FolderKanban, ListTodo } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const roleColors: Record<string, string> = {
  Admin: "bg-primary/10 text-primary",
  Développeur: "bg-success/10 text-success",
  Designer: "bg-warning/10 text-warning",
  "Chef de projet": "bg-accent text-accent-foreground",
};

const avatarColors = ["bg-primary", "bg-success", "bg-warning", "bg-destructive"];

export default function Team() {
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
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

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t: any) => t.status === "done").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Équipe</h1>
        <p className="text-muted-foreground mt-1">Gérez vos membres et leur charge de travail</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-heading font-bold">{profiles.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Membres</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-heading font-bold">{totalTasks}</p>
            <p className="text-sm text-muted-foreground mt-1">Tâches totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-heading font-bold">
              {totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">Taux de complétion</p>
          </CardContent>
        </Card>
      </div>

      {profiles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Aucun membre pour le moment.</p>
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
                      <h3 className="font-medium truncate">{member.full_name || "Sans nom"}</h3>
                      <Badge className={roleColors[member.role] || ""} variant="secondary">{member.role}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" />{member.email}
                    </p>
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
    </div>
  );
}
