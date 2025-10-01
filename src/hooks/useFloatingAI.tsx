import { useState, useCallback } from 'react';
import { ChatMessage } from '@/utils/aiChatHelpers';

export const useFloatingAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 500 });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
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
    isMinimized,
    position,
    messages,
    unreadCount,
    openChat,
    closeChat,
    toggleMinimize,
    updatePosition,
    addMessage,
    clearMessages,
    setMessages
  };
};
