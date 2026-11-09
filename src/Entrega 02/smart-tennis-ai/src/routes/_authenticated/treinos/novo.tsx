import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { TrainingForm, type TrainingFormValue } from "@/components/training-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";

export const Route = createFileRoute("/_authenticated/treinos/novo")({
  component: () => (
    // CORREÇÃO: Usar a propriedade 'allowedRoles'
    <RoleGuard allowedRoles={["treinador", "admin"]}>
      <NewTraining />
    </RoleGuard>
  ),
});

function NewTraining() {
  const navigate = useNavigate();
  const [value, setValue] = useState<TrainingFormValue>({
    title: "",
    description: "",
    level: "iniciante",
    difficulty: 2,
    targetCount: 6,
    durationMinutes: 20,
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!value.title.trim()) throw new Error("Informe o título do treino.");
      
      try {
        const { data } = await api.post("/trainings", {
          title: value.title,
          description: value.description,
          level: value.level,
          difficulty: value.difficulty,
          target_count: value.targetCount,
          duration_minutes: value.durationMinutes,
          status: "rascunho"
        });
        return data;
      } catch (error: any) {
        throw new Error(error.response?.data?.error || "Erro ao criar o treino.");
      }
    },
    onSuccess: (data) => {
      toast.success("Treino criado como rascunho.");
      // Se o backend devolver o ID, vamos para o detalhe. Caso contrário, voltamos à lista.
      if (data?.id) {
        navigate({ to: "/treinos/$id", params: { id: data.id } });
      } else {
        navigate({ to: "/treinos" });
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell title="Novo treino" subtitle="Crie um treino em rascunho e publique quando estiver pronto">
      <Card className="max-w-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dados do treino</CardTitle>
          <CardDescription>O treino nasce na versão 1 com status rascunho</CardDescription>
        </CardHeader>
        <CardContent>
          <TrainingForm
            value={value}
            onChange={setValue}
            onSubmit={() => create.mutate()}
            submitting={create.isPending}
            submitLabel="Criar treino"
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}