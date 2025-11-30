/**
 * CipherChat Cryptography Module
 * Implements RSA-OAEP, RSA-PSS, AES-GCM, and SHA-256 using Web Crypto API
 */

export interface RSAKeyPair {
  encryptionKeyPair: {
    publicKey: CryptoKey;
    privateKey: CryptoKey;
  };
  signatureKeyPair: {
    publicKey: CryptoKey;
    privateKey: CryptoKey;
  };
}

export interface ExportedKeys {
  encryptionPublicKey: string;
  signaturePublicKey: string;
}

/**
 * Generate RSA key pairs for encryption (RSA-OAEP) and signatures (RSA-PSS)
 */
export async function generateRSAKeyPairs(): Promise<RSAKeyPair> {
  // RSA-OAEP for key encryption
  const encryptionKeyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  // RSA-PSS for digital signatures
  const signatureKeyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-PSS",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"]
  );

  return {
    encryptionKeyPair,
    signatureKeyPair,
  };
}

/**
 * Export public keys to base64 strings for transmission
 */
export async function exportPublicKeys(keyPair: RSAKeyPair): Promise<ExportedKeys> {
  const encryptionPublic = await window.crypto.subtle.exportKey(
    "spki",
    keyPair.encryptionKeyPair.publicKey
  );
  
  const signaturePublic = await window.crypto.subtle.exportKey(
    "spki",
    keyPair.signatureKeyPair.publicKey
  );

  return {
    encryptionPublicKey: arrayBufferToBase64(encryptionPublic),
    signaturePublicKey: arrayBufferToBase64(signaturePublic),
  };
}

/**
 * Import public keys from base64 strings
 */
export async function importPublicKey(
  base64Key: string,
  type: "encryption" | "signature"
): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(base64Key);
  
  const algorithm = type === "encryption"
    ? { name: "RSA-OAEP", hash: "SHA-256" }
    : { name: "RSA-PSS", hash: "SHA-256" };

  const keyUsages = type === "encryption" ? ["encrypt"] : ["verify"];

  return await window.crypto.subtle.importKey(
    "spki",
    keyData,
    algorithm,
    true,
    keyUsages as KeyUsage[]
  );
}

/**
 * Export private keys to JWK format for storage
 */
export async function exportPrivateKeys(keyPair: RSAKeyPair): Promise<{
  encryptionPrivateKey: JsonWebKey;
  signaturePrivateKey: JsonWebKey;
}> {
  const encryptionPrivateKey = await window.crypto.subtle.exportKey(
    "jwk",
    keyPair.encryptionKeyPair.privateKey
  );
  
  const signaturePrivateKey = await window.crypto.subtle.exportKey(
    "jwk",
    keyPair.signatureKeyPair.privateKey
  );

  return {
    encryptionPrivateKey,
    signaturePrivateKey,
  };
}

/**
 * Import private keys from JWK format and reconstruct full key pairs
 */
export async function importPrivateKeys(
  encryptionPrivateJwk: JsonWebKey,
  signaturePrivateJwk: JsonWebKey,
  encryptionPublicKeyBase64: string,
  signaturePublicKeyBase64: string
): Promise<RSAKeyPair> {
  // Import encryption private key
  const encryptionPrivateKey = await window.crypto.subtle.importKey(
    "jwk",
    encryptionPrivateJwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );

  // Import signature private key
  const signaturePrivateKey = await window.crypto.subtle.importKey(
    "jwk",
    signaturePrivateJwk,
    { name: "RSA-PSS", hash: "SHA-256" },
    true,
    ["sign"]
  );

  // Import public keys from stored base64
  const encryptionPublicKey = await importPublicKey(encryptionPublicKeyBase64, "encryption");
  const signaturePublicKey = await importPublicKey(signaturePublicKeyBase64, "signature");

  return {
    encryptionKeyPair: {
      publicKey: encryptionPublicKey,
      privateKey: encryptionPrivateKey,
    },
    signatureKeyPair: {
      publicKey: signaturePublicKey,
      privateKey: signaturePrivateKey,
    },
  };
}

/**
 * Generate Safety Code (SHA-256 hash of public key)
 */
export async function generateSafetyCode(publicKey: string): Promise<string> {
  const keyData = base64ToArrayBuffer(publicKey);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", keyData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Format as groups of 4 characters for readability
  return hashHex.toUpperCase().match(/.{1,4}/g)?.join(' ') || hashHex;
}

/**
 * Encrypt a message using hybrid encryption (RSA-OAEP + AES-GCM)
 */
export async function encryptMessage(
  plaintext: string,
  recipientPublicKey: CryptoKey
): Promise<{
  ciphertext: string;
  aesNonce: string;
  encryptedAesKey: string;
}> {
  // Generate random AES-GCM key for this message
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // Generate random nonce/IV
  const aesNonce = window.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt plaintext with AES-GCM
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);
  
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: aesNonce },
    aesKey,
    plaintextBytes
  );

  // Export AES key and encrypt it with RSA-OAEP
  const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
  
  const encryptedAesKey = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientPublicKey,
    exportedAesKey
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    aesNonce: arrayBufferToBase64(aesNonce.buffer),
    encryptedAesKey: arrayBufferToBase64(encryptedAesKey),
  };
}

/**
 * Decrypt a message using hybrid decryption
 */
export async function decryptMessage(
  ciphertext: string,
  aesNonce: string,
  encryptedAesKey: string,
  privateKey: CryptoKey
): Promise<string> {
  // Decrypt AES key using RSA-OAEP
  const encryptedAesKeyBuffer = base64ToArrayBuffer(encryptedAesKey);
  const aesKeyBuffer = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedAesKeyBuffer
  );

  // Import decrypted AES key
  const aesKey = await window.crypto.subtle.importKey(
    "raw",
    aesKeyBuffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  // Decrypt ciphertext with AES-GCM
  const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
  const nonceBuffer = base64ToArrayBuffer(aesNonce);
  
  const plaintextBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(nonceBuffer) },
    aesKey,
    ciphertextBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(plaintextBuffer);
}

/**
 * Sign a message using RSA-PSS
 */
export async function signMessage(
  message: string,
  privateKey: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(message);
  
  const signature = await window.crypto.subtle.sign(
    {
      name: "RSA-PSS",
      saltLength: 32,
    },
    privateKey,
    messageBytes
  );

  return arrayBufferToBase64(signature);
}

/**
 * Verify a message signature using RSA-PSS
 */
export async function verifySignature(
  message: string,
  signature: string,
  publicKey: CryptoKey
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(message);
    const signatureBuffer = base64ToArrayBuffer(signature);
    
    return await window.crypto.subtle.verify(
      {
        name: "RSA-PSS",
        saltLength: 32,
      },
      publicKey,
      signatureBuffer,
      messageBytes
    );
  } catch (error) {
    if (import.meta.env.DEV) console.error("Signature verification failed:", error);
    return false;
  }
}

/**
 * Utility: ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Utility: Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
