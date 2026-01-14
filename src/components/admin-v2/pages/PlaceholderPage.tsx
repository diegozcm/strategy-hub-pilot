interface PlaceholderPageProps {
  title: string;
  section: string;
}

export function PlaceholderPage({ title, section }: PlaceholderPageProps) {
  return (
    <div className="flex-1 p-6">
      <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-2 text-sm font-medium text-muted-foreground">
          {section}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-4 text-muted-foreground">
          Esta página está em desenvolvimento.
        </p>
      </div>
    </div>
  );
}
