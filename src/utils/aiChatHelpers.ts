import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const createChatSession = async (userId: string, companyId: string) => {
  try {
    const { data, error } = await supabase
      .from('ai_chat_sessions')
      .insert({
        user_id: userId,
        company_id: companyId,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating chat session:', error);
    throw error;
  }
};

export const sendChatMessage = async (
  sessionId: string,
  userId: string,
  companyId: string,
  message: string
) => {
  try {
    // Save user message
    const { error: userMsgError } = await supabase
      .from('ai_chat_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: message
      });

    if (userMsgError) throw userMsgError;

    // Call AI chat function
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        message,
        session_id: sessionId,
        user_id: userId,
        company_id: companyId
      }
    });

    if (error) throw error;

    // Save AI response
    const { error: aiMsgError } = await supabase
      .from('ai_chat_messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: data.response
      });

    if (aiMsgError) throw aiMsgError;

    return data.response;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};
