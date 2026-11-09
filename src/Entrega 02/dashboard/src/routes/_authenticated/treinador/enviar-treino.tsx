import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/use-auth";
import { api } from "@/services/api";
import { fetchStudents, fetchTrainings } from "@/lib/queries";
import { LEVEL_LABEL, TRAINING_STATUS_LABEL, formatDate } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/treinador/enviar-treino")({
  component: () => (
    // CORREÇÃO: allowedRoles
    <RoleGuard allowedRoles={["treinador", "admin"]}>
      <AssignTraining />
    </RoleGuard>
  ),
});

function AssignTraining() {
  const { data: me } = useCurrentUser();
  const queryClient = useQueryClient();
  const [trainingId, setTrainingId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const { data: students = [] } = useQuery({
    queryKey: ["coach-students", me?.userId],
    enabled: !!me?.userId,
    queryFn: () => fetchStudents(me?.userId),
  });

  const { data: trainings = [] } = useQuery({
    queryKey: ["trainings"],
    queryFn: fetchTrainings,
  });

  const published = trainings.filter((t: any) => t.status === "publicado");

  // MIGRAÇÃO: Supabase -> Axios (com fallback para array vazio se a rota ainda não existir no Node)
  const { data: recent = [] } = useQuery({
    queryKey: ["assignments-sent", me?.userId],
    enabled: !!me?.userId,
    queryFn: async () => {
      try {
        const { data } = await api.get("/treinador/atribuicoes/recentes");
        return data.assignments ?? [];
      } catch (error) {
        return [];
      }
    },
  });

  // MIGRAÇÃO: Supabase Insert -> Axios Post
  const send = useMutation({
    mutationFn: async () => {
      if (!trainingId) throw new Error("Selecione um treino publicado.");
      if (selected.length === 0) throw new Error("Selecione ao menos um aluno.");
      
      const rows = selected.map((studentId) => ({
        training_id: trainingId,
        student_id: studentId,
        assigned_by: me?.userId,
        due_date: dueDate || null,
        note: note || null,
      }));

      try {
        await api.post("/treinador/atribuicoes", { assignments: rows });
      } catch (error: any) {
        throw new Error(error.response?.data?.error || "Erro ao enviar o treino.");
      }
    },
    onSuccess: () => {
      toast.success("Treino enviado aos alunos selecionados.");
      setSelected([]);
      setNote("");
      void queryClient.invalidateQueries({ queryKey: ["assignments-sent"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell title="Enviar treino" subtitle="Atribua um treino publicado aos seus alunos">
      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Configuração do envio</CardTitle>
            <CardDescription>Escolha o treino, o prazo e uma orientação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Treino</Label>
              <Select value={trainingId} onValueChange={setTrainingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um treino publicado" />
                </SelectTrigger>
                <SelectContent>
                  {published.map((training: any) => (
                    <SelectItem key={training.id} value={training.id}>
                      {training.title} · {LEVEL_LABEL[training.level as keyof typeof LEVEL_LABEL]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {published.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum treino publicado ainda — publique um treino para enviá-lo.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="due">Prazo</Label>
              <Input
                id="due"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Orientação</Label>
              <Textarea
                id="note"
                rows={4}
                placeholder="Foque nos alvos laterais e mantenha o ritmo de rebatida."
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>

            <Button className="w-full" disabled={send.isPending} onClick={() => send.mutate()}>
              {send.isPending ? "Enviando…" : `Enviar para ${selected.length} aluno(s)`}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Alunos</CardTitle>
              <CardDescription>Selecione quem receberá o treino</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {students.map((student: any) => {
                const checked = selected.includes(student.id);
                return (
                  <label
                    key={student.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        setSelected((current) =>
                          value
                            ? [...current, student.id]
                            : current.filter((item) => item !== student.id),
                        )
                      }
                    />
                    <span className="font-medium">{student.full_name}</span>
                    {student.tennis_level ? (
                      <Badge variant="secondary" className="ml-auto">
                        {LEVEL_LABEL[student.tennis_level as keyof typeof LEVEL_LABEL]}
                      </Badge>
                    ) : null}
                  </label>
                );
              })}
              {students.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nenhum aluno vinculado ao seu perfil.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Envios recentes</CardTitle>
              <CardDescription>Últimas atribuições realizadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recent.map((assignment: any) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-2 text-sm"
                >
                  <span className="font-medium">{assignment.trainings?.title ?? "Treino"}</span>
                  <span className="text-muted-foreground">
                    {formatDate(assignment.created_at)} ·{" "}
                    {assignment.completed ? "Concluído" : "Pendente"}
                  </span>
                </div>
              ))}
              {recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum envio registrado. Status disponíveis:{" "}
                  {Object.values(TRAINING_STATUS_LABEL).join(", ")}.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}