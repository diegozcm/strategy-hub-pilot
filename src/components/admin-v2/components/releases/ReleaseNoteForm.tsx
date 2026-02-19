import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "./RichTextEditor";
import { Loader2, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  version: z.string().min(1, "Versão é obrigatória"),
  title: z.string().min(1, "Título é obrigatório"),
  date: z.string().min(1, "Data é obrigatória"),
  summary: z.string().optional(),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  published: z.boolean(),
  tags: z.array(z.string()),
});

export type ReleaseFormValues = z.infer<typeof schema>;

interface ReleaseNoteFormProps {
  defaultValues?: Partial<ReleaseFormValues>;
  onSubmit: (values: ReleaseFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

function useExistingTags() {
  const [tags, setTags] = useState<string[]>([]);
  useEffect(() => {
    supabase
      .from("release_notes")
      .select("tags")
      .then(({ data }) => {
        const all = (data ?? []).flatMap((r) => r.tags ?? []);
        setTags([...new Set(all)].sort());
      });
  }, []);
  return tags;
}

export function ReleaseNoteForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = "Salvar",
}: ReleaseNoteFormProps) {
  const form = useForm<ReleaseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      version: "",
      title: "",
      date: new Date().toISOString().slice(0, 10),
      summary: "",
      content: "",
      published: false,
      tags: [],
      ...defaultValues,
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const tagsValue = watch("tags") ?? [];
  const contentValue = watch("content");

  const existingTags = useExistingTags();
  const [tagInput, setTagInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tagsValue.includes(trimmed)) {
      setValue("tags", [...tagsValue, trimmed], { shouldValidate: true });
    }
    setTagInput("");
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    setValue("tags", tagsValue.filter((t) => t !== tag), { shouldValidate: true });
  };

  const suggestions = existingTags.filter(
    (t) => !tagsValue.includes(t) && t.toLowerCase().includes(tagInput.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="version">Versão</Label>
          <Input id="version" placeholder="1.2.0" {...register("version")} />
          {errors.version && <p className="text-xs text-destructive">{errors.version.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" placeholder="Título da release" {...register("title")} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Data</Label>
          <Input id="date" type="date" {...register("date")} />
          {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Resumo (opcional)</Label>
        <Textarea id="summary" rows={2} placeholder="Breve descrição da release..." {...register("summary")} />
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-input bg-background p-2 min-h-[42px]">
          {tagsValue.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <div className="relative flex-1 min-w-[120px]">
            <Input
              ref={inputRef}
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && tagInput.trim()) {
                  e.preventDefault();
                  addTag(tagInput);
                } else if (e.key === "Backspace" && !tagInput && tagsValue.length) {
                  removeTag(tagsValue[tagsValue.length - 1]);
                }
              }}
              placeholder="Digite e pressione Enter..."
              className="border-0 shadow-none focus-visible:ring-0 h-7 px-1 text-sm"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 z-50 mt-1 w-56 rounded-md border bg-popover p-1 shadow-md">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addTag(s)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                  >
                    <Plus className="h-3 w-3 text-muted-foreground" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Conteúdo</Label>
        <RichTextEditor
          content={contentValue}
          onChange={(html) => setValue("content", html, { shouldValidate: true })}
        />
        {errors.content && <p className="text-xs text-destructive">{errors.content.message}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="published"
          checked={watch("published")}
          onCheckedChange={(v) => setValue("published", v)}
        />
        <Label htmlFor="published">Publicado</Label>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  );
}
