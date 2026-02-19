import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownPreview } from "./MarkdownPreview";
import { Loader2 } from "lucide-react";

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

const TAG_OPTIONS = ["Nova Funcionalidade", "Melhoria", "Correção"];

interface ReleaseNoteFormProps {
  defaultValues?: Partial<ReleaseFormValues>;
  onSubmit: (values: ReleaseFormValues) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function ReleaseNoteForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = "Salvar",
}: ReleaseNoteFormProps) {
  const [tab, setTab] = useState("write");

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
  const contentValue = watch("content");
  const tagsValue = watch("tags");

  const toggleTag = (tag: string) => {
    const current = tagsValue ?? [];
    setValue(
      "tags",
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
      { shouldValidate: true }
    );
  };

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
        <div className="flex gap-4">
          {TAG_OPTIONS.map((tag) => (
            <label key={tag} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={tagsValue?.includes(tag) ?? false}
                onCheckedChange={() => toggleTag(tag)}
              />
              {tag}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Conteúdo (Markdown)</Label>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="write">Escrever</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="write">
            <Textarea
              rows={16}
              placeholder="Escreva o conteúdo em Markdown..."
              className="font-mono text-sm"
              {...register("content")}
            />
          </TabsContent>
          <TabsContent value="preview">
            <Card>
              <CardContent className="pt-4 min-h-[300px]">
                <MarkdownPreview content={contentValue} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
