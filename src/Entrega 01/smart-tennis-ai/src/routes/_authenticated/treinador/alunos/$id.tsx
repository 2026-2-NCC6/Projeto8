import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Flame, Target, Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { StatCard } from "@/components/stat-card";
import { AccuracyTrendChart, TargetsBarChart } from "@/components/charts";
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
import { LEVEL_LABEL, SESSION_STATUS_LABEL, formatDateTime } from "@/lib/domain";
import { summarize } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/treinador/alunos/$id")({
  component: () => (
    // CORREÇÃO 1: allow mudou para allowedRoles
    <RoleGuard allowedRoles={["treinador", "admin"]}>
      <StudentDetail />
    </RoleGuard>
  ),
});

function StudentDetail() {
  const { id } = Route.useParams();

  // CORREÇÃO 2: Migração do Supabase para o Axios com fallback seguro
  const { data } = useQuery({
    queryKey: ["student-detail", id],
    queryFn: async () => {
      try {
        // Simulação das futuras rotas do Node.js
        const [profileRes, sessionsRes, hitsRes] = await Promise.all([
          api.get(`/treinador/alunos/${id}`),
          api.get(`/treinador/alunos/${id}/sessoes`),
          api.get(`/treinador/alunos/${id}/hits`)
        ]);
        
        return {
          profile: profileRes.data.profile,
          sessions: sessionsRes.data.sessions ?? [],
          hits: hitsRes.data.hits ?? [],
        };
      } catch (error) {
        // Se as rotas ainda não existirem no backend, devolvemos vazio para não quebrar o ecrã
        return { profile: null, sessions: [], hits: [] };
      }
    },
  });

  const sessions = data?.sessions ?? [];
  // CORREÇÃO 3: Tipagem explícita para evitar erros do TypeScript
  const done = sessions.filter((s: any) => s.status === "concluida");
  const stats = summarize(done);

  const trend = [...done]
    .reverse()
    .slice(-10)
    .map((s: any, i: number) => ({ label: `S${i + 1}`, value: Number(s.accuracy ?? 0) }));

  const byTarget = new Map<number, number>();
  (data?.hits ?? []).forEach((h: any) => {
    if (h.hit) byTarget.set(h.target_index, (byTarget.get(h.target_index) ?? 0) + 1);
  });
  const targets = [...byTarget.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([index, value]) => ({ label: `Alvo ${index + 1}`, value }));

  return (
    <AppShell
      title={data?.profile?.full_name ?? "Aluno"}
      subtitle={
        data?.profile?.tennis_level
          ? `Nível ${LEVEL_LABEL[data.profile.tennis_level as keyof typeof LEVEL_LABEL]}`
          : "Desempenho individual"
      }
      actions={
        <Button asChild variant="outline">
          <Link to="/treinador/alunos">Voltar</Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pontos" value={stats.points} icon={Trophy} accent />
        <StatCard label="Precisão média" value={`${stats.accuracy.toFixed(1)}%`} icon={Target} />
        <StatCard label="Melhor sequência" value={`x${stats.streak}`} icon={Flame} />
        <StatCard label="Sessões concluídas" value={stats.done} icon={Activity} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AccuracyTrendChart data={trend} />
        <TargetsBarChart data={targets} />
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sessões do aluno</CardTitle>
          <CardDescription>Histórico completo registrado na arena</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sessão</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Precisão</TableHead>
                <TableHead className="text-right">Pontos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session: any) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.title}</TableCell>
                  <TableCell>{formatDateTime(session.created_at)}</TableCell>
                  <TableCell>{SESSION_STATUS_LABEL[session.status as keyof typeof SESSION_STATUS_LABEL] || session.status}</TableCell>
                  <TableCell className="text-right">
                    {Number(session.accuracy).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">{session.total_points}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {sessions.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Este aluno ainda não registrou sessões.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </AppShell>
  );
}