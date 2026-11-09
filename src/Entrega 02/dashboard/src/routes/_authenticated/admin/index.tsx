import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, ClipboardList, Percent, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { AccuracyTrendChart } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/services/api";
import { TRAINING_STATUS_LABEL, formatDateTime } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: () => (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminOverview />
    </RoleGuard>
  ),
});

function AdminOverview() {
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/admin/profiles");
        return data.profiles ?? [];
      } catch (error) {
        return [];
      }
    },
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["admin-sessions"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/admin/sessions");
        return data.sessions ?? [];
      } catch (error) {
        return [];
      }
    },
  });

  const { data: trainings = [] } = useQuery({
    queryKey: ["admin-trainings"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/admin/trainings");
        return data.trainings ?? [];
      } catch (error) {
        return [];
      }
    },
  });

  const done = sessions.filter((s: any) => s.status === "concluida");
  const avgAccuracy = done.length
    ? done.reduce((acc: number, s: any) => acc + Number(s.accuracy ?? 0), 0) / done.length
    : 0;

  const trend = [...done]
    .reverse()
    .slice(-12)
    .map((s: any, index: number) => ({ label: `S${index + 1}`, value: Math.round(Number(s.accuracy ?? 0)) }));

  return (
    <AppShell
      title="Visão geral"
      subtitle="Gestão administrativa da plataforma Smart Tennis Arena"
      actions={
        <Button asChild variant="outline">
          <Link to="/admin/usuarios">Gerenciar usuários</Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Usuários cadastrados" value={profiles.length} icon={Users} accent />
        <StatCard label="Sessões concluídas" value={done.length} icon={Activity} />
        <StatCard label="Precisão média" value={`${avgAccuracy.toFixed(1)}%`} icon={Percent} />
        <StatCard label="Treinos na base" value={trainings.length} icon={ClipboardList} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[3fr_2fr]">
        <AccuracyTrendChart
          data={trend}
          title="Precisão global"
          description="Últimas sessões concluídas na arena"
        />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Treinos recentes</CardTitle>
            <CardDescription>Últimas alterações na biblioteca</CardDescription>
          </CardHeader>
          <CardContent>
            {trainings.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum treino cadastrado.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Treino</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Atualizado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainings.map((training: any) => (
                    <TableRow key={training.id}>
                      <TableCell className="font-medium">
                        {training.title}
                        <span className="ml-2 text-xs text-muted-foreground">
                          v{training.version || "1.0"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={training.status === "publicado" ? "default" : "secondary"}
                        >
                          {TRAINING_STATUS_LABEL[training.status as keyof typeof TRAINING_STATUS_LABEL] || training.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {formatDateTime(training.updated_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}