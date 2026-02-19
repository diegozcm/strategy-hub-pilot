import ReactMarkdown from "react-markdown";

interface MarkdownPreviewProps {
  content: string;
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  if (!content) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Nenhum conteúdo para pré-visualizar.
      </p>
    );
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        components={{
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt ?? ""}
              className="rounded-lg max-w-full h-auto border"
              loading="lazy"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
