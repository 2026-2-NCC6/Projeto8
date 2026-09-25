import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Zap, Target, TrendingUp, Trophy, ArrowRight } from "lucide-react";

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const { data } = await api.get('/dashboard/me');
        setOverview(data.overview);
        setRecentSessions(data.recent_sessions);
      } catch (error) {
        console.error('Erro ao carregar dashboard', error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">A preparar a sua Arena...</div>;
  }

  if (!overview) {
    return <div className="p-8 text-center text-destructive">Não foi possível carregar as estatísticas.</div>;
  }

  // Cálculo básico de nível baseado nos pontos totais acumulados
  const totalPoints = overview.all_time_points || 0;
  const currentLevel = Math.floor(totalPoints / 500) + 1;
  const currentLevelProgress = (totalPoints % 500) / 5; // percentagem para o próximo nível (cada nível = 500pts)

  return (
    <AppShell
      title="Meu Painel"
      subtitle="Desempenho gamificado nas sessões da maquete"
      actions={
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to="/sessoes/nova">Nova sessão</Link>
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium">Pontos Totais</CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary stat-number">{overview.all_time_points}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Precisão Média</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold stat-number">{overview.average_accuracy}%</div>
              <p className="text-xs text-muted-foreground mt-1">Nos alvos de LED</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Maior Sequência</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold stat-number">x{overview.highest_streak}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Sessões Concluídas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold stat-number">{overview.total_sessions}</div>
            </CardContent>
          </Card>
        </div>

        {/* Barra de Progresso de Nível / XP */}
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-lg">Nível {currentLevel}</span>
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium">Ativo</span>
              </div>
              <span className="text-sm text-muted-foreground">{totalPoints} XP acumulados · próximo nível em {Math.max(0, 500 - (totalPoints % 500))} XP</span>
            </div>
            <Progress value={currentLevelProgress} className="h-2" />
          </CardContent>
        </Card>

        {/* Histórico Recente / Últimos Treinos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Últimas sessões</CardTitle>
              <CardDescription>Resumo rápido do seu histórico recente</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/minhas-sessoes" className="gap-1">
                Ver histórico <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSessions.length > 0 ? (
              recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium text-base">{session.title || 'Sessão de treino'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {session.ended_at ? new Date(session.ended_at).toLocaleDateString('pt-BR', { 
                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      }) : 'Data indisponível'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-primary">{session.total_points ?? 0} pts</span>
                    <span className="text-xs text-muted-foreground ml-3">{Number(session.accuracy ?? 0).toFixed(1)}% acerto</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center border border-dashed rounded-xl bg-muted/20">
                <p className="text-sm text-muted-foreground">Ainda não registou nenhuma sessão de treino concluída.</p>
                <Button asChild size="sm" className="mt-4">
                  <Link to="/sessoes/nova">Iniciar primeiro treino</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}