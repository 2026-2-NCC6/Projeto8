import { api } from "@/services/api";

export async function fetchMySessions(userId?: string) {
  try {
    // O backend já sabe quem é o utilizador através do Token JWT
    const { data } = await api.get("/minhas-sessoes");
    return data.sessions ?? [];
  } catch (error) {
    console.error("Erro ao carregar sessões", error);
    return [];
  }
}

export async function fetchStudents(coachId?: string) {
  try {
    const { data } = await api.get("/treinador/alunos");
    return data.students ?? [];
  } catch (error) {
    console.error("Erro ao carregar alunos", error);
    return [];
  }
}

export async function fetchTrainings() {
  try {
    const { data } = await api.get("/trainings");
    return data.trainings ?? [];
  } catch (error) {
    console.error("Erro ao carregar treinos", error);
    return [];
  }
}

export function summarize(sessions: { accuracy: number; total_points: number; best_streak: number }[]) {
  const done = sessions.length;
  const points = sessions.reduce((acc, s) => acc + (s.total_points ?? 0), 0);
  const accuracy = done ? sessions.reduce((acc, s) => acc + Number(s.accuracy ?? 0), 0) / done : 0;
  const streak = sessions.reduce((acc, s) => Math.max(acc, s.best_streak ?? 0), 0);
  return { done, points, accuracy, streak };
}