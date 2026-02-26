import React from 'react';
import { Check, XCircle, Copy, RefreshCw, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '@/hooks/useAtlasChat';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AtlasMessageBubbleProps {
  msg: ChatMessage;
  index: number;
  copiedIndex: number | null;
  onExecutePlan: (plan: any, index: number) => void;
  onRejectPlan: (index: number) => void;
  onCopy: (content: string, index: number) => void;
  onRetry: (index: number) => void;
  onFeedback: (type: 'positive' | 'negative', content: string) => void;
}

export const AtlasMessageBubble: React.FC<AtlasMessageBubbleProps> = ({
  msg, index, copiedIndex, onExecutePlan, onRejectPlan, onCopy, onRetry, onFeedback
}) => {
  return (
    <div className={cn("flex group/msg", msg.role === 'user' ? "justify-end" : "justify-start")}>
      <div className={cn(
        "rounded-xl px-4 py-3 max-w-[80%]",
        msg.role === 'user'
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-foreground'
      )}>
        {/* Images */}
        {msg.images && msg.images.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {msg.images.map((img, imgIdx) => (
              <img key={imgIdx} src={img} alt={`Imagem ${imgIdx + 1}`} className="max-h-24 rounded border border-border" />
            ))}
          </div>
        )}

        {msg.role === 'user' ? (
          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <>
            {msg.autoPlan && (
              <div className="flex items-center gap-1 mb-2 text-[10px] font-medium rounded-md px-2 py-0.5 w-fit bg-primary/10 text-primary">
                <Sparkles className="h-3 w-3" />
                Plan automático
              </div>
            )}
            <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>,
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                  code: ({ children }) => <code className="px-1 py-0.5 rounded text-xs bg-background/50">{children}</code>,
                  pre: ({ children }) => <pre className="p-2 rounded my-2 overflow-x-auto text-xs bg-background/50">{children}</pre>,
                }}
              >{msg.content}</ReactMarkdown>
            </div>
          </>
        )}

        {/* Plan controls */}
        {msg.plan && msg.planStatus === 'pending' && (
          <div className="flex gap-2 mt-3 pt-2 border-t border-border">
            <button
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-sm font-medium bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
              onClick={() => onExecutePlan(msg.plan, index)}
            >
              <Check className="h-3.5 w-3.5" /> Aprovar
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
              onClick={() => onRejectPlan(index)}
            >
              <XCircle className="h-3.5 w-3.5" /> Reprovar
            </button>
          </div>
        )}
        {msg.plan && msg.planStatus === 'executing' && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border text-xs text-muted-foreground">
            <LoadingSpinner size="sm" /> Executando plano...
          </div>
        )}
        {msg.plan && msg.planStatus === 'done' && (
          <div className="mt-3 pt-2 border-t border-border text-xs font-medium text-green-600">✅ Plano executado</div>
        )}
        {msg.plan && msg.planStatus === 'rejected' && (
          <div className="mt-3 pt-2 border-t border-border text-xs text-muted-foreground">❌ Plano recusado</div>
        )}
        {msg.plan && msg.planStatus === 'error' && (
          <div className="mt-3 pt-2 border-t border-border text-xs text-destructive">⚠️ Erro ao executar</div>
        )}

        {/* Action buttons */}
        {msg.role === 'assistant' && msg.planStatus !== 'executing' && (
          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border opacity-0 group-hover/msg:opacity-100 transition-opacity">
            <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent transition-colors" title="Copiar" onClick={() => onCopy(msg.content, index)}>
              {copiedIndex === index ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
            <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent transition-colors" title="Regenerar" onClick={() => onRetry(index)}>
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-green-500/10 transition-colors" title="Boa resposta" onClick={() => onFeedback('positive', msg.content)}>
              <ThumbsUp className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors" title="Resposta ruim" onClick={() => onFeedback('negative', msg.content)}>
              <ThumbsDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        )}
        {msg.role === 'user' && (
          <div className="flex items-center gap-1 mt-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
            <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-primary-foreground/10 transition-colors" title="Copiar" onClick={() => onCopy(msg.content, index)}>
              {copiedIndex === index ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 text-primary-foreground/60" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
