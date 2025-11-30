# 🔐 CipherChat - Secure RSA-Based Messaging Application

**An educational cryptography project demonstrating real-world secure messaging principles**

## 📋 Overview

CipherChat is a web-based messaging application that demonstrates real-world cryptographic principles through secure communication between users. The system ensures message **authenticity**, **integrity**, and **confidentiality** by combining:

- **RSA Digital Signatures** (RSA-PSS)
- **Hybrid Encryption** (RSA-OAEP + AES-GCM)
- **Local Encrypted History** (IndexedDB with AES-GCM)
- **Ephemeral Messages** (Auto-delete)
- **Safety Codes** (SHA-256 public key fingerprints)

## 🎯 Key Features

### 1. RSA Key Generation & Verification
- Each user automatically generates an RSA key pair (public/private) upon registration
- **RSA-OAEP (2048-bit)** for key encryption
- **RSA-PSS (2048-bit)** for digital signatures
- Public keys are shared through the server
- Private keys **never leave the device**

### 2. Hybrid Encryption for Messages
- **Performance**: RSA encrypts a randomly generated AES-GCM key
- **Security**: AES-GCM (256-bit) encrypts the actual message
- **Fresh keys**: New AES key generated for each message
- **Authenticated encryption**: AES-GCM provides both confidentiality and integrity

### 3. Digital Signatures (Non-Repudiation)
- Every message is signed with sender's RSA-PSS private key
- Recipients verify signatures using sender's public key
- **✅ Verified badge**: Signature verification succeeded
- **⚠️ Unverified badge**: Signature verification failed (message may be tampered)

### 4. Safety Codes / Fingerprints
- SHA-256 hash of user's RSA public key
- Displayed in easy-to-read format (groups of 4 hex digits)
- Users can compare codes out-of-band to prevent MITM attacks
- Similar to WhatsApp's security codes

### 5. Encrypted Local Chat History
- Messages stored in browser's IndexedDB
- All stored data is AES-GCM encrypted
- History persists between sessions
- Decryption happens client-side only

### 6. Auto-Delete / Ephemeral Messages
- Users can set expiration timers per message:
  - 30 seconds
  - 5 minutes
  - 1 hour
  - 24 hours
- Expired messages are automatically deleted
- Both encrypted message and keys are removed

## 🔒 Cryptographic Implementation

### Web Crypto API

CipherChat uses the browser's native **Web Crypto API** for all cryptographic operations:

```typescript
// RSA-OAEP for key encryption
window.crypto.subtle.generateKey({
  name: "RSA-OAEP",
  modulusLength: 2048,
  hash: "SHA-256"
}, true, ["encrypt", "decrypt"])

// RSA-PSS for signatures
window.crypto.subtle.generateKey({
  name: "RSA-PSS",
  modulusLength: 2048,
  hash: "SHA-256"
}, true, ["sign", "verify"])

// AES-GCM for message encryption
window.crypto.subtle.generateKey({
  name: "AES-GCM",
  length: 256
}, true, ["encrypt", "decrypt"])
```

### Message Flow

**Sending a Message:**
1. Generate random AES-GCM key (256-bit)
2. Encrypt plaintext with AES-GCM
3. Encrypt AES key with recipient's RSA-OAEP public key
4. Sign plaintext with sender's RSA-PSS private key
5. Send encrypted bundle to server

**Receiving a Message:**
1. Decrypt AES key using recipient's RSA-OAEP private key
2. Decrypt ciphertext using AES-GCM
3. Verify signature using sender's RSA-PSS public key
4. Display verification status (✅/⚠️)

## 🛡️ Security Properties

| Property | Implementation |
|----------|---------------|
| **Confidentiality** | AES-GCM (256-bit) encryption |
| **Authenticity** | RSA-PSS signatures |
| **Integrity** | AES-GCM authenticated encryption + signatures |
| **Non-repudiation** | Digital signatures with RSA-PSS |
| **Forward Secrecy** | ⚠️ Not implemented (educational demo) |
| **Key Exchange** | Hybrid: RSA-OAEP + ephemeral AES keys |

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React + TypeScript
- Vite
- Tailwind CSS
- Web Crypto API
- IndexedDB (via idb library)

**Backend:**
- Lovable Cloud (Supabase)
- PostgreSQL database
- Row Level Security (RLS) policies
- Realtime subscriptions

### Database Schema

**users table:**
- `id`: UUID (auth user id)
- `username`: Unique username
- `rsa_public_key_encryption`: RSA-OAEP public key (base64)
- `rsa_public_key_signature`: RSA-PSS public key (base64)
- `safety_code`: SHA-256 hash of public key
- `created_at`, `last_seen`: Timestamps

**encrypted_messages table:**
- `id`: UUID
- `sender_username`, `recipient_username`: Usernames
- `ciphertext`: AES-GCM encrypted message (base64)
- `aes_nonce`: AES-GCM IV (base64)
- `encrypted_aes_key`: RSA-OAEP encrypted AES key (base64)
- `signature`: RSA-PSS signature (base64)
- `timestamp`: Message timestamp
- `expires_at`: Optional expiration timestamp

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Modern browser with Web Crypto API support

### Installation

```bash
# Clone the repository
git clone <your-repo-url>

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage

1. **Sign Up**: Create an account with email and password
   - RSA keys are automatically generated
   - Your username becomes your identity

2. **Select a Contact**: Choose a user from the contact list
   - View their safety code
   - Compare safety codes via another channel for security

3. **Send Messages**: Type and send encrypted messages
   - Optionally set auto-delete timer
   - Messages are encrypted before leaving your device

4. **Verify Messages**: Check verification badges on received messages
   - ✅ = Valid signature from claimed sender
   - ⚠️ = Signature verification failed

## 📚 Educational Value

This project demonstrates:

1. **Asymmetric Cryptography**: RSA key pairs, encryption, and signatures
2. **Symmetric Cryptography**: AES-GCM authenticated encryption
3. **Hybrid Encryption**: Combining asymmetric and symmetric crypto
4. **Digital Signatures**: Non-repudiation and message authentication
5. **Key Management**: Safe handling of public and private keys
6. **Hashing**: SHA-256 for safety codes
7. **Secure Storage**: Encrypted local data persistence

## ⚠️ Important Disclaimers

**This is an educational project, not production-grade software:**

- ❌ No forward secrecy
- ❌ No key rotation
- ❌ No secure key backup/recovery
- ❌ No protection against device compromise
- ❌ Simplified threat model
- ❌ Not audited by security professionals

**For production messaging, use:**
- Signal Protocol
- Matrix with Olm/Megolm
- Other well-audited E2EE protocols

## 🎓 Learning Resources

- [Web Crypto API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Signal Protocol](https://signal.org/docs/)
- [RSA-OAEP Specification](https://datatracker.ietf.org/doc/html/rfc3447)
- [AES-GCM](https://csrc.nist.gov/publications/detail/sp/800-38d/final)
- [Cryptographic Best Practices](https://www.keylength.com/)

## 🤝 Contributing

This is an educational project. Contributions that enhance the learning experience are welcome:

- Additional cryptographic features
- Better documentation
- Security explanations
- UI/UX improvements

## 📄 License

This project is open source and available for educational purposes.

## 🙏 Acknowledgments

Built as a final project for CNIT 370 - Applied Cryptography

---

**Remember**: Real-world secure messaging is complex. This project simplifies many aspects for educational purposes. Always use established, audited protocols for sensitive communications.
