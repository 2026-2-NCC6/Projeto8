export type AppRole = "praticante" | "treinador" | "admin";
export type TennisLevel = "iniciante" | "intermediario" | "avancado" | "competitivo";
export type TrainingStatus = "rascunho" | "revisao" | "publicado";
export type SessionStatus = "configurada" | "em_andamento" | "concluida" | "cancelada";

export const ROLE_LABEL: Record<AppRole, string> = {
  praticante: "Praticante",
  treinador: "Professor / Instituição",
  admin: "Administrador",
};

export const LEVEL_LABEL: Record<TennisLevel, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
  competitivo: "Competitivo",
};

export const TRAINING_STATUS_LABEL: Record<TrainingStatus, string> = {
  rascunho: "Rascunho",
  revisao: "Em revisão",
  publicado: "Publicado",
};

export const SESSION_STATUS_LABEL: Record<SessionStatus, string> = {
  configurada: "Configurada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const HOME_BY_ROLE: Record<AppRole, string> = {
  praticante: "/dashboard",
  treinador: "/treinador",
  admin: "/admin",
};

/** Pontuação de uma rebatida no alvo de LED. */
export function computeHitPoints(options: {
  hit: boolean;
  accuracy: number;
  reactionMs: number;
  streak: number;
}) {
  if (!options.hit) return { points: 0, bonus: 0 };
  const base = Math.round(10 * (options.accuracy / 100));
  const streakBonus = Math.min(options.streak, 5) * 5;
  const speedBonus = options.reactionMs < 600 ? 8 : options.reactionMs < 900 ? 4 : 0;
  return { points: base + streakBonus + speedBonus, bonus: streakBonus + speedBonus };
}

export function levelFromXp(xp: number) {
  const perLevel = 500;
  const level = Math.floor(xp / perLevel) + 1;
  const progress = ((xp % perLevel) / perLevel) * 100;
  return { level, progress, nextAt: level * perLevel };
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
