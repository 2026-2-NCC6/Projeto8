import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@/services/api";
import type { AppRole, TennisLevel } from "@/lib/domain";

export type SessionProfile = {
  id: string;
  full_name: string;
  email: string | null;
  tennis_level: TennisLevel | null;
  institution: string | null;
  coach_id: string | null;
};

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      // 1. Lemos os dados básicos que guardámos no momento do Login
      const userStr = localStorage.getItem("@SmartTennis:user");
      if (!userStr) return null;

      const authUser = JSON.parse(userStr);

      try {
        // 2. Vamos buscar os detalhes extra do perfil à nossa API
        const { data } = await api.get("/me");
        
        return {
          userId: authUser.id,
          email: authUser.email ?? null,
          profile: (data.profile as SessionProfile | null) ?? null,
          role: (authUser.role as AppRole) ?? "praticante",
        };
      } catch (error) {
        // Fallback seguro caso a API falhe mas o utilizador esteja logado
        return {
          userId: authUser.id,
          email: authUser.email ?? null,
          profile: { full_name: authUser.name || "Usuário" } as SessionProfile,
          role: (authUser.role as AppRole) ?? "praticante",
        };
      }
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return async () => {
    // Cancela carregamentos pendentes
    await queryClient.cancelQueries();
    queryClient.clear();
    
    // Destrói a sessão local (substitui o supabase.auth.signOut)
    localStorage.removeItem("@SmartTennis:token");
    localStorage.removeItem("@SmartTennis:user");
    
    // Redireciona para o login
    navigate({ to: "/auth", replace: true });
  };
}