import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface TypingState {
  [username: string]: boolean;
}

export function useTypingIndicator(currentUser: string | null, selectedUser: string | null) {
  const [typingUsers, setTypingUsers] = useState<TypingState>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBroadcastRef = useRef<number>(0);

  // Subscribe to typing events
  useEffect(() => {
    if (!currentUser || !selectedUser) return;

    // Create a unique channel for this conversation (sorted usernames for consistency)
    const participants = [currentUser, selectedUser].sort().join('-');
    const channelName = `typing:${participants}`;

    const channel = supabase.channel(channelName)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { username, isTyping } = payload.payload as { username: string; isTyping: boolean };
        
        // Ignore our own typing events
        if (username === currentUser) return;

        setTypingUsers(prev => ({
          ...prev,
          [username]: isTyping,
        }));

        // Auto-clear after 3 seconds if no update
        if (isTyping) {
          setTimeout(() => {
            setTypingUsers(prev => ({
              ...prev,
              [username]: false,
            }));
          }, 3000);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUser, selectedUser]);

  // Broadcast typing status (debounced)
  const broadcastTyping = useCallback((isTyping: boolean) => {
    if (!currentUser || !selectedUser || !channelRef.current) return;

    const now = Date.now();
    // Debounce: only broadcast every 500ms for "typing" events
    if (isTyping && now - lastBroadcastRef.current < 500) return;
    lastBroadcastRef.current = now;

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { username: currentUser, isTyping },
    });

    // Clear the typing timeout and set a new one
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping) {
      // Auto-send "stopped typing" after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        channelRef.current?.send({
          type: 'broadcast',
          event: 'typing',
          payload: { username: currentUser, isTyping: false },
        });
      }, 2000);
    }
  }, [currentUser, selectedUser]);

  // Check if a specific user is typing
  const isUserTyping = useCallback((username: string) => {
    return typingUsers[username] ?? false;
  }, [typingUsers]);

  // Check if selected user is typing
  const isSelectedUserTyping = selectedUser ? (typingUsers[selectedUser] ?? false) : false;

  return {
    broadcastTyping,
    isUserTyping,
    isSelectedUserTyping,
    typingUsers,
  };
}

