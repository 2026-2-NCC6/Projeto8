import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Cpu, Gauge, Target, Trophy, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Tennis Arena · Treinos de tênis gamificados com IoT" },
      {
        name: "description",
        content:
          "Plataforma de treinos de tênis gamificados: alvos de LED, robótica e sensores IoT medem a precisão de cada rebatida e transformam o treino em pontos e progressão.",
      },
      { property: "og:title", content: "Smart Tennis Arena" },
      {
        property: "og:description",
        content:
          "Precisão, pontos e progressão: treinos de tênis gamificados com robótica e sensores IoT.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Target,
    title: "Alvos de LED na maquete",
    text: "Cada alvo aceso registra a precisão da rebatida em tempo real através dos sensores.",
  },
  {
    icon: Trophy,
    title: "Gamificação por precisão",
    text: "Pontos por acerto, bônus de sequência e de tempo de reação, com níveis e medalhas.",
  },
  {
    icon: Users,
    title: "Professores e instituições",
    text: "Acompanhe indicadores da turma e envie treinos direto para cada aluno.",
  },
  {
    icon: Cpu,
    title: "Robótica e IoT",
    text: "A maquete robótica dispara os alvos e alimenta o painel com dados de cada sessão.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="flex items-center gap-2 font-display text-xl font-semibold uppercase">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" />
            </span>
            Smart Tennis Arena
          </span>
          <Button asChild size="sm">
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
        <div>
          <Badge className="mb-4">Treino conectado</Badge>
          <h1 className="font-display text-5xl font-semibold uppercase leading-[0.95] tracking-tight md:text-6xl">
            Cada rebatida vira <span className="text-primary">precisão medida</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground">
            A Smart Tennis Arena conecta uma maquete robótica com alvos de LED e sensores IoT a um
            painel gamificado. O praticante acumula pontos e bônus por precisão, o professor
            acompanha indicadores e envia treinos, e a administração gerencia toda a operação.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Criar minha conta</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Já tenho acesso</Link>
            </Button>
          </div>
        </div>

        <Card className="border-primary/20">
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sessão em andamento
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <div
                  key={index}
                  className={`flex aspect-square items-center justify-center rounded-xl border text-sm font-semibold ${
                    index === 4
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="stat-number text-2xl font-semibold text-primary">87%</p>
                <p className="text-xs text-muted-foreground">Precisão</p>
              </div>
              <div>
                <p className="stat-number text-2xl font-semibold">1.240</p>
                <p className="text-xs text-muted-foreground">Pontos</p>
              </div>
              <div>
                <p className="stat-number text-2xl font-semibold">x7</p>
                <p className="text-xs text-muted-foreground">Sequência</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-16 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-lg font-semibold">{feature.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{feature.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-3xl font-semibold uppercase">Três perfis, um sistema</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Activity,
              title: "Praticante",
              text: "Acompanha desempenho por sessão, histórico de treinos e os treinamentos recebidos do professor.",
            },
            {
              icon: Gauge,
              title: "Professor / Instituição",
              text: "Indicadores da turma, desempenho individual dos alunos e envio de treinos personalizados.",
            },
            {
              icon: Users,
              title: "Administrador",
              text: "Gestão de usuários, permissões e parâmetros gerais de pontuação do sistema.",
            },
          ].map((item) => (
            <Card key={item.title} className="border-l-4 border-l-primary">
              <CardContent className="p-6">
                <item.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        Smart Tennis Arena · treinos gamificados com robótica e sensores IoT
      </footer>
    </div>
  );
}
