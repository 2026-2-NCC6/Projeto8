import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";
import { formatDateTime } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/admin/parametros")({
  component: () => (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminSettings />
    </RoleGuard>
  ),
});

function AdminSettings() {
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      try {
        const { data } = await api.get("/admin/settings");
        return data.settings ?? [];
      } catch (error) {
        return [];
      }
    },
  });

  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setValues(Object.fromEntries(settings.map((s: any) => [s.key, s.value])));
  }, [settings]);

  const save = useMutation({
    mutationFn: async (key: string) => {
      try {
        await api.put(`/admin/settings/${key}`, {
          value: values[key] ?? "",
        });
      } catch (error: any) {
        throw new Error(error.response?.data?.error || "Erro ao salvar parâmetro.");
      }
    },
    onSuccess: () => {
      toast.success("Parâmetro atualizado.");
      void queryClient.invalidateQueries({ queryKey: ["system-settings"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell
      title="Parâmetros do sistema"
      subtitle="Ajustes gerais da arena, gamificação e integração com a maquete"
    >
      <Card className="max-w-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configurações</CardTitle>
          <CardDescription>Alterações valem para toda a plataforma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : settings.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum parâmetro cadastrado.</p>
          ) : (
            settings.map((setting: any) => (
              <div key={setting.key} className="space-y-2 border-b border-border pb-5 last:border-0">
                <Label htmlFor={setting.key}>{setting.key}</Label>
                {setting.description ? (
                  <p className="text-xs text-muted-foreground">{setting.description}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Input
                    id={setting.key}
                    className="max-w-xs"
                    value={values[setting.key] ?? ""}
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, [setting.key]: event.target.value }))
                    }
                  />
                  <Button
                    variant="outline"
                    disabled={save.isPending || values[setting.key] === setting.value}
                    onClick={() => save.mutate(setting.key)}
                  >
                    Salvar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Atualizado em {formatDateTime(setting.updated_at)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}