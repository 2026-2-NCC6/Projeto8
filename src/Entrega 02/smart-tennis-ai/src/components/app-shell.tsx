import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  ClipboardList,
  Cog,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Send,
  Sliders,
  Target,
  Users,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABEL, type AppRole } from "@/lib/domain";
import { cn } from "@/lib/utils";

const NAV: Record<AppRole, { group: string; items: { to: string; label: string; icon: any }[] }[]> = {
  praticante: [
    {
      group: "Desempenho",
      items: [
        { to: "/dashboard", label: "Meu painel", icon: LayoutDashboard },
        { to: "/minhas-sessoes", label: "Histórico de sessões", icon: Activity },
        { to: "/meus-treinos", label: "Treinos recebidos", icon: ClipboardList },
      ],
    },
    {
      group: "Arena",
      items: [{ to: "/sessoes", label: "Iniciar sessão", icon: Target }],
    },
  ],
  treinador: [
    {
      group: "Turma",
      items: [
        { to: "/treinador", label: "Indicadores", icon: BarChart3 },
        { to: "/treinador/alunos", label: "Alunos", icon: Users },
        { to: "/treinador/enviar-treino", label: "Enviar treino", icon: Send },
      ],
    },
    {
      group: "Treinos",
      items: [
        { to: "/treinos", label: "Gestão de treinos", icon: ClipboardList },
        { to: "/sessoes", label: "Sessões", icon: Target },
      ],
    },
  ],
  admin: [
    {
      group: "Administração",
      items: [
        { to: "/admin", label: "Visão geral", icon: LayoutDashboard },
        { to: "/admin/usuarios", label: "Usuários e permissões", icon: Users },
        { to: "/admin/parametros", label: "Parâmetros do sistema", icon: Sliders },
      ],
    },
    {
      group: "Operação",
      items: [
        { to: "/treinos", label: "Treinos", icon: ClipboardList },
        { to: "/sessoes", label: "Sessões", icon: Target },
      ],
    },
  ],
};

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [user, setUser] = useState<{ name: string; role: AppRole }>({ 
    name: "Carregando...", 
    role: "praticante" 
  });

  useEffect(() => {
    const userDataStr = localStorage.getItem("@SmartTennis:user");
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        setUser({
          name: userData.name || userData.full_name || userData.email?.split('@')[0] || "Usuário",
          role: (userData.role as AppRole) || "praticante"
        });
      } catch (e) {
        console.error("Erro ao ler dados do utilizador");
      }
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("@SmartTennis:token");
    localStorage.removeItem("@SmartTennis:user");
    navigate({ to: "/auth" });
  };

  const groups = NAV[user.role] || NAV.praticante;

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex items-center gap-2 px-5 py-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-lg font-semibold uppercase">Smart Tennis</p>
            <p className="text-xs text-muted-foreground">Arena</p>
          </div>
        </div>

        <nav className="flex-1 space-y-6 px-3">
          {groups.map((group) => (
            <div key={group.group}>
              <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.group}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2 pb-3">
            <GraduationCap className="h-4 w-4 text-primary" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium capitalize">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{ROLE_LABEL[user.role]}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-background px-6 py-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-semibold uppercase tracking-tight">{title}</h1>
              <Badge variant="secondary" className="lg:hidden">
                {ROLE_LABEL[user.role]}
              </Badge>
            </div>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={handleSignOut} aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="flex gap-2 overflow-x-auto border-b border-border bg-background px-4 py-2 lg:hidden">
          {groups.flatMap((g) => g.items).map((item) => (
            <Link key={item.to} to={item.to} className="whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs font-medium">
              {item.label}
            </Link>
          ))}
        </div>

        <main className="flex-1 px-6 py-6">{children}</main>

        <footer className="border-t border-border bg-background px-6 py-4 text-xs text-muted-foreground">
          Smart Tennis Arena · treinos gamificados com robótica e sensores IoT
          <Cog className="ml-2 inline h-3 w-3" />
        </footer>
      </div>
    </div>
  );
}