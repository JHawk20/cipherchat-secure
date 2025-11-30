/**
 * IndexedDB wrapper for encrypted local chat history
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ChatMessage {
  id: string;
  conversationWith: string;
  encryptedData: string; // Encrypted message data
  timestamp: number;
  expiresAt?: number;
}

interface StoredKeyPair {
  id: string; // 'keys' - single record per user
  userId: string;
  encryptionPrivateKey: JsonWebKey;
  signaturePrivateKey: JsonWebKey;
}

interface ChatDB extends DBSchema {
  messages: {
    key: string;
    value: ChatMessage;
    indexes: {
      'by-conversation': string;
      'by-expiry': number;
    };
  };
  keys: {
    key: string;
    value: {
      keyType: string;
      encryptedKey: string;
    };
  };
  privateKeys: {
    key: string;
    value: StoredKeyPair;
  };
}

let dbInstance: IDBPDatabase<ChatDB> | null = null;

/**
 * Initialize IndexedDB
 */
export async function initDB(): Promise<IDBPDatabase<ChatDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ChatDB>('CipherChatDB', 2, {
    upgrade(db, oldVersion) {
      // Messages store
      if (!db.objectStoreNames.contains('messages')) {
        const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
        messagesStore.createIndex('by-conversation', 'conversationWith');
        messagesStore.createIndex('by-expiry', 'expiresAt');
      }

      // Keys store (legacy - for encrypted private keys)
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys', { keyPath: 'keyType' });
      }

      // Private keys store (v2 - stores JWK format keys)
      if (!db.objectStoreNames.contains('privateKeys')) {
        db.createObjectStore('privateKeys', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
}

/**
 * Store encrypted message locally
 */
export async function storeMessage(
  id: string,
  conversationWith: string,
  encryptedData: string,
  expiresAt?: number
): Promise<void> {
  const db = await initDB();
  
  await db.add('messages', {
    id,
    conversationWith,
    encryptedData,
    timestamp: Date.now(),
    expiresAt,
  });
}

/**
 * Get messages for a conversation
 */
export async function getMessages(conversationWith: string): Promise<ChatMessage[]> {
  const db = await initDB();
  const messages = await db.getAllFromIndex('messages', 'by-conversation', conversationWith);
  
  // Filter out expired messages
  const now = Date.now();
  return messages.filter(msg => !msg.expiresAt || msg.expiresAt > now);
}

/**
 * Delete expired messages
 */
export async function deleteExpiredMessages(): Promise<number> {
  const db = await initDB();
  const now = Date.now();
  
  const allMessages = await db.getAll('messages');
  let deletedCount = 0;
  
  for (const msg of allMessages) {
    if (msg.expiresAt && msg.expiresAt <= now) {
      await db.delete('messages', msg.id);
      deletedCount++;
    }
  }
  
  return deletedCount;
}

/**
 * Delete a specific message
 */
export async function deleteMessage(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('messages', id);
}

/**
 * Store encrypted private keys
 */
export async function storeEncryptedKeys(
  encryptionKey: string,
  signatureKey: string
): Promise<void> {
  const db = await initDB();
  
  await db.put('keys', {
    keyType: 'encryption',
    encryptedKey: encryptionKey,
  });
  
  await db.put('keys', {
    keyType: 'signature',
    encryptedKey: signatureKey,
  });
}

/**
 * Get encrypted private keys
 */
export async function getEncryptedKeys(): Promise<{
  encryptionKey: string | null;
  signatureKey: string | null;
}> {
  const db = await initDB();
  
  const encryptionData = await db.get('keys', 'encryption');
  const signatureData = await db.get('keys', 'signature');
  
  return {
    encryptionKey: encryptionData?.encryptedKey || null,
    signatureKey: signatureData?.encryptedKey || null,
  };
}

/**
 * Clear all data
 */
export async function clearAllData(): Promise<void> {
  const db = await initDB();
  await db.clear('messages');
  await db.clear('keys');
  await db.clear('privateKeys');
}

/**
 * Store private keys for a user (JWK format)
 */
export async function storePrivateKeys(
  userId: string,
  encryptionPrivateKey: JsonWebKey,
  signaturePrivateKey: JsonWebKey
): Promise<void> {
  const db = await initDB();
  
  await db.put('privateKeys', {
    id: 'keys', // Single record per browser
    userId,
    encryptionPrivateKey,
    signaturePrivateKey,
  });
}

/**
 * Get stored private keys for a user
 */
export async function getStoredPrivateKeys(userId: string): Promise<{
  encryptionPrivateKey: JsonWebKey;
  signaturePrivateKey: JsonWebKey;
} | null> {
  const db = await initDB();
  
  const stored = await db.get('privateKeys', 'keys');
  
  // Only return keys if they belong to the current user
  if (stored && stored.userId === userId) {
    return {
      encryptionPrivateKey: stored.encryptionPrivateKey,
      signaturePrivateKey: stored.signaturePrivateKey,
    };
  }
  
  return null;
}

/**
 * Clear private keys (on sign out)
 */
export async function clearPrivateKeys(): Promise<void> {
  const db = await initDB();
  await db.clear('privateKeys');
}
