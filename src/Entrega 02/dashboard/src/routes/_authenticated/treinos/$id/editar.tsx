import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { TrainingForm, type TrainingFormValue } from "@/components/training-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";

export const Route = createFileRoute("/_authenticated/treinos/$id/editar")({
  component: () => (
    <RoleGuard allowedRoles={["treinador", "admin"]}>
      <EditTraining />
    </RoleGuard>
  ),
});

function EditTraining() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: training, isLoading } = useQuery({
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

  const [value, setValue] = useState<TrainingFormValue>({
    title: "",
    description: "",
    level: "iniciante",
    difficulty: 2,
    targetCount: 6,
    durationMinutes: 20,
  });

  useEffect(() => {
    if (!training) return;
    setValue({
      title: training.title,
      description: training.description,
      level: training.level,
      difficulty: training.difficulty,
      targetCount: training.target_count,
      durationMinutes: training.duration_minutes,
    });
  }, [training]);

  const save = useMutation({
    mutationFn: async () => {
      if (!value.title.trim()) throw new Error("Informe o título do treino.");
      
      try {
        await api.put(`/trainings/${id}`, {
          title: value.title,
          description: value.description,
          level: value.level,
          difficulty: value.difficulty,
          target_count: value.targetCount,
          duration_minutes: value.durationMinutes,
        });
      } catch (error: any) {
        throw new Error(error.response?.data?.error || "Erro ao atualizar o treino.");
      }
    },
    onSuccess: () => {
      toast.success("Treino atualizado.");
      void queryClient.invalidateQueries({ queryKey: ["training", id] });
      void queryClient.invalidateQueries({ queryKey: ["trainings"] });
      navigate({ to: "/treinos/$id", params: { id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell
      title="Editar treino"
      subtitle="Ajuste o conteúdo e publique uma nova versão em seguida"
    >
      <Card className="max-w-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dados do treino</CardTitle>
          <CardDescription>
            {training ? `Versão atual ${training.version || "1.0"}` : "Carregando treino…"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : (
            <TrainingForm
              value={value}
              onChange={setValue}
              onSubmit={() => save.mutate()}
              submitting={save.isPending}
              submitLabel="Salvar alterações"
            />
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}