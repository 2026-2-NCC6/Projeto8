import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrentUser } from "@/hooks/use-auth";
import { fetchStudents } from "@/lib/queries";
import { LEVEL_LABEL } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/treinador/alunos/")({
  component: () => (
    // CORREÇÃO: Usar a propriedade 'allowedRoles'
    <RoleGuard allowedRoles={["treinador", "admin"]}>
      <CoachStudents />
    </RoleGuard>
  ),
});

function CoachStudents() {
  const { data: me } = useCurrentUser();
  const [term, setTerm] = useState("");

  const { data: students = [] } = useQuery({
    queryKey: ["coach-students", me?.userId],
    enabled: !!me?.userId,
    queryFn: () => fetchStudents(me?.userId),
  });

  // CORREÇÃO: Adicionamos ': any' e proteção '?.toLowerCase()'
  const filtered = students.filter((s: any) =>
    s.full_name?.toLowerCase().includes(term.trim().toLowerCase()),
  );

  return (
    <AppShell
      title="Alunos"
      subtitle="Praticantes vinculados ao seu perfil de professor"
      actions={
        <Button asChild>
          <Link to="/treinador/enviar-treino">Enviar treino</Link>
        </Button>
      }
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Lista de alunos</CardTitle>
          <CardDescription>{students.length} praticantes vinculados</CardDescription>
          <Input
            className="mt-3 max-w-sm"
            placeholder="Buscar por nome…"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Instituição</TableHead>
                <TableHead className="text-right">Detalhe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* CORREÇÃO: Adicionamos ': any' */}
              {filtered.map((student: any) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{student.email ?? "—"}</TableCell>
                  <TableCell>
                    {student.tennis_level ? (
                      <Badge variant="secondary">{LEVEL_LABEL[student.tennis_level as keyof typeof LEVEL_LABEL]}</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.institution ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/treinador/alunos/$id" params={{ id: student.id }}>
                        Ver desempenho
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhum aluno encontrado.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </AppShell>
  );
}