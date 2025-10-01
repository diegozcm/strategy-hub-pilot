import React, { useState, useRef, useEffect } from 'react';
import { X, Minus, Send, Sparkles, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage, createChatSession, sendChatMessage } from '@/utils/aiChatHelpers';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface FloatingAIChatProps {
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  messages: ChatMessage[];
  onClose: () => void;
  onMinimize: () => void;
  onPositionChange: (position: { x: number; y: number }) => void;
  onMessagesChange: (messages: ChatMessage[]) => void;
}

export const FloatingAIChat: React.FC<FloatingAIChatProps> = ({
  isOpen,
  isMinimized,
  position,
  messages,
  onClose,
  onMinimize,
  onPositionChange,
  onMessagesChange
}) => {
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const quickActions = [
    { icon: TrendingUp, label: 'Análise de Performance', prompt: 'Me dê uma análise da performance atual' },
    { icon: AlertCircle, label: 'Pontos de Atenção', prompt: 'Quais são os principais pontos de atenção?' },
    { icon: Lightbulb, label: 'Sugestões', prompt: 'Me dê sugestões de melhorias' },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onPositionChange({
          x: Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(window.innerHeight - 600, e.clientY - dragOffset.y))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onPositionChange]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || chatInput.trim();
    if (!textToSend || isLoading) return;

    const { data: { user } } = await supabase.auth.getUser();
    const { data: { session } } = await supabase.auth.getSession();
    const companyId = session?.user?.user_metadata?.current_company_id;

    if (!user || !companyId) {
      toast({
        title: 'Erro',
        description: 'Usuário ou empresa não encontrados',
        variant: 'destructive'
      });
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    onMessagesChange([...messages, userMessage]);
    setChatInput('');
    setIsLoading(true);

    try {
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const session = await createChatSession(user.id, companyId);
        currentSessionId = session.id;
        setSessionId(currentSessionId);
      }

      const response = await sendChatMessage(
        currentSessionId,
        user.id,
        companyId,
        textToSend
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      onMessagesChange([...messages, userMessage, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Tente novamente mais tarde',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    handleSendMessage(prompt);
  };

  if (!isOpen) return null;

  return (
    <Card
      className={cn(
        "fixed z-50 shadow-2xl border-2 transition-all duration-300 bg-background",
        isMinimized ? "w-80 h-14" : "w-96 h-[600px]"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      <CardHeader className="drag-handle cursor-move p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">AI Copilot</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onMinimize}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-4 flex flex-col h-[calc(100%-4rem)]">
          {/* Quick Actions */}
          {messages.length === 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-sm text-muted-foreground mb-2">Ações rápidas:</p>
              <div className="grid grid-cols-1 gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto py-2 text-left"
                    onClick={() => handleQuickAction(action.prompt)}
                  >
                    <action.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-xs">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <ScrollArea ref={scrollRef} className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2 max-w-[80%]",
                      msg.role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <LoadingSpinner size="sm" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex gap-2 mt-4">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Digite sua mensagem..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !chatInput.trim()}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
