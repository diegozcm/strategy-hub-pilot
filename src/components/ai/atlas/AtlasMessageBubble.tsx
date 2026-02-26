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
      <div className={cn("flex gap-2.5 max-w-[85%]", isUser ? "flex-row-reverse" : "flex-row")}>
        {/* Avatar */}
        {isUser ? (
          <div className="mt-1 shrink-0 h-7 w-7 rounded-full flex items-center justify-center" style={{ backgroundColor: '#38B6FF' }}>
            <User className="h-3.5 w-3.5 text-white" />
          </div>
        ) : (
          <div className="mt-1 shrink-0">
            <AtlasOrb size={28} />
          </div>
        )}

        {/* Bubble */}
        <div className={cn(
          "rounded-2xl px-4 py-3",
          isUser
            ? 'text-white'
            : 'text-white/90'
        )} style={isUser
          ? { backgroundColor: '#38B6FF' }
          : { backgroundColor: 'rgba(13, 35, 56, 0.7)', border: '1px solid rgba(56, 182, 255, 0.12)' }
        }>
          {/* Images */}
          {msg.images && msg.images.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {msg.images.map((img, imgIdx) => (
                <img key={imgIdx} src={img} alt={`Imagem ${imgIdx + 1}`} className="max-h-24 rounded-lg border border-white/20" />
              ))}
            </div>
          )}

          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <>
              {msg.autoPlan && (
                <div className="flex items-center gap-1 mb-2 text-[10px] font-medium rounded-md px-2 py-0.5 w-fit" style={{ backgroundColor: 'rgba(205, 217, 102, 0.15)', color: '#CDD966' }}>
                  <Sparkles className="h-3 w-3" />
                  Plan automático
                </div>
              )}
              <div className="text-sm prose prose-sm max-w-none prose-invert">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-2 text-white">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-2 text-white">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1 text-white">{children}</h3>,
                    p: ({ children }) => <p className="mb-2 last:mb-0 text-white/85">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-sm text-white/85">{children}</li>,
                    strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                    code: ({ children }) => <code className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: 'rgba(56, 182, 255, 0.1)' }}>{children}</code>,
                    pre: ({ children }) => <pre className="p-2 rounded-lg my-2 overflow-x-auto text-xs" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>{children}</pre>,
                  }}
                >{msg.content}</ReactMarkdown>
              </div>
            </>
          )}

          {/* Plan controls */}
          {msg.plan && msg.planStatus === 'pending' && (
            <div className="flex gap-2 mt-3 pt-2 border-t border-white/10">
              <button
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: 'rgba(205, 217, 102, 0.15)', color: '#CDD966' }}
                onClick={() => onExecutePlan(msg.plan, index)}
              >
                <Check className="h-3.5 w-3.5" /> Aprovar
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-sm font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                onClick={() => onRejectPlan(index)}
              >
                <XCircle className="h-3.5 w-3.5" /> Reprovar
              </button>
            </div>
          )}
          {msg.plan && msg.planStatus === 'executing' && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10 text-xs text-white/50">
              <LoadingSpinner size="sm" /> Executando plano...
            </div>
          )}
          {msg.plan && msg.planStatus === 'done' && (
            <div className="mt-3 pt-2 border-t border-white/10 text-xs font-medium" style={{ color: '#CDD966' }}>✅ Plano executado</div>
          )}
          {msg.plan && msg.planStatus === 'rejected' && (
            <div className="mt-3 pt-2 border-t border-white/10 text-xs text-white/40">❌ Plano recusado</div>
          )}
          {msg.plan && msg.planStatus === 'error' && (
            <div className="mt-3 pt-2 border-t border-white/10 text-xs text-red-400">⚠️ Erro ao executar</div>
          )}
        </div>
      </div>

      {/* Action buttons OUTSIDE the bubble */}
      {!isUser && msg.planStatus !== 'executing' && (
        <div className="flex items-center gap-0.5 mt-1 ml-[38px] opacity-0 group-hover/msg:opacity-100 transition-opacity">
          <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors" title="Copiar" onClick={() => onCopy(msg.content, index)}>
            {copiedIndex === index ? <Check className="h-3 w-3" style={{ color: '#CDD966' }} /> : <Copy className="h-3 w-3 text-white/40" />}
          </button>
          <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors" title="Regenerar" onClick={() => onRetry(index)}>
            <RefreshCw className="h-3 w-3 text-white/40" />
          </button>
          <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors" title="Boa resposta" onClick={() => onFeedback('positive', msg.content)}>
            <ThumbsUp className="h-3 w-3 text-white/40" />
          </button>
          <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors" title="Resposta ruim" onClick={() => onFeedback('negative', msg.content)}>
            <ThumbsDown className="h-3 w-3 text-white/40" />
          </button>
        </div>
      )}
      {isUser && (
        <div className="flex items-center gap-0.5 mt-1 mr-[38px] opacity-0 group-hover/msg:opacity-100 transition-opacity">
          <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors" title="Copiar" onClick={() => onCopy(msg.content, index)}>
            {copiedIndex === index ? <Check className="h-3 w-3" style={{ color: '#CDD966' }} /> : <Copy className="h-3 w-3 text-white/40" />}
          </button>
        </div>
      )}
    </div>
  );
};
