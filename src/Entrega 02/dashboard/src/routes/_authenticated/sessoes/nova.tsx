import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/use-auth";
import { api } from "@/services/api";
import { fetchTrainings } from "@/lib/queries";
import { LEVEL_LABEL } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/sessoes/nova")({
  validateSearch: (search: Record<string, unknown>): { training?: string } => {
    const value = search["training"];
    return typeof value === "string" ? { training: value } : {};
  },

  component: () => (
    // CORREÇÃO: allowedRoles em vez de allow
    <RoleGuard allowedRoles={["praticante", "treinador", "admin"]}>
      <NewSession />
    </RoleGuard>
  ),
});

function NewSession() {
  const navigate = useNavigate();
  const { training } = Route.useSearch();
  const { data: me } = useCurrentUser();

  const [title, setTitle] = useState("Sessão de treino");
  const [difficulty, setDifficulty] = useState(2);
  const [targetCount, setTargetCount] = useState(6);
  const [minutes, setMinutes] = useState(5);
  const [trainingId, setTrainingId] = useState(training ?? "");

  const { data: trainings = [] } = useQuery({
    queryKey: ["trainings"],
    queryFn: fetchTrainings,
  });

  // MIGRAÇÃO: Supabase Insert -> Axios Post
  const create = useMutation({
    mutationFn: async () => {
      try {
        const { data } = await api.post("/sessoes", {
          title,
          difficulty,
          target_count: targetCount,
          planned_duration_seconds: minutes * 60,
          training_id: trainingId || null,
        });
        
        // Assumimos que o backend retorna o ID ou o objeto da sessão criada
        return (data.id || data.session?.id) as string;
      } catch (error: any) {
        throw new Error(error.response?.data?.error || "Erro ao configurar a sessão.");
      }
    },
    onSuccess: (id) => {
      if (id) {
        navigate({ to: "/sessoes/$id/executar", params: { id } });
      } else {
        // Se a rota do Node ainda não retornar o ID adequadamente, volta à lista por segurança
        toast.success("Sessão configurada com sucesso.");
        navigate({ to: "/sessoes" });
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell title="Configurar sessão" subtitle="Defina os parâmetros da arena antes de iniciar">
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Parâmetros da sessão</CardTitle>
            <CardDescription>Ajuste dificuldade, alvos e duração</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Treino base (opcional)</Label>
              <Select value={trainingId} onValueChange={setTrainingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sessão livre" />
                </SelectTrigger>
                <SelectContent>
                  {trainings
                    .filter((item: any) => item.status === "publicado")
                    .map((item: any) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.title} · {LEVEL_LABEL[item.level as keyof typeof LEVEL_LABEL]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Dificuldade: nível {difficulty}</Label>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[difficulty]}
                onValueChange={(value) => setDifficulty(value[0] ?? 1)}
              />
            </div>

            <div className="space-y-3">
              <Label>Alvos de LED ativos: {targetCount}</Label>
              <Slider
                min={3}
                max={9}
                step={1}
                value={[targetCount]}
                onValueChange={(value) => setTargetCount(value[0] ?? 3)}
              />
            </div>

            <div className="space-y-3">
              <Label>Duração planejada: {minutes} min</Label>
              <Slider
                min={1}
                max={30}
                step={1}
                value={[minutes]}
                onValueChange={(value) => setMinutes(value[0] ?? 1)}
              />
            </div>

            <Button
              className="w-full"
              disabled={create.isPending || !me?.userId}
              onClick={() => create.mutate()}
            >
              {create.isPending ? "Criando…" : "Iniciar sessão"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Prévia da arena</CardTitle>
            <CardDescription>Distribuição dos alvos de LED na quadra</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: targetCount }).map((_, index) => (
                <div
                  key={index}
                  className="flex aspect-square items-center justify-center rounded-xl border border-primary/30 bg-primary/10 font-display text-lg text-primary"
                >
                  {index + 1}
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Cada alvo acende em sequência aleatória. A precisão da rebatida e o tempo de reação
              definem os pontos e os bônus de combo.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}