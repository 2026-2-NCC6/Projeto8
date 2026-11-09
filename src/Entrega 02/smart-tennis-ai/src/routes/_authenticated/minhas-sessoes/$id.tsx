import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Target, Timer, Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { StatCard } from "@/components/stat-card";
import { TargetsBarChart } from "@/components/charts";
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
import { formatDateTime } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/minhas-sessoes/$id")({
  component: () => (
    <RoleGuard allowedRoles={["praticante", "treinador", "admin"]}>
      <SessionDetail />
    </RoleGuard>
  ),
});

function SessionDetail() {
  const { id } = Route.useParams();

  // MIGRAÇÃO: Supabase -> Axios para buscar detalhes e hits da sessão
  const { data } = useQuery({
    queryKey: ["session-detail", id],
    queryFn: async () => {
      try {
        const [sessionRes, hitsRes] = await Promise.all([
          api.get(`/sessoes/${id}`),
          api.get(`/sessoes/${id}/hits`),
        ]);
        return {
          session: sessionRes.data.session,
          hits: hitsRes.data.hits ?? [],
        };
      } catch (error) {
        return { session: null, hits: [] };
      }
    },
  });

  const session = data?.session;
  const hits = data?.hits ?? [];

  const byTarget = new Map<number, number>();
  hits.forEach((h: any) => {
    if (h.hit) byTarget.set(h.target_index, (byTarget.get(h.target_index) ?? 0) + 1);
  });
  const targets = [...byTarget.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([index, value]) => ({ label: `Alvo ${index + 1}`, value }));

  return (
    <AppShell
      title={session?.title ?? "Sessão"}
      subtitle={session ? formatDateTime(session.created_at) : "Carregando…"}
      actions={
        <Button asChild variant="outline">
          <Link to="/minhas-sessoes">Voltar</Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pontos" value={session?.total_points ?? 0} icon={Trophy} accent />
        <StatCard
          label="Precisão"
          value={`${Number(session?.accuracy ?? 0).toFixed(1)}%`}
          icon={Target}
        />
        <StatCard label="Melhor sequência" value={`x${session?.best_streak ?? 0}`} icon={Flame} />
        <StatCard label="Bônus" value={session?.bonus_points ?? 0} icon={Timer} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TargetsBarChart data={targets} description="Acertos por alvo nesta sessão" />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Rebatidas registradas</CardTitle>
            <CardDescription>Leitura dos sensores da arena</CardDescription>
          </CardHeader>
          <CardContent className="max-h-64 overflow-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alvo</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead className="text-right">Precisão</TableHead>
                  <TableHead className="text-right">Reação</TableHead>
                  <TableHead className="text-right">Pontos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hits.map((hit: any) => (
                  <TableRow key={hit.id}>
                    <TableCell>Alvo {hit.target_index + 1}</TableCell>
                    <TableCell className={hit.hit ? "text-success" : "text-muted-foreground"}>
                      {hit.hit ? "Acerto" : "Erro"}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(hit.accuracy).toFixed(0)}%
                    </TableCell>
                    <TableCell className="text-right">{hit.reaction_ms ?? "—"} ms</TableCell>
                    <TableCell className="text-right">{hit.points}</TableCell>
                  </TableRow>
                ))}
                {hits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Nenhuma rebatida registrada.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}