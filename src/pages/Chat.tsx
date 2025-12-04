import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { UserList } from '@/components/UserList';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageInput } from '@/components/MessageInput';
import { SafetyCode } from '@/components/SafetyCode';
import { TypingIndicator } from '@/components/TypingIndicator';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import {
  generateRSAKeyPairs,
  exportPublicKeys,
  exportPrivateKeys,
  importPrivateKeys,
  generateSafetyCode,
  encryptMessage,
  decryptMessage,
  signMessage,
  verifySignature,
  importPublicKey,
} from '@/lib/crypto';
import type { RSAKeyPair } from '@/lib/crypto';
import { storePrivateKeys, getStoredPrivateKeys, deleteExpiredMessages } from '@/lib/indexeddb';

interface User {
  username: string;
  rsa_public_key_encryption: string;
  rsa_public_key_signature: string;
  safety_code: string;
  last_seen: string;
}

interface Message {
  id: string;
  sender_username: string;
  recipient_username: string;
  ciphertext: string;
  aes_nonce: string;
  encrypted_aes_key: string;
  signature: string;
  timestamp: string;
  expires_at: string | null;
  decryptedText?: string;
  verified?: boolean;
}

export default function Chat() {
  const { user, username, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [keyPair, setKeyPair] = useState<RSAKeyPair | null>(null);
  const [initializing, setInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { broadcastTyping, isSelectedUserTyping } = useTypingIndicator(username, selectedUser);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (!user || !username) return;
      await initializeUser(isMounted);
    };

    if (user && username) {
      init();
    }

    return () => {
      isMounted = false;
    };
  }, [user, username]);

  const initializeUser = async (isMounted: boolean) => {
    if (!user || !username) return;
    
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (!isMounted) return;

      if (!existingUser) {
        const keys = await generateRSAKeyPairs();
        if (!isMounted) return;
        setKeyPair(keys);

        const exportedPublic = await exportPublicKeys(keys);
        const exportedPrivate = await exportPrivateKeys(keys);
        
        await storePrivateKeys(
          user.id,
          exportedPrivate.encryptionPrivateKey,
          exportedPrivate.signaturePrivateKey
        );
        
        const safetyCode = await generateSafetyCode(exportedPublic.encryptionPublicKey);

        const { error } = await supabase.from('users').insert({
          id: user.id,
          username: username,
          rsa_public_key_encryption: exportedPublic.encryptionPublicKey,
          rsa_public_key_signature: exportedPublic.signaturePublicKey,
          safety_code: safetyCode,
        });

        if (error) throw error;
        if (isMounted) toast.success('Encryption keys generated!');
      } else {
        const storedKeys = await getStoredPrivateKeys(user.id);
        if (!isMounted) return;
        
        if (storedKeys) {
          const keys = await importPrivateKeys(
            storedKeys.encryptionPrivateKey,
            storedKeys.signaturePrivateKey,
            existingUser.rsa_public_key_encryption,
            existingUser.rsa_public_key_signature
          );
          if (!isMounted) return;
          setKeyPair(keys);
        } else {
          const keys = await generateRSAKeyPairs();
          if (!isMounted) return;
          setKeyPair(keys);

          const exportedPublic = await exportPublicKeys(keys);
          const exportedPrivate = await exportPrivateKeys(keys);
          
          await storePrivateKeys(
            user.id,
            exportedPrivate.encryptionPrivateKey,
            exportedPrivate.signaturePrivateKey
          );
          
          const safetyCode = await generateSafetyCode(exportedPublic.encryptionPublicKey);

          const { error } = await supabase
            .from('users')
            .update({
              rsa_public_key_encryption: exportedPublic.encryptionPublicKey,
              rsa_public_key_signature: exportedPublic.signaturePublicKey,
              safety_code: safetyCode,
            })
            .eq('id', user.id);

          if (error) throw error;
          if (isMounted) toast.warning('New keys generated. Old messages cannot be decrypted.');
        }
      }

      if (isMounted) fetchUsers();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error initializing:', error);
      if (isMounted) toast.error('Failed to initialize encryption');
    } finally {
      if (isMounted) setInitializing(false);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('last_seen', { ascending: false });

    if (!error) setUsers(data || []);
  };

  useEffect(() => {
    if (!selectedUser || !username) return;

    fetchMessages();

    const channel = supabase
      .channel(`messages-${selectedUser}-${username}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'encrypted_messages',
          filter: `recipient_username=eq.${username}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_username === selectedUser) {
            handleNewMessage(msg);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser, username]);

  const fetchMessages = async () => {
    if (!selectedUser || !username) return;

    const { data, error } = await supabase
      .from('encrypted_messages')
      .select('*')
      .or(`and(sender_username.eq.${username},recipient_username.eq.${selectedUser}),and(sender_username.eq.${selectedUser},recipient_username.eq.${username})`)
      .order('timestamp', { ascending: true });

    if (error) return;

    const decrypted = await Promise.all(
      (data || []).map(msg => decryptAndVerifyMessage(msg))
    );

    setMessages(decrypted);
  };

  const decryptAndVerifyMessage = async (msg: Message): Promise<Message> => {
    if (msg.recipient_username !== username || !keyPair) {
      return msg;
    }

    try {
      const plaintext = await decryptMessage(
        msg.ciphertext,
        msg.aes_nonce,
        msg.encrypted_aes_key,
        keyPair.encryptionKeyPair.privateKey
      );

      const senderUser = users.find(u => u.username === msg.sender_username);
      if (senderUser) {
        const senderPublicKey = await importPublicKey(
          senderUser.rsa_public_key_signature,
          'signature'
        );
        
        const isVerified = await verifySignature(
          plaintext,
          msg.signature,
          senderPublicKey
        );

        return { ...msg, decryptedText: plaintext, verified: isVerified };
      }

      return { ...msg, decryptedText: plaintext, verified: false };
    } catch {
      return { ...msg, decryptedText: '[Decryption failed]', verified: false };
    }
  };

  const handleNewMessage = async (msg: Message) => {
    const decrypted = await decryptAndVerifyMessage(msg);
    setMessages(prev => [...prev, decrypted]);
  };

  const sendMessage = async (text: string, expiryMinutes: number | null) => {
    if (!selectedUser || !username || !keyPair) return;

    try {
      const recipient = users.find(u => u.username === selectedUser);
      if (!recipient) {
        toast.error('Recipient not found');
        return;
      }

      const recipientPublicKey = await importPublicKey(
        recipient.rsa_public_key_encryption,
        'encryption'
      );

      const { ciphertext, aesNonce, encryptedAesKey } = await encryptMessage(
        text,
        recipientPublicKey
      );

      const signature = await signMessage(text, keyPair.signatureKeyPair.privateKey);

      const expiresAt = expiryMinutes
        ? new Date(Date.now() + expiryMinutes * 60000).toISOString()
        : null;

      const { error } = await supabase.from('encrypted_messages').insert({
        sender_username: username,
        recipient_username: selectedUser,
        ciphertext,
        aes_nonce: aesNonce,
        encrypted_aes_key: encryptedAesKey,
        signature,
        expires_at: expiresAt,
      });

      if (error) throw error;

      const newMsg: Message = {
        id: crypto.randomUUID(),
        sender_username: username,
        recipient_username: selectedUser,
        ciphertext,
        aes_nonce: aesNonce,
        encrypted_aes_key: encryptedAesKey,
        signature,
        timestamp: new Date().toISOString(),
        expires_at: expiresAt,
        decryptedText: text,
        verified: true,
      };

      setMessages(prev => [...prev, newMsg]);
    } catch {
      toast.error('Failed to send');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    const updateLastSeen = async () => {
      await supabase
        .from('users')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', user.id);
    };

    updateLastSeen();
    const interval = setInterval(updateLastSeen, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const cleanup = async () => {
      await deleteExpiredMessages();
      const now = new Date();
      setMessages(prev => prev.filter(msg => 
        !msg.expires_at || new Date(msg.expires_at) > now
      ));
    };

    const interval = setInterval(cleanup, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (authLoading || initializing) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Setting up encryption...</p>
        </div>
      </div>
    );
  }

  const selectedUserData = users.find(u => u.username === selectedUser);
  const conversationMessages = messages.filter(
    msg =>
      (msg.sender_username === username && msg.recipient_username === selectedUser) ||
      (msg.sender_username === selectedUser && msg.recipient_username === username)
  );

  return (
    <div className="h-full flex">
      {/* Contacts */}
      <div className="w-72 flex-shrink-0 border-r border-border">
        {username && (
          <UserList
            users={users}
            currentUser={username}
            selectedUser={selectedUser}
            onSelectUser={setSelectedUser}
          />
        )}
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        {selectedUser && selectedUserData ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                  {selectedUser.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-semibold">{selectedUser}</h2>
                  <p className="text-xs text-muted-foreground">Encrypted</p>
                </div>
              </div>
              <SafetyCode code={selectedUserData.safety_code} username={selectedUser} />
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3 max-w-2xl mx-auto">
                {conversationMessages.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                  </div>
                )}
                {conversationMessages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg.decryptedText || '[Encrypted]'}
                    isSent={msg.sender_username === username}
                    verified={msg.verified ?? false}
                    timestamp={new Date(msg.timestamp)}
                    expiresAt={msg.expires_at ? new Date(msg.expires_at) : undefined}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Typing */}
            {isSelectedUserTyping && <TypingIndicator username={selectedUser} />}

            {/* Input */}
            <MessageInput 
              onSend={sendMessage}
              onTyping={broadcastTyping}
              disabled={!keyPair}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Select a contact</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
