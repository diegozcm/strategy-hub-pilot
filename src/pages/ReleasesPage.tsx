import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Tag, ChevronDown, ChevronUp, Sparkles, Wrench, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { useReleaseNotes, type ReleaseNote } from '@/hooks/useReleaseNotes';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const tagConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  'Nova Funcionalidade': { color: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30', icon: <Sparkles className="h-3 w-3" /> },
  'Melhoria': { color: 'bg-sky-500/15 text-sky-700 border-sky-500/30', icon: <Wrench className="h-3 w-3" /> },
  'Correção': { color: 'bg-amber-500/15 text-amber-700 border-amber-500/30', icon: <Bug className="h-3 w-3" /> },
};

const ReleaseCard: React.FC<{ release: ReleaseNote }> = ({ release }) => {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = (() => {
    try {
      return format(parseISO(release.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return release.date;
    }
  })();

  return (
    <div className="relative flex gap-6">
      {/* Timeline dot & line */}
      <div className="flex flex-col items-center">
        <div className="w-4 h-4 rounded-full bg-cofound-cyan border-4 border-cofound-cyan/30 shrink-0 mt-6 z-10" />
        <div className="w-0.5 bg-cofound-cyan/20 flex-1 min-h-[20px]" />
      </div>

      {/* Card */}
      <Card className="flex-1 mb-6 border-border/50 hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        <CardHeader
          className="cursor-pointer select-none pb-3"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="bg-cofound-navy text-white border-cofound-navy font-mono text-xs px-2">
                  v{release.version}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formattedDate}
                </span>
              </div>
              <h3 className="text-lg font-display font-semibold text-cofound-navy leading-tight">
                {release.title}
              </h3>
              {release.summary && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {release.summary}
                </p>
              )}
              <div className="flex gap-2 flex-wrap pt-1">
                {release.tags?.map((tag) => {
                  const cfg = tagConfig[tag] || { color: 'bg-gray-100 text-gray-700 border-gray-300', icon: <Tag className="h-3 w-3" /> };
                  return (
                    <Badge key={tag} variant="outline" className={`text-xs flex items-center gap-1 ${cfg.color}`}>
                      {cfg.icon}
                      {tag}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0 mt-1">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="pt-0 border-t border-border/50">
            <div className="prose prose-sm max-w-none pt-4
              prose-headings:text-cofound-navy prose-headings:font-display
              prose-h2:text-base prose-h2:mt-6 prose-h2:mb-3
              prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-2
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-li:text-muted-foreground
              prose-strong:text-cofound-navy
              prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-code:text-xs
            ">
              <ReactMarkdown>{release.content}</ReactMarkdown>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

const ReleasesPage: React.FC = () => {
  const { data: releases, isLoading, error } = useReleaseNotes();

  return (
    <div className="min-h-screen bg-cofound-light-gray">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-cofound-cyan/95 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="flex flex-col">
              <span className="text-xl font-display font-bold text-white tracking-tight">
                Strategy HUB
              </span>
              <span className="text-xs text-white/90">by COFOUND</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-white hover:text-cofound-navy transition-colors text-sm font-medium">
              Página Inicial
            </Link>
            <Link to="/auth">
              <Button variant="outline" className="border-2 border-white text-cofound-navy hover:bg-white hover:text-cofound-cyan shadow-md transition-all duration-300">
                Login
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Page header */}
          <div className="mb-10">
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-cofound-cyan hover:text-cofound-navy mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-cofound-navy mb-2">
              Novidades da Plataforma
            </h1>
            <p className="text-muted-foreground">
              Acompanhe todas as atualizações, melhorias e novas funcionalidades do Strategy HUB.
            </p>
          </div>

          {/* Timeline */}
          {isLoading && (
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-muted animate-pulse shrink-0 mt-6" />
                    <div className="w-0.5 bg-muted flex-1" />
                  </div>
                  <Card className="flex-1 mb-6">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded animate-pulse w-1/3 mb-2" />
                      <div className="h-6 bg-muted rounded animate-pulse w-2/3" />
                    </CardHeader>
                  </Card>
                </div>
              ))}
            </div>
          )}

          {error && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Não foi possível carregar as novidades. Tente novamente mais tarde.</p>
            </Card>
          )}

          {releases && releases.length === 0 && (
            <Card className="p-8 text-center">
              <Sparkles className="h-10 w-10 text-cofound-cyan mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma novidade publicada ainda. Fique de olho!</p>
            </Card>
          )}

          {releases?.map((release) => (
            <ReleaseCard key={release.id} release={release} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-cofound-navy py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-white/60 text-sm">
            © {new Date().getFullYear()} Strategy HUB by COFOUND. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ReleasesPage;
