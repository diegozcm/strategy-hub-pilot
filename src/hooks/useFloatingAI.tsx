import { useState, useCallback } from 'react';
import { ChatMessage } from '@/utils/aiChatHelpers';

export const useFloatingAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ 
    x: window.innerWidth - 420,
    y: Math.max(20, window.innerHeight - 620)
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const updatePosition = useCallback((newPosition: { x: number; y: number }) => {
    setPosition(newPosition);
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
    if (!isOpen && message.role === 'assistant') {
      setUnreadCount(prev => prev + 1);
    }
  }, [isOpen]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    isOpen,
    position,
    messages,
    unreadCount,
    openChat,
    closeChat,
    updatePosition,
    addMessage,
    clearMessages,
    setMessages
  };
};
