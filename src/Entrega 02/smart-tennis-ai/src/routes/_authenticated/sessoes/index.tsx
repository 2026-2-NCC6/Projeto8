import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Play, Target } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-auth";
import { fetchMySessions } from "@/lib/queries";
import { SESSION_STATUS_LABEL, formatDateTime } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/sessoes/")({
  component: () => (
    // CORREÇÃO: Propriedade allowedRoles corrigida
    <RoleGuard allowedRoles={["praticante", "treinador", "admin"]}>
      <SessionsHub />
    </RoleGuard>
  ),
});

function SessionsHub() {
  const { data: me } = useCurrentUser();

  const { data: sessions = [] } = useQuery({
    queryKey: ["my-sessions", me?.userId],
    enabled: !!me?.userId,
    queryFn: () => fetchMySessions(me?.userId),
  });

  // CORREÇÃO: Tipagem 'any' para evitar quebra do TypeScript
  const open = sessions.filter(
    (s: any) => s.status === "configurada" || s.status === "em_andamento",
  );

  return (
    <AppShell
      title="Sessões na arena"
      subtitle="Selecione, configure e execute treinos na maquete com alvos de LED"
      actions={
        <Button asChild>
          <Link to="/sessoes/nova">Configurar nova sessão</Link>
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/30 bg-accent/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">1. Configurar</CardTitle>
            <CardDescription>Dificuldade, alvos, duração e treino base</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link to="/sessoes/nova">
                <Target className="mr-2 h-4 w-4" /> Começar
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">2. Executar</CardTitle>
            <CardDescription>
              Acompanhamento em tempo real dos alvos de LED e da pontuação
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Cada rebatida registra precisão, tempo de reação e bônus de sequência.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">3. Resultado</CardTitle>
            <CardDescription>Resumo gamificado com pontos, bônus e mapa de alvos</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            O histórico completo fica disponível no seu painel.
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sessões em aberto</CardTitle>
          <CardDescription>Retome uma sessão configurada ou em andamento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* CORREÇÃO: Tipagem 'any' para session */}
          {open.map((session: any) => (
            <div
              key={session.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{session.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(session.created_at)} · {session.target_count} alvos ·
                  dificuldade {session.difficulty}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {SESSION_STATUS_LABEL[session.status as keyof typeof SESSION_STATUS_LABEL] || session.status}
                </Badge>
                <Button asChild size="sm">
                  <Link to="/sessoes/$id/executar" params={{ id: session.id }}>
                    <Play className="mr-2 h-4 w-4" /> Executar
                  </Link>
                </Button>
              </div>
            </div>
          ))}
          {open.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhuma sessão em aberto. Configure uma nova para treinar.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </AppShell>
  );
}