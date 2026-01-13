import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useMultiTenant';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const useRealtimePresence = () => {
  const { user, profile, company } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Create presence channel
    const channel = supabase.channel('active-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        console.log('[Presence] Synced state:', channel.presenceState());
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Presence] Subscribed, tracking user:', user.id);
          
          await channel.track({
            user_id: user.id,
            email: user.email || profile?.email,
            first_name: profile?.first_name || null,
            last_name: profile?.last_name || null,
            avatar_url: profile?.avatar_url || null,
            company_id: company?.id || null,
            company_name: company?.name || null,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount or user change
    return () => {
      console.log('[Presence] Unsubscribing user:', user.id);
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [user?.id, profile?.first_name, profile?.last_name, profile?.avatar_url, company?.id, company?.name]);

  return null;
};
