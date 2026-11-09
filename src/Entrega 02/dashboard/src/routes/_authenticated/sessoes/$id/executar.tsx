import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Flame, Target, Timer, Trophy } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/services/api";
import { computeHitPoints } from "@/lib/domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/sessoes/$id/executar")({
  component: () => (
    <RoleGuard allowedRoles={["praticante", "treinador", "admin"]}>
      <RunSession />
    </RoleGuard>
  ),
});

type Attempt = {
  targetIndex: number;
  hit: boolean;
  accuracy: number;
  reactionMs: number;
  points: number;
  bonus: number;
};

function RunSession() {
  const { id } = Route.useParams();
  const navigate = Route.useNavigate();

  // MIGRAÇÃO: Supabase -> Axios para buscar dados da sessão
  const { data: session } = useQuery({
    queryKey: ["session", id],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/sessoes/${id}`);
        return data.session;
      } catch (error) {
        return null;
      }
    },
  });

  const targetCount = session?.target_count ?? 6;
  const planned = session?.planned_duration_seconds ?? 300;

  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [streak, setStreak] = useState(0);
  const [saving, setSaving] = useState(false);
  const litAt = useRef<number>(0);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (running && elapsed >= planned) {
      setRunning(false);
      setActive(null);
      toast.info("Tempo planejado concluído. Finalize a sessão para ver o resultado.");
    }
  }, [running, elapsed, planned]);

  useEffect(() => {
    if (!running) return;
    const lightUp = () => {
      setActive(Math.floor(Math.random() * targetCount));
      litAt.current = Date.now();
    };
    lightUp();
    const interval = Math.max(1600 - (session?.difficulty ?? 2) * 180, 700);
    const timer = window.setInterval(lightUp, interval);
    return () => window.clearInterval(timer);
  }, [running, targetCount, session?.difficulty]);

  const stats = useMemo(() => {
    const hits = attempts.filter((a) => a.hit);
    const points = attempts.reduce((acc, a) => acc + a.points, 0);
    const bonus = attempts.reduce((acc, a) => acc + a.bonus, 0);
    const accuracy = attempts.length ? (hits.length / attempts.length) * 100 : 0;
    let best = 0;
    let current = 0;
    attempts.forEach((a) => {
      current = a.hit ? current + 1 : 0;
      best = Math.max(best, current);
    });
    return { points, bonus, accuracy, best, total: attempts.length, hits: hits.length };
  }, [attempts]);

  function registerAttempt(index: number) {
    if (!running || active === null) return;
    const reactionMs = Date.now() - litAt.current;
    const hit = index === active;
    const accuracy = hit ? Math.max(55, 100 - Math.round(reactionMs / 25)) : 0;
    const nextStreak = hit ? streak + 1 : 0;
    const { points, bonus } = computeHitPoints({ hit, accuracy, reactionMs, streak });
    setStreak(nextStreak);
    setAttempts((current) => [...current, { targetIndex: index, hit, accuracy, reactionMs, points, bonus }]);
    setActive(null);
  }

  // MIGRAÇÃO: Envio de tentativas e conclusão via Axios
  async function finish() {
    if (!session) return;
    setSaving(true);
    try {
      if (attempts.length > 0) {
        await api.post(`/sessoes/${id}/hits`, {
          hits: attempts.map((attempt) => ({
            target_index: attempt.targetIndex,
            hit: attempt.hit,
            accuracy: attempt.accuracy,
            reaction_ms: attempt.reactionMs,
            points: attempt.points,
          })),
        });
      }

      await api.put(`/sessoes/${id}`, {
        status: "concluida",
        started_at: session.started_at ?? new Date(Date.now() - elapsed * 1000).toISOString(),
        ended_at: new Date().toISOString(),
        total_points: stats.points,
        bonus_points: stats.bonus,
        accuracy: Number(stats.accuracy.toFixed(2)),
        best_streak: stats.best,
      });

      navigate({ to: "/sessoes/$id/resultado", params: { id } });
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setSaving(false);
    }
  }

  async function start() {
    setRunning(true);
    try {
      await api.put(`/sessoes/${id}`, {
        status: "em_andamento",
        started_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro ao atualizar status para em andamento", error);
    }
  }

  const remaining = Math.max(planned - elapsed, 0);

  return (
    <AppShell
      title={session?.title ?? "Execução da sessão"}
      subtitle="Acompanhamento em tempo real dos alvos de LED"
      actions={
        running ? (
          <Button variant="outline" onClick={() => setRunning(false)}>
            Pausar
          </Button>
        ) : (
          <Button onClick={() => void start()}>{elapsed > 0 ? "Retomar" : "Iniciar"}</Button>
        )
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pontos" value={stats.points} icon={Trophy} accent />
        <StatCard label="Precisão" value={`${stats.accuracy.toFixed(0)}%`} icon={Target} />
        <StatCard label="Combo atual" value={`x${streak}`} icon={Flame} hint={`Melhor: x${stats.best}`} />
        <StatCard
          label="Tempo restante"
          value={`${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
          icon={Timer}
        />
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Arena · alvos de LED</CardTitle>
          <CardDescription>
            Toque no alvo aceso para registrar a rebatida. Rebatidas rápidas valem bônus.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: targetCount }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => registerAttempt(index)}
                disabled={!running}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-2xl border-2 font-display text-2xl transition-all",
                  active === index
                    ? "scale-105 border-primary bg-primary text-primary-foreground shadow-lg"
                    : "border-border bg-card text-muted-foreground",
                  !running && "opacity-60",
                )}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <Progress className="mt-6" value={(elapsed / planned) * 100} />
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => void finish()} disabled={saving}>
              {saving ? "Salvando…" : "Finalizar sessão"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setAttempts([]);
                setStreak(0);
                setElapsed(0);
              }}
            >
              Zerar contadores
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rebatidas registradas</CardTitle>
          <CardDescription>
            {stats.hits} acertos em {stats.total} tentativas
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {attempts.slice(-24).map((attempt, index) => (
            <span
              key={index}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                attempt.hit
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground",
              )}
            >
              Alvo {attempt.targetIndex + 1} · {attempt.hit ? `${attempt.points} pts` : "erro"}
            </span>
          ))}
          {attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma rebatida registrada ainda.</p>
          ) : null}
        </CardContent>
      </Card>
    </AppShell>
  );
}