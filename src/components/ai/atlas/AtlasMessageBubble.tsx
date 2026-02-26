import React from 'react';
import { Check, XCircle, Copy, RefreshCw, ThumbsUp, ThumbsDown, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '@/hooks/useAtlasChat';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AtlasOrb } from './AtlasOrb';

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
  const isUser = msg.role === 'user';

  return (
    <div className={cn("flex flex-col group/msg", isUser ? "items-end" : "items-start")}>
      {/* Row: Avatar + Bubble */}
      <div className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}>
        {/* Avatar */}
        {isUser ? (
          <div className="mt-1 shrink-0 h-7 w-7 rounded-full bg-[hsl(var(--cofound-blue-light))] flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-white" />
          </div>
        ) : (
          <div className="mt-1 shrink-0">
            <AtlasOrb size={28} />
          </div>
        )}

        {/* Bubble */}
        <div className={cn(
          "rounded-xl px-4 py-3 max-w-[80%]",
          isUser
            ? 'bg-[hsl(var(--cofound-blue-light))] text-white'
            : 'bg-card/90 backdrop-blur-sm text-foreground border border-[hsl(var(--cofound-blue-light))]/10'
        )}>
          {/* Images */}
          {msg.images && msg.images.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {msg.images.map((img, imgIdx) => (
                <img key={imgIdx} src={img} alt={`Imagem ${imgIdx + 1}`} className="max-h-24 rounded border border-white/20" />
              ))}
            </div>
          )}

          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <>
              {msg.autoPlan && (
                <div className="flex items-center gap-1 mb-2 text-[10px] font-medium rounded-md px-2 py-0.5 w-fit bg-[hsl(var(--cofound-green))]/15 text-[hsl(var(--cofound-green))]">
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

          {/* Plan controls (stay inside bubble) */}
          {msg.plan && msg.planStatus === 'pending' && (
            <div className="flex gap-2 mt-3 pt-2 border-t border-white/10">
              <button
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-sm font-medium bg-[hsl(var(--cofound-green))]/15 text-[hsl(var(--cofound-green))] hover:bg-[hsl(var(--cofound-green))]/25 transition-colors"
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
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10 text-xs text-muted-foreground">
              <LoadingSpinner size="sm" /> Executando plano...
            </div>
          )}
          {msg.plan && msg.planStatus === 'done' && (
            <div className="mt-3 pt-2 border-t border-white/10 text-xs font-medium text-[hsl(var(--cofound-green))]">✅ Plano executado</div>
          )}
          {msg.plan && msg.planStatus === 'rejected' && (
            <div className="mt-3 pt-2 border-t border-white/10 text-xs text-muted-foreground">❌ Plano recusado</div>
          )}
          {msg.plan && msg.planStatus === 'error' && (
            <div className="mt-3 pt-2 border-t border-white/10 text-xs text-destructive">⚠️ Erro ao executar</div>
          )}
        </div>
      </div>

      {/* Action buttons OUTSIDE the bubble */}
      {!isUser && msg.planStatus !== 'executing' && (
        <div className={cn(
          "flex items-center gap-1 mt-1 opacity-0 group-hover/msg:opacity-100 transition-opacity",
          "ml-[38px]" // offset to align with bubble start (after avatar)
        )}>
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors" title="Copiar" onClick={() => onCopy(msg.content, index)}>
            {copiedIndex === index ? <Check className="h-3.5 w-3.5 text-[hsl(var(--cofound-green))]" /> : <Copy className="h-3.5 w-3.5 text-[hsl(var(--cofound-white))]/60" />}
          </button>
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors" title="Regenerar" onClick={() => onRetry(index)}>
            <RefreshCw className="h-3.5 w-3.5 text-[hsl(var(--cofound-white))]/60" />
          </button>
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-[hsl(var(--cofound-green))]/20 transition-colors" title="Boa resposta" onClick={() => onFeedback('positive', msg.content)}>
            <ThumbsUp className="h-3.5 w-3.5 text-[hsl(var(--cofound-white))]/60" />
          </button>
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/20 transition-colors" title="Resposta ruim" onClick={() => onFeedback('negative', msg.content)}>
            <ThumbsDown className="h-3.5 w-3.5 text-[hsl(var(--cofound-white))]/60" />
          </button>
        </div>
      )}
      {isUser && (
        <div className="flex items-center gap-1 mt-1 mr-[38px] opacity-0 group-hover/msg:opacity-100 transition-opacity">
          <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors" title="Copiar" onClick={() => onCopy(msg.content, index)}>
            {copiedIndex === index ? <Check className="h-3.5 w-3.5 text-[hsl(var(--cofound-green))]" /> : <Copy className="h-3.5 w-3.5 text-[hsl(var(--cofound-white))]/60" />}
          </button>
        </div>
      )}
    </div>
  );
};
