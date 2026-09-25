import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import {
  LEVEL_LABEL,
  TRAINING_STATUS_LABEL,
  formatDateTime,
  type TrainingStatus,
} from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/treinos/$id/")({
  component: () => (
    // CORREÇÃO: Usar a propriedade 'allowedRoles'
    <RoleGuard allowedRoles={["treinador", "admin"]}>
      <TrainingDetail />
    </RoleGuard>
  ),
});

function TrainingDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();

  // MIGRAÇÃO: Supabase -> Axios (com fallback para simular dados caso a rota ainda falte)
  const { data: training } = useQuery({
    queryKey: ["training", id],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/trainings/${id}`);
        return data.training;
      } catch (error) {
        // Fallback temporário para evitar quebrar a tela se a API específica do treino ainda não estiver pronta
        return null;
      }
    },
  });

  // MIGRAÇÃO: Supabase Update -> Axios Put
  const changeStatus = useMutation({
    mutationFn: async (status: TrainingStatus) => {
      const patch =
        status === "publicado"
          ? {
              status,
              published_at: new Date().toISOString(),
              version: (training?.version ?? 1) + 1,
            }
          : { status };
          
      try {
        await api.put(`/trainings/${id}`, patch);
      } catch (error: any) {
        throw new Error(error.response?.data?.error || "Erro ao atualizar status.");
      }
    },
    onSuccess: () => {
      toast.success("Status do treino atualizado.");
      void queryClient.invalidateQueries({ queryKey: ["training", id] });
      void queryClient.invalidateQueries({ queryKey: ["trainings"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell
      title={training?.title ?? "Treino"}
      subtitle={training ? `Versão ${training.version || "1.0"} · ${LEVEL_LABEL[training.level as keyof typeof LEVEL_LABEL]}` : ""}
      actions={
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/treinos/$id/editar" params={{ id }}>
              Editar
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/treinos/$id/analise" params={{ id }}>
              Análise
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Descrição</CardTitle>
              {training ? (
                <Badge variant={training.status === "publicado" ? "default" : "secondary"}>
                  {TRAINING_STATUS_LABEL[training.status as keyof typeof TRAINING_STATUS_LABEL] || training.status}
                </Badge>
              ) : null}
            </div>
            <CardDescription>Conteúdo aplicado na arena com alvos de LED</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="whitespace-pre-line text-muted-foreground">
              {training?.description || "Sem descrição."}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Info label="Alvos" value={String(training?.target_count ?? "—")} />
              <Info label="Dificuldade" value={String(training?.difficulty ?? "—")} />
              <Info label="Duração" value={`${training?.duration_minutes ?? "—"} min`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Versionamento</CardTitle>
            <CardDescription>Fluxo rascunho → revisão → publicado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Criado em {formatDateTime(training?.created_at)}</p>
              <p>Atualizado em {formatDateTime(training?.updated_at)}</p>
              <p>Publicado em {formatDateTime(training?.published_at)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={changeStatus.isPending || !training}
                onClick={() => changeStatus.mutate("rascunho")}
              >
                Voltar a rascunho
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={changeStatus.isPending || !training}
                onClick={() => changeStatus.mutate("revisao")}
              >
                Enviar para revisão
              </Button>
              <Button
                size="sm"
                disabled={changeStatus.isPending || !training}
                onClick={() => changeStatus.mutate("publicado")}
              >
                Publicar nova versão
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="stat-number mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}