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
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut, Shield, Loader2 } from 'lucide-react';
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
  const { user, username, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [keyPair, setKeyPair] = useState<RSAKeyPair | null>(null);
  const [initializing, setInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Typing indicator hook
  const { broadcastTyping, isSelectedUserTyping } = useTypingIndicator(username, selectedUser);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Initialize keys and register user
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
      // Check if user already exists in database
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (!isMounted) return;

      if (!existingUser) {
        // New user - generate RSA keys
        const keys = await generateRSAKeyPairs();
        if (!isMounted) return;
        setKeyPair(keys);

        // Export public keys for server storage
        const exportedPublic = await exportPublicKeys(keys);
        
        // Export private keys for local storage
        const exportedPrivate = await exportPrivateKeys(keys);
        
        // Store private keys locally in IndexedDB
        await storePrivateKeys(
          user.id,
          exportedPrivate.encryptionPrivateKey,
          exportedPrivate.signaturePrivateKey
        );
        
        // Generate safety code
        const safetyCode = await generateSafetyCode(exportedPublic.encryptionPublicKey);

        // Register user with public keys
        const { error } = await supabase.from('users').insert({
          id: user.id,
          username: username,
          rsa_public_key_encryption: exportedPublic.encryptionPublicKey,
          rsa_public_key_signature: exportedPublic.signaturePublicKey,
          safety_code: safetyCode,
        });

        if (error) throw error;
        
        if (isMounted) toast.success('Encryption keys generated and stored securely!');
      } else {
        // Existing user - try to recover keys from IndexedDB
        const storedKeys = await getStoredPrivateKeys(user.id);
        if (!isMounted) return;
        
        if (storedKeys) {
          // Recover keys from local storage
          const keys = await importPrivateKeys(
            storedKeys.encryptionPrivateKey,
            storedKeys.signaturePrivateKey,
            existingUser.rsa_public_key_encryption,
            existingUser.rsa_public_key_signature
          );
          if (!isMounted) return;
          setKeyPair(keys);
          toast.success('Encryption keys recovered!');
        } else {
          // Keys not found locally - this is a new device or keys were cleared
          // Generate new keys and update the user record
          const keys = await generateRSAKeyPairs();
          if (!isMounted) return;
          setKeyPair(keys);

          // Export public keys for server storage
          const exportedPublic = await exportPublicKeys(keys);
          
          // Export private keys for local storage
          const exportedPrivate = await exportPrivateKeys(keys);
          
          // Store private keys locally in IndexedDB
          await storePrivateKeys(
            user.id,
            exportedPrivate.encryptionPrivateKey,
            exportedPrivate.signaturePrivateKey
          );
          
          // Generate new safety code
          const safetyCode = await generateSafetyCode(exportedPublic.encryptionPublicKey);

          // Update user's public keys (old messages can't be decrypted anymore)
          const { error } = await supabase
            .from('users')
            .update({
              rsa_public_key_encryption: exportedPublic.encryptionPublicKey,
              rsa_public_key_signature: exportedPublic.signaturePublicKey,
              safety_code: safetyCode,
            })
            .eq('id', user.id);

          if (error) throw error;
          
          if (isMounted) toast.warning('New device detected. New encryption keys generated. Previous messages cannot be decrypted.');
        }
      }

      if (isMounted) fetchUsers();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error initializing user:', error);
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

    if (error) {
      if (import.meta.env.DEV) console.error('Error fetching users:', error);
      return;
    }

    setUsers(data || []);
  };

  // Fetch messages for selected user
  useEffect(() => {
    if (!selectedUser || !username) return;

    fetchMessages();

    // Subscribe to new messages - listen for messages in both directions
    // Channel 1: Messages FROM the selected user TO current user
    const incomingChannel = supabase
      .channel(`incoming-${selectedUser}-${username}`)
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
          // Only handle if it's from the selected user
          if (msg.sender_username === selectedUser) {
            handleNewMessage(msg);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(incomingChannel);
    };
  }, [selectedUser, username]);

  const fetchMessages = async () => {
    if (!selectedUser || !username) return;

    const { data, error } = await supabase
      .from('encrypted_messages')
      .select('*')
      .or(`and(sender_username.eq.${username},recipient_username.eq.${selectedUser}),and(sender_username.eq.${selectedUser},recipient_username.eq.${username})`)
      .order('timestamp', { ascending: true });

    if (error) {
      if (import.meta.env.DEV) console.error('Error fetching messages:', error);
      return;
    }

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
      // Decrypt message
      const plaintext = await decryptMessage(
        msg.ciphertext,
        msg.aes_nonce,
        msg.encrypted_aes_key,
        keyPair.encryptionKeyPair.privateKey
      );

      // Verify signature
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

        return {
          ...msg,
          decryptedText: plaintext,
          verified: isVerified,
        };
      }

      return { ...msg, decryptedText: plaintext, verified: false };
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error decrypting message:', error);
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
      // Get recipient's public key
      const recipient = users.find(u => u.username === selectedUser);
      if (!recipient) {
        toast.error('Recipient not found');
        return;
      }

      const recipientPublicKey = await importPublicKey(
        recipient.rsa_public_key_encryption,
        'encryption'
      );

      // Encrypt message
      const { ciphertext, aesNonce, encryptedAesKey } = await encryptMessage(
        text,
        recipientPublicKey
      );

      // Sign message
      const signature = await signMessage(text, keyPair.signatureKeyPair.privateKey);

      // Calculate expiry
      const expiresAt = expiryMinutes
        ? new Date(Date.now() + expiryMinutes * 60000).toISOString()
        : null;

      // Send to server
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

      // Add to local messages
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
      
      toast.success('Message encrypted and sent!');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update last_seen periodically to show online status
  useEffect(() => {
    if (!user) return;

    const updateLastSeen = async () => {
      await supabase
        .from('users')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', user.id);
    };

    // Update immediately
    updateLastSeen();

    // Then update every 2 minutes
    const interval = setInterval(updateLastSeen, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  // Clean up expired messages periodically
  useEffect(() => {
    const cleanupExpiredMessages = async () => {
      // Clean local IndexedDB
      await deleteExpiredMessages();
      
      // Filter out expired messages from state
      const now = new Date();
      setMessages(prev => prev.filter(msg => 
        !msg.expires_at || new Date(msg.expires_at) > now
      ));
    };

    // Run cleanup every 30 seconds
    const interval = setInterval(cleanupExpiredMessages, 30 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (authLoading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing encryption...</p>
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
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold gradient-cyber bg-clip-text text-transparent">
                CipherChat
              </h1>
              <p className="text-xs text-muted-foreground">
                Logged in as {username}
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSignOut}
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* User List */}
        <div className="w-80 flex-shrink-0">
          {username && (
            <UserList
              users={users}
              currentUser={username}
              selectedUser={selectedUser}
              onSelectUser={setSelectedUser}
            />
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedUser && selectedUserData ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-card">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{selectedUser}</h2>
                </div>
                <div className="mt-3">
                  <SafetyCode 
                    code={selectedUserData.safety_code} 
                    username={selectedUser}
                  />
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 max-w-4xl mx-auto">
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

              {/* Typing Indicator */}
              {isSelectedUserTyping && selectedUser && (
                <div className="px-4 py-2 border-t border-border bg-card/50">
                  <TypingIndicator username={selectedUser} />
                </div>
              )}

              {/* Message Input */}
              <MessageInput 
                onSend={sendMessage}
                onTyping={broadcastTyping}
                disabled={!keyPair}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Select a user to start chatting</h3>
                <p className="text-sm text-muted-foreground">
                  All messages are end-to-end encrypted
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
