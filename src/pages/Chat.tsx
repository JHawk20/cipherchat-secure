import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { UserList } from '@/components/UserList';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageInput } from '@/components/MessageInput';
import { SafetyCode } from '@/components/SafetyCode';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  generateRSAKeyPairs,
  exportPublicKeys,
  generateSafetyCode,
  encryptMessage,
  decryptMessage,
  signMessage,
  verifySignature,
  importPublicKey,
} from '@/lib/crypto';
import type { RSAKeyPair } from '@/lib/crypto';

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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Initialize keys and register user
  useEffect(() => {
    if (user && username) {
      initializeUser();
    }
  }, [user, username]);

  const initializeUser = async () => {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (!existingUser) {
        // Generate RSA keys
        const keys = await generateRSAKeyPairs();
        setKeyPair(keys);

        // Export public keys
        const exported = await exportPublicKeys(keys);
        
        // Generate safety code
        const safetyCode = await generateSafetyCode(exported.encryptionPublicKey);

        // Register user with public keys
        const { error } = await supabase.from('users').insert({
          id: user.id,
          username: username!,
          rsa_public_key_encryption: exported.encryptionPublicKey,
          rsa_public_key_signature: exported.signaturePublicKey,
          safety_code: safetyCode,
        });

        if (error) throw error;
        
        toast.success('Encryption keys generated!');
      } else {
        // User exists, we'd need to implement key recovery here
        // For demo purposes, generate new keys
        const keys = await generateRSAKeyPairs();
        setKeyPair(keys);
      }

      fetchUsers();
    } catch (error) {
      console.error('Error initializing user:', error);
      toast.error('Failed to initialize encryption');
    } finally {
      setInitializing(false);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('last_seen', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    setUsers(data || []);
  };

  // Fetch messages for selected user
  useEffect(() => {
    if (!selectedUser || !username) return;

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'encrypted_messages',
          filter: `sender_username=eq.${selectedUser},recipient_username=eq.${username}`,
        },
        (payload) => {
          handleNewMessage(payload.new as Message);
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

    if (error) {
      console.error('Error fetching messages:', error);
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
      console.error('Error decrypting message:', error);
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
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
          <UserList
            users={users}
            currentUser={username!}
            selectedUser={selectedUser}
            onSelectUser={setSelectedUser}
          />
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

              {/* Message Input */}
              <MessageInput 
                onSend={sendMessage} 
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
