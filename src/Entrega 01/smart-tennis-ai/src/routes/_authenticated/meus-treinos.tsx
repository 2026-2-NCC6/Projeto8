import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-auth";
import { api } from "@/services/api";
import { LEVEL_LABEL, formatDate } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/meus-treinos")({
  component: () => (
    <RoleGuard allowedRoles={["praticante", "treinador", "admin"]}>
      <MyTrainings />
    </RoleGuard>
  ),
});

function MyTrainings() {
  const { data: me } = useCurrentUser();

  // MIGRAÇÃO: Supabase -> Axios para buscar os treinos atribuídos ao aluno
  const { data: assignments = [] } = useQuery({
    queryKey: ["my-assignments", me?.userId],
    enabled: !!me?.userId,
    queryFn: async () => {
      try {
        const { data } = await api.get("/minhas-atribuicoes");
        return data.assignments ?? [];
      } catch (error) {
        return [];
      }
    },
  });

  return (
    <AppShell title="Treinos recebidos" subtitle="Treinamentos enviados pelo seu professor">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {assignments.map((assignment: any) => {
          const training = assignment.trainings;
          return (
            <Card key={assignment.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{training?.title ?? "Treino"}</CardTitle>
                  <Badge variant={assignment.completed ? "secondary" : "default"}>
                    {assignment.completed ? "Concluído" : "Pendente"}
                  </Badge>
                </div>
                <CardDescription>
                  Prazo: {formatDate(assignment.due_date)} ·{" "}
                  {training?.level ? LEVEL_LABEL[training.level as keyof typeof LEVEL_LABEL] : "—"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{training?.description}</p>
                {assignment.note ? (
                  <p className="rounded-lg bg-accent/50 p-3 text-sm">{assignment.note}</p>
                ) : null}
                <div className="flex gap-2">
                  <Button asChild size="sm">
                    <Link to="/sessoes/nova" search={{ training: training?.id }}>
                      Treinar agora
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {assignments.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhum treino recebido até o momento.
        </p>
      ) : null}
    </AppShell>
  );
}