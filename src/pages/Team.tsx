import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Plus, Mail, FolderKanban, ListTodo } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Développeur" | "Designer" | "Chef de projet";
  initials: string;
  projects: number;
  tasks: number;
  tasksDone: number;
  color: string;
}

const members: TeamMember[] = [
  { id: "1", name: "Jean Martin", email: "jean@progest.fr", role: "Admin", initials: "JM", projects: 5, tasks: 8, tasksDone: 5, color: "bg-primary" },
  { id: "2", name: "Marie Leroy", email: "marie@progest.fr", role: "Designer", initials: "ML", projects: 3, tasks: 6, tasksDone: 4, color: "bg-success" },
  { id: "3", name: "Thomas Dubois", email: "thomas@progest.fr", role: "Développeur", initials: "TD", projects: 4, tasks: 10, tasksDone: 6, color: "bg-warning" },
  { id: "4", name: "Lucas Bernard", email: "lucas@progest.fr", role: "Développeur", initials: "LB", projects: 3, tasks: 7, tasksDone: 3, color: "bg-destructive" },
  { id: "5", name: "Sophie Moreau", email: "sophie@progest.fr", role: "Chef de projet", initials: "SM", projects: 4, tasks: 5, tasksDone: 4, color: "bg-primary" },
];

const roleColors: Record<string, string> = {
  Admin: "bg-primary/10 text-primary",
  Développeur: "bg-success/10 text-success",
  Designer: "bg-warning/10 text-warning",
  "Chef de projet": "bg-accent text-accent-foreground",
};

export default function Team() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Équipe</h1>
          <p className="text-muted-foreground mt-1">Gérez vos membres et leur charge de travail</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Inviter un membre</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-heading font-bold">{members.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Membres</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-heading font-bold">{members.reduce((s, m) => s + m.tasks, 0)}</p>
            <p className="text-sm text-muted-foreground mt-1">Tâches totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-3xl font-heading font-bold">
              {Math.round((members.reduce((s, m) => s + m.tasksDone, 0) / members.reduce((s, m) => s + m.tasks, 0)) * 100)}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">Taux de complétion</p>
          </CardContent>
        </Card>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {members.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className={`${member.color} text-primary-foreground font-heading font-semibold`}>
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">{member.name}</h3>
                    <Badge className={roleColors[member.role]} variant="secondary">{member.role}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Mail className="h-3 w-3" />{member.email}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                  <span>{member.projects} projets</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ListTodo className="h-4 w-4 text-muted-foreground" />
                  <span>{member.tasks} tâches</span>
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Charge de travail</span>
                  <span>{member.tasksDone}/{member.tasks}</span>
                </div>
                <Progress value={(member.tasksDone / member.tasks) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
