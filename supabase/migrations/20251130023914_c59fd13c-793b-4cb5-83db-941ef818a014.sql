-- Create users table with public keys and safety codes
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  rsa_public_key_encryption TEXT NOT NULL, -- RSA-OAEP public key for encryption
  rsa_public_key_signature TEXT NOT NULL,  -- RSA-PSS public key for signatures
  safety_code TEXT NOT NULL,               -- SHA-256 hash of public key
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Everyone can read user list and public keys (needed for encryption)
CREATE POLICY "Public keys are publicly readable"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- Users can only insert their own record (id must match auth.uid())
CREATE POLICY "Users can insert own record"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Users can only update their own record
CREATE POLICY "Users can update own record"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Create encrypted messages metadata table (server stores encrypted data only)
CREATE TABLE public.encrypted_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_username TEXT NOT NULL,
  recipient_username TEXT NOT NULL,
  ciphertext TEXT NOT NULL,              -- AES-GCM encrypted message
  aes_nonce TEXT NOT NULL,               -- AES-GCM IV/nonce
  encrypted_aes_key TEXT NOT NULL,       -- RSA-OAEP encrypted AES key
  signature TEXT NOT NULL,               -- RSA-PSS signature
  timestamp TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,                -- For auto-delete
  FOREIGN KEY (sender_username) REFERENCES public.users(username) ON DELETE CASCADE,
  FOREIGN KEY (recipient_username) REFERENCES public.users(username) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.encrypted_messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages sent to them or by them
CREATE POLICY "Users can read own messages"
ON public.encrypted_messages
FOR SELECT
TO authenticated
USING (
  sender_username IN (SELECT username FROM public.users WHERE id = auth.uid())
  OR recipient_username IN (SELECT username FROM public.users WHERE id = auth.uid())
);

-- Users can insert messages
CREATE POLICY "Users can send messages"
ON public.encrypted_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_username IN (SELECT username FROM public.users WHERE id = auth.uid())
);

-- Users can delete their own messages (for auto-delete)
CREATE POLICY "Users can delete own messages"
ON public.encrypted_messages
FOR DELETE
TO authenticated
USING (
  sender_username IN (SELECT username FROM public.users WHERE id = auth.uid())
  OR recipient_username IN (SELECT username FROM public.users WHERE id = auth.uid())
);

-- Enable realtime for messages
ALTER TABLE public.encrypted_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.encrypted_messages;

-- Create index for message queries
CREATE INDEX idx_messages_recipient ON public.encrypted_messages(recipient_username, timestamp DESC);
CREATE INDEX idx_messages_sender ON public.encrypted_messages(sender_username, timestamp DESC);
CREATE INDEX idx_messages_expires ON public.encrypted_messages(expires_at) WHERE expires_at IS NOT NULL;