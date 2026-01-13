import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActiveUser {
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  company_id: string | null;
  company_name: string | null;
  online_at: string;
}

export const useActiveUsersPresence = () => {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const channel = supabase.channel('active-users', {
      config: {
        presence: {
          key: 'admin-observer',
        },
      },
    });

    const updateUsers = () => {
      const state = channel.presenceState();
      console.log('[AdminPresence] State updated:', state);
      
      // Convert presence state to array of users
      const users: ActiveUser[] = [];
      
      Object.entries(state).forEach(([key, presences]) => {
        // Skip admin observer key
        if (key === 'admin-observer') return;
        
        // Get the most recent presence for each user
        const latestPresence = presences[presences.length - 1] as unknown as ActiveUser;
        if (latestPresence?.user_id) {
          users.push(latestPresence);
        }
      });

      // Sort by online_at (most recent first)
      users.sort((a, b) => 
        new Date(b.online_at).getTime() - new Date(a.online_at).getTime()
      );

      setActiveUsers(users);
      setIsLoading(false);
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        console.log('[AdminPresence] Sync event');
        updateUsers();
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('[AdminPresence] User joined:', key, newPresences);
        updateUsers();
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('[AdminPresence] User left:', key, leftPresences);
        updateUsers();
      })
      .subscribe((status) => {
        console.log('[AdminPresence] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsLoading(false);
        }
      });

    return () => {
      console.log('[AdminPresence] Unsubscribing');
      channel.unsubscribe();
    };
  }, []);

  return { activeUsers, isLoading };
};
