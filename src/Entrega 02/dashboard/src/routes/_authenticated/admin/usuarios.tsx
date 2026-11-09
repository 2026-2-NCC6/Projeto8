import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/services/api";
import { LEVEL_LABEL, ROLE_LABEL, formatDate, type AppRole } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  component: () => (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminUsers />
    </RoleGuard>
  ),
});

function AdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/admin/usuarios");
        return data.profiles ?? [];
      } catch (error) {
        return [];
      }
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/admin/usuarios/roles");
        return data.roles ?? [];
      } catch (error) {
        return [];
      }
    },
  });

  const roleByUser = new Map<string, AppRole>();
  for (const row of roles) {
    roleByUser.set((row as any).user_id, (row as any).role as AppRole);
  }

  const changeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      try {
        await api.put(`/admin/usuarios/${userId}/role`, { role });
      } catch (error: any) {
        throw new Error(error.response?.data?.error || "Erro ao atualizar permissão.");
      }
    },
    onSuccess: () => {
      toast.success("Permissão atualizada.");
      void queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filtered = profiles.filter((p: any) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      p.full_name?.toLowerCase().includes(term) || (p.email ?? "").toLowerCase().includes(term)
    );
  });

  return (
    <AppShell
      title="Usuários e permissões"
      subtitle="Controle os perfis de acesso de praticantes, treinadores e administradores"
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Base de usuários</CardTitle>
          <CardDescription>
            {profiles.length} cadastro(s) na plataforma
          </CardDescription>
          <div className="pt-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome ou e-mail"
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Instituição</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="w-56">Perfil de acesso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((profile: any) => {
                  const role = roleByUser.get(profile.id) ?? "praticante";
                  return (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <p className="font-medium">{profile.full_name || "Sem nome"}</p>
                        <p className="text-xs text-muted-foreground">{profile.email ?? "—"}</p>
                      </TableCell>
                      <TableCell>
                        {profile.tennis_level ? (
                          <Badge variant="secondary">{LEVEL_LABEL[profile.tennis_level as keyof typeof LEVEL_LABEL]}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {profile.institution || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(profile.created_at)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={role}
                          onValueChange={(next) =>
                            changeRole.mutate({ userId: profile.id, role: next as AppRole })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(ROLE_LABEL) as AppRole[]).map((item) => (
                              <SelectItem key={item} value={item}>
                                {ROLE_LABEL[item]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}