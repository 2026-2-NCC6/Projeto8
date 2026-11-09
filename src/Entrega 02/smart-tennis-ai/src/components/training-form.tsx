import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEVEL_LABEL, type TennisLevel } from "@/lib/domain";

export type TrainingFormValue = {
  title: string;
  description: string;
  level: TennisLevel;
  difficulty: number;
  targetCount: number;
  durationMinutes: number;
};

export function TrainingForm({
  value,
  onChange,
  onSubmit,
  submitting,
  submitLabel,
}: {
  value: TrainingFormValue;
  onChange: (value: TrainingFormValue) => void;
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel: string;
}) {
  const set = <K extends keyof TrainingFormValue>(key: K, next: TrainingFormValue[K]) =>
    onChange({ ...value, [key]: next });

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={value.title}
          placeholder="Precisão cruzada com alvos laterais"
          onChange={(event) => set("title", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          rows={5}
          value={value.description}
          placeholder="Objetivo do treino, sequência de alvos e orientações técnicas."
          onChange={(event) => set("description", event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Nível recomendado</Label>
        <Select value={value.level} onValueChange={(next) => set("level", next as TennisLevel)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(LEVEL_LABEL) as TennisLevel[]).map((level) => (
              <SelectItem key={level} value={level}>
                {LEVEL_LABEL[level]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Dificuldade: nível {value.difficulty}</Label>
        <Slider
          min={1}
          max={5}
          step={1}
          value={[value.difficulty]}
          onValueChange={(next) => set("difficulty", next[0] ?? 1)}
        />
      </div>

      <div className="space-y-3">
        <Label>Alvos de LED: {value.targetCount}</Label>
        <Slider
          min={3}
          max={9}
          step={1}
          value={[value.targetCount]}
          onValueChange={(next) => set("targetCount", next[0] ?? 3)}
        />
      </div>

      <div className="space-y-3">
        <Label>Duração: {value.durationMinutes} min</Label>
        <Slider
          min={5}
          max={90}
          step={5}
          value={[value.durationMinutes]}
          onValueChange={(next) => set("durationMinutes", next[0] ?? 5)}
        />
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}
