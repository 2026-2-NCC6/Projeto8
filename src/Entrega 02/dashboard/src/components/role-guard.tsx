import { ReactNode, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type AppRole } from "@/lib/domain";

export function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: AppRole[];
  children: ReactNode;
}) {
  const [role, setRole] = useState<AppRole | null>(null);

  useEffect(() => {
    try {
      const userDataStr = localStorage.getItem("@SmartTennis:user");
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setRole(userData.role as AppRole || "praticante");
        return;
      }
    } catch (e) {
      console.error("Erro ao ler permissões");
    }
    setRole("praticante");
  }, []);

  // Aguarda a leitura do LocalStorage para evitar flashes no ecrã
  if (!role) return null;

  // Se o perfil atual não estiver na lista de permitidos, mostra o ecrã de bloqueio
  if (!allowedRoles.includes(role)) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="mx-auto mt-12 w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-bold uppercase tracking-tight">
            Acesso Restrito
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta área não está disponível para o perfil {role === 'praticante' ? 'Praticante' : role}.
          </p>
          <div className="mt-6">
            <Button asChild variant="default">
              <Link to="/dashboard">Ir para o meu painel</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Se o perfil for válido (ex: treinador), renderiza a página normalmente!
  return <>{children}</>;
}