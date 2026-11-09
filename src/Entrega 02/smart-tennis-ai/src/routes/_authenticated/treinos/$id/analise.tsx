import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Percent, Target, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { AccuracyTrendChart, TargetsBarChart } from "@/components/charts";
import { StatCard } from "@/components/stat-card";
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
import { formatDateTime } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/treinos/$id/analise")({
  component: () => (
    <RoleGuard allowedRoles={["treinador", "admin"]}>
      <TrainingAnalysis />
    </RoleGuard>
  ),
});

function TrainingAnalysis() {
  const { id } = Route.useParams();

  const { data: training } = useQuery({
    queryKey: ["training", id],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/trainings/${id}`);
        return data.training;
      } catch (error) {
        return null;
      }
    },
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["training-sessions", id],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/trainings/${id}/sessoes`);
        return data.sessions ?? [];
      } catch (error) {
        return [];
      }
    },
  });

  const { data: hits = [] } = useQuery({
    queryKey: ["training-hits", id, sessions.map((s: any) => s.id).join(",")],
    enabled: sessions.length > 0,
    queryFn: async () => {
      try {
        const { data } = await api.get(`/trainings/${id}/hits`);
        return data.hits ?? [];
      } catch (error) {
        return [];
      }
    },
  });

  const done = sessions.filter((s: any) => s.status === "concluida");
  const avgAccuracy = done.length
    ? done.reduce((acc: number, s: any) => acc + Number(s.accuracy ?? 0), 0) / done.length
    : 0;
  const totalPoints = done.reduce((acc: number, s: any) => acc + (s.total_points ?? 0), 0);
  const athletes = new Set(sessions.map((s: any) => s.user_id)).size;

  const trend = [...done]
    .reverse()
    .slice(-12)
    .map((s: any, index: number) => ({
      label: `S${index + 1}`,
      value: Math.round(Number(s.accuracy ?? 0)),
    }));

  const perTarget = new Map<number, number>();
  for (const hit of hits) {
    if (!hit.hit) continue;
    perTarget.set(hit.target_index, (perTarget.get(hit.target_index) ?? 0) + 1);
  }
  const targetsData = Array.from({ length: training?.target_count ?? 6 }, (_, index) => ({
    label: `Alvo ${index + 1}`,
    value: perTarget.get(index) ?? 0,
  }));

  return (
    <AppShell
      title="Análise do treino"
      subtitle={training?.title ?? "Carregando…"}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Sessões concluídas" value={done.length} icon={Activity} accent />
        <StatCard label="Precisão média" value={`${avgAccuracy.toFixed(1)}%`} icon={Percent} />
        <StatCard label="Pontos gerados" value={totalPoints} icon={Target} />
        <StatCard label="Atletas alcançados" value={athletes} icon={Users} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AccuracyTrendChart
          data={trend}
          title="Evolução da precisão"
          description="Sessões concluídas com este treino"
        />
        <TargetsBarChart data={targetsData} />
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sessões registradas</CardTitle>
          <CardDescription>Execuções da arena vinculadas a este treino</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma sessão executada com este treino ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sessão</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Precisão</TableHead>
                  <TableHead className="text-right">Pontos</TableHead>
                  <TableHead className="text-right">Melhor combo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session: any) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.title}</TableCell>
                    <TableCell>{formatDateTime(session.created_at)}</TableCell>
                    <TableCell className="text-right">
                      {Number(session.accuracy ?? 0).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">{session.total_points}</TableCell>
                    <TableCell className="text-right">{session.best_streak}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}