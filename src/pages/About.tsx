import { 
  Shield, 
  Lock, 
  Key, 
  Fingerprint,
  ArrowRight,
  CheckCircle2,
  Send,
  Download,
  FileKey,
  Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function About() {
  const encryptionFlow = [
    {
      step: 1,
      title: 'Key Generation',
      description: 'When you sign up, two RSA-2048 key pairs are generated locally in your browser.',
      details: [
        'Encryption key pair (RSA-OAEP)',
        'Signature key pair (RSA-PSS)',
        'Private keys stored in IndexedDB',
        'Public keys uploaded to server',
      ],
      icon: Key,
      color: 'from-cyan-400 to-blue-500',
    },
    {
      step: 2,
      title: 'Message Encryption',
      description: 'Each message uses hybrid encryption combining RSA and AES.',
      details: [
        'Generate random 256-bit AES key',
        'Encrypt message with AES-GCM',
        'Encrypt AES key with recipient\'s RSA public key',
        'Sign message with sender\'s RSA private key',
      ],
      icon: Lock,
      color: 'from-purple-400 to-pink-500',
    },
    {
      step: 3,
      title: 'Secure Transmission',
      description: 'The encrypted payload is sent through the server.',
      details: [
        'Ciphertext (AES-encrypted message)',
        'Encrypted AES key (RSA-encrypted)',
        'Digital signature (RSA-PSS)',
        'Nonce/IV for AES-GCM',
      ],
      icon: Send,
      color: 'from-orange-400 to-red-500',
    },
    {
      step: 4,
      title: 'Decryption & Verification',
      description: 'The recipient decrypts and verifies the message authenticity.',
      details: [
        'Decrypt AES key with private RSA key',
        'Decrypt message with AES key',
        'Verify signature with sender\'s public key',
        'Display verification status',
      ],
      icon: Download,
      color: 'from-green-400 to-cyan-500',
    },
  ];

  const algorithms = [
    {
      name: 'RSA-OAEP',
      purpose: 'Key Encryption',
      keySize: '2048-bit',
      description: 'Optimal Asymmetric Encryption Padding for secure key exchange',
      icon: Key,
    },
    {
      name: 'RSA-PSS',
      purpose: 'Digital Signatures',
      keySize: '2048-bit',
      description: 'Probabilistic Signature Scheme for message authentication',
      icon: Fingerprint,
    },
    {
      name: 'AES-GCM',
      purpose: 'Message Encryption',
      keySize: '256-bit',
      description: 'Galois/Counter Mode for authenticated encryption',
      icon: Lock,
    },
    {
      name: 'SHA-256',
      purpose: 'Safety Codes',
      keySize: '256-bit',
      description: 'Secure hash for public key fingerprints',
      icon: Hash,
    },
  ];

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-6 glow-subtle">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          
          <h1 className="text-3xl font-bold mb-4">How CipherChat Works</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            CipherChat uses state-of-the-art cryptographic algorithms to ensure your messages 
            remain private and tamper-proof. Here's a detailed look at the security architecture.
          </p>
        </div>

        {/* Encryption Flow */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <FileKey className="w-5 h-5 text-primary" />
            Encryption Flow
          </h2>
          
          <div className="space-y-6">
            {encryptionFlow.map((item, index) => (
              <div key={item.step} className="relative">
                {/* Connector line */}
                {index < encryptionFlow.length - 1 && (
                  <div className="absolute left-6 top-16 w-0.5 h-[calc(100%-2rem)] bg-gradient-to-b from-border to-transparent" />
                )}
                
                <div className="flex gap-4">
                  {/* Step indicator */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                    item.color
                  )}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 glass rounded-xl p-5 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        STEP {item.step}
                      </span>
                      <h3 className="font-semibold">{item.title}</h3>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {item.details.map((detail) => (
                        <div key={detail} className="flex items-center gap-2 text-xs">
                          <CheckCircle2 className="w-3 h-3 text-verified flex-shrink-0" />
                          <span className="text-muted-foreground">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Algorithms */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Cryptographic Algorithms
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {algorithms.map((algo) => (
              <div key={algo.name} className="glass rounded-xl p-5 border border-border/50 hover:border-primary/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <algo.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{algo.name}</h3>
                      <span className="text-[10px] font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                        {algo.keySize}
                      </span>
                    </div>
                    <p className="text-xs text-primary mb-1">{algo.purpose}</p>
                    <p className="text-xs text-muted-foreground">{algo.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Guarantees */}
        <div className="glass rounded-2xl p-6 border border-border/50">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Security Guarantees
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: 'Confidentiality',
                description: 'Only the intended recipient can decrypt messages',
              },
              {
                title: 'Integrity',
                description: 'Any tampering with messages is immediately detected',
              },
              {
                title: 'Authenticity',
                description: 'Digital signatures prove message origin',
              },
              {
                title: 'Forward Secrecy',
                description: 'Each message uses a unique AES key',
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-verified/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-verified" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

