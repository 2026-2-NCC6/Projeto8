import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchTrainings } from "@/lib/queries";
import {
  LEVEL_LABEL,
  TRAINING_STATUS_LABEL,
  formatDate,
  type TrainingStatus,
} from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/treinos/")({
  component: () => (
    // CORREÇÃO: allowedRoles
    <RoleGuard allowedRoles={["treinador", "admin"]}>
      <TrainingsList />
    </RoleGuard>
  ),
});

function TrainingsList() {
  const [status, setStatus] = useState<TrainingStatus | "todos">("todos");

  const { data: trainings = [] } = useQuery({
    queryKey: ["trainings"],
    queryFn: fetchTrainings,
  });

  // CORREÇÃO: Adicionamos ': any'
  const filtered =
    status === "todos" ? trainings : trainings.filter((item: any) => item.status === status);

  return (
    <AppShell
      title="Gestão de treinos"
      subtitle="Crie, versione, revise e publique treinos para a arena"
      actions={
        <Button asChild>
          <Link to="/treinos/novo">Novo treino</Link>
        </Button>
      }
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Biblioteca de treinos</CardTitle>
          <CardDescription>{trainings.length} treinos cadastrados</CardDescription>
          <Tabs
            value={status}
            onValueChange={(value) => setStatus(value as TrainingStatus | "todos")}
            className="mt-3"
          >
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="rascunho">Rascunho</TabsTrigger>
              <TabsTrigger value="revisao">Em revisão</TabsTrigger>
              <TabsTrigger value="publicado">Publicado</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Treino</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Versão</TableHead>
                <TableHead className="text-right">Atualizado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* CORREÇÃO: Adicionamos ': any' */}
              {filtered.map((training: any) => (
                <TableRow key={training.id}>
                  <TableCell className="font-medium">{training.title}</TableCell>
                  <TableCell>{LEVEL_LABEL[training.level as keyof typeof LEVEL_LABEL]}</TableCell>
                  <TableCell>
                    <Badge variant={training.status === "publicado" ? "default" : "secondary"}>
                      {TRAINING_STATUS_LABEL[training.status as keyof typeof TRAINING_STATUS_LABEL]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">v{training.version || "1.0"}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDate(training.updated_at || training.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/treinos/$id" params={{ id: training.id }}>
                          Detalhe
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <Link to="/treinos/$id/analise" params={{ id: training.id }}>
                          Análise
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhum treino neste status.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </AppShell>
  );
}