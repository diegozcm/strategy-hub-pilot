import { type Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  List, ListOrdered, Minus, Undo, Redo, ImagePlus,
} from "lucide-react";
import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from("release-images")
      .upload(fileName, file, { contentType: file.type });

    if (error) {
      toast.error("Erro ao enviar imagem");
      console.error(error);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("release-images")
      .getPublicUrl(data.path);

    editor.chain().focus().setImage({ src: urlData.publicUrl }).run();

    // Reset input so the same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const btn = (
    label: string,
    icon: React.ReactNode,
    action: () => void,
    isActive?: boolean
  ) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`h-8 w-8 ${isActive ? "bg-accent text-accent-foreground" : ""}`}
      onClick={action}
      title={label}
    >
      {icon}
    </Button>
  );

  return (
    <div className="flex items-center gap-0.5 flex-wrap border-b border-border px-2 py-1.5 bg-muted/30 rounded-t-md">
      {btn("Título 1", <Heading1 className="h-4 w-4" />, () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive("heading", { level: 1 }))}
      {btn("Título 2", <Heading2 className="h-4 w-4" />, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }))}
      {btn("Título 3", <Heading3 className="h-4 w-4" />, () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 }))}

      <Separator orientation="vertical" className="h-6 mx-1" />

      {btn("Negrito", <Bold className="h-4 w-4" />, () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
      {btn("Itálico", <Italic className="h-4 w-4" />, () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}

      <Separator orientation="vertical" className="h-6 mx-1" />

      {btn("Lista", <List className="h-4 w-4" />, () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
      {btn("Lista Numerada", <ListOrdered className="h-4 w-4" />, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}
      {btn("Separador", <Minus className="h-4 w-4" />, () => editor.chain().focus().setHorizontalRule().run())}

      <Separator orientation="vertical" className="h-6 mx-1" />

      {btn("Imagem", <ImagePlus className="h-4 w-4" />, () => fileInputRef.current?.click())}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      <div className="flex-1" />

      {btn("Desfazer", <Undo className="h-4 w-4" />, () => editor.chain().focus().undo().run())}
      {btn("Refazer", <Redo className="h-4 w-4" />, () => editor.chain().focus().redo().run())}
    </div>
  );
}
