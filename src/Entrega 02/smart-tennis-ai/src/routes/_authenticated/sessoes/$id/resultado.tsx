import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, Flame, Target, Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { StatCard } from "@/components/stat-card";
import { TargetsBarChart } from "@/components/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import { SESSION_STATUS_LABEL, formatDateTime } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/sessoes/$id/resultado")({
  component: () => (
    <RoleGuard allowedRoles={["praticante", "treinador", "admin"]}>
      <SessionResult />
    </RoleGuard>
  ),
});

function SessionResult() {
  const { id } = Route.useParams();

  // MIGRAÇÃO: Supabase -> Axios para buscar dados da sessão e hits
  const { data } = useQuery({
    queryKey: ["session-result", id],
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

  const reactions = hits.filter((h: any) => h.reaction_ms).map((h: any) => h.reaction_ms as number);
  const avgReaction = reactions.length
    ? Math.round(reactions.reduce((acc: number, value: number) => acc + value, 0) / reactions.length)
    : 0;

  const medals = [
    { label: "Precisão de elite", won: Number(session?.accuracy ?? 0) >= 80 },
    { label: "Combo x5", won: (session?.best_streak ?? 0) >= 5 },
    { label: "Reflexo rápido", won: avgReaction > 0 && avgReaction < 700 },
  ];

  return (
    <AppShell
      title="Resultado da sessão"
      subtitle={session ? `${session.title} · ${formatDateTime(session.ended_at)}` : ""}
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/minhas-sessoes">Histórico</Link>
          </Button>
          <Button asChild>
            <Link to="/sessoes/nova">Nova sessão</Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pontos" value={session?.total_points ?? 0} icon={Trophy} accent />
        <StatCard
          label="Precisão"
          value={`${Number(session?.accuracy ?? 0).toFixed(1)}%`}
          icon={Target}
        />
        <StatCard label="Melhor combo" value={`x${session?.best_streak ?? 0}`} icon={Flame} />
        <StatCard label="Bônus" value={session?.bonus_points ?? 0} icon={Award} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TargetsBarChart data={targets} description="Acertos por alvo nesta sessão" />
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Conquistas</CardTitle>
            <CardDescription>Medalhas desbloqueadas nesta sessão</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {medals.map((medal) => (
              <div
                key={medal.label}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm"
              >
                <span className="font-medium">{medal.label}</span>
                <Badge variant={medal.won ? "default" : "secondary"}>
                  {medal.won ? "Conquistada" : "Bloqueada"}
                </Badge>
              </div>
            ))}
            <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
              Tempo médio de reação: {avgReaction || "—"} ms · Status:{" "}
              {session ? SESSION_STATUS_LABEL[session.status as keyof typeof SESSION_STATUS_LABEL] || session.status : "—"}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}