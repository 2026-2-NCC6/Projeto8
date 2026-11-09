import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Target, Trophy, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { StatCard } from "@/components/stat-card";
import { AccuracyTrendChart } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/services/api";
import { LEVEL_LABEL } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/treinador/")({
  component: () => (
    // 1. CORREÇÃO DA PROPRIEDADE: Agora chama-se 'allowedRoles'
    <RoleGuard allowedRoles={["treinador", "admin"]}>
      <CoachOverview />
    </RoleGuard>
  ),
});

function CoachOverview() {
  // 2. MIGRAÇÃO PARA A API NODE.JS (Axios)
  // Como as rotas de treinador ainda não foram criadas no seu backend, 
  // os try/catch devolvem arrays vazios temporariamente para a página renderizar sem quebrar.
  
  const { data: students = [] } = useQuery({
    queryKey: ["coach-students"],
    queryFn: async () => {
      try {
        const res = await api.get("/treinador/alunos");
        return res.data.students || [];
      } catch (error) {
        return [];
      }
    },
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["coach-sessions"],
    queryFn: async () => {
      try {
        const res = await api.get("/treinador/sessoes");
        return res.data.sessions || [];
      } catch (error) {
        return [];
      }
    },
  });

  const done = sessions.filter((s: any) => s.status === "concluida");
  const avgAccuracy = done.length
    ? done.reduce((acc: number, s: any) => acc + Number(s.accuracy ?? 0), 0) / done.length
    : 0;
  const points = done.reduce((acc: number, s: any) => acc + (s.total_points ?? 0), 0);

  const trend = [...done]
    .reverse()
    .slice(-10)
    .map((s, i) => ({ label: `S${i + 1}`, value: Number(s.accuracy ?? 0) }));

  const byStudent = students.map((student: any) => {
    const rows = done.filter((s: any) => s.user_id === student.id);
    const accuracy = rows.length
      ? rows.reduce((acc: number, s: any) => acc + Number(s.accuracy ?? 0), 0) / rows.length
      : 0;
    return {
      ...student,
      sessions: rows.length,
      accuracy,
      points: rows.reduce((acc: number, s: any) => acc + (s.total_points ?? 0), 0),
    };
  });

  return (
    <AppShell
      title="Indicadores da turma"
      subtitle="Acompanhe o desempenho dos seus alunos na arena"
      actions={
        <Button asChild>
          <Link to="/treinador/enviar-treino">Enviar treino</Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Alunos vinculados" value={students.length} icon={Users} accent />
        <StatCard label="Sessões concluídas" value={done.length} icon={Activity} />
        <StatCard label="Precisão média" value={`${avgAccuracy.toFixed(1)}%`} icon={Target} />
        <StatCard label="Pontos da turma" value={points} icon={Trophy} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AccuracyTrendChart data={trend} description="Precisão das últimas sessões da turma (%)" />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ranking de precisão</CardTitle>
            <CardDescription>Alunos com melhor aproveitamento nos alvos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[...byStudent]
              .sort((a, b) => b.accuracy - a.accuracy)
              .slice(0, 5)
              .map((student, index) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-2 text-sm"
                >
                  <span className="font-medium">
                    {index + 1}. {student.full_name}
                  </span>
                  <span className="text-muted-foreground">{student.accuracy.toFixed(1)}%</span>
                </div>
              ))}
            {byStudent.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Nenhum aluno vinculado ainda.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Desempenho por aluno</CardTitle>
            <CardDescription>Tabela consolidada das sessões</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/treinador/alunos">Ver alunos</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead className="text-right">Sessões</TableHead>
                <TableHead className="text-right">Precisão</TableHead>
                <TableHead className="text-right">Pontos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byStudent.map((student: any) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    <Link to="/treinador/alunos/$id" params={{ id: student.id }}>
                      {student.full_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {student.tennis_level ? LEVEL_LABEL[student.tennis_level as keyof typeof LEVEL_LABEL] : "—"}
                  </TableCell>
                  <TableCell className="text-right">{student.sessions}</TableCell>
                  <TableCell className="text-right">{student.accuracy.toFixed(1)}%</TableCell>
                  <TableCell className="text-right">{student.points}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}