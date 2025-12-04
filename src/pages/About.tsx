import { Shield, Lock, Key, Fingerprint, Hash, ArrowRight } from 'lucide-react';

export default function About() {
  const steps = [
    { num: '01', title: 'Key Generation', desc: 'RSA-2048 key pairs created locally', icon: Key },
    { num: '02', title: 'Message Encryption', desc: 'AES-256-GCM with fresh keys', icon: Lock },
    { num: '03', title: 'Digital Signature', desc: 'RSA-PSS proves authenticity', icon: Fingerprint },
    { num: '04', title: 'Verification', desc: 'Recipient decrypts & verifies', icon: Shield },
  ];

  const algorithms = [
    { name: 'RSA-OAEP', bits: '2048', use: 'Key encryption' },
    { name: 'RSA-PSS', bits: '2048', use: 'Signatures' },
    { name: 'AES-GCM', bits: '256', use: 'Message encryption' },
    { name: 'SHA-256', bits: '256', use: 'Safety codes' },
  ];

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto p-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-2xl font-bold mb-2">How It Works</h1>
          <p className="text-muted-foreground">End-to-end encryption flow</p>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-12">
          {steps.map((step, i) => (
            <div key={step.num} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <step.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary">{step.num}</span>
                  <span className="font-semibold">{step.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
              {i < steps.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Algorithms */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold mb-4">Algorithms</h2>
          <div className="grid grid-cols-2 gap-3">
            {algorithms.map((algo) => (
              <div key={algo.name} className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{algo.name}</span>
                  <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{algo.bits}-bit</span>
                </div>
                <p className="text-xs text-muted-foreground">{algo.use}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Security Guarantees
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Confidentiality</p>
              <p className="text-muted-foreground text-xs">Only recipients can read messages</p>
            </div>
            <div>
              <p className="font-medium">Integrity</p>
              <p className="text-muted-foreground text-xs">Tampering is detected</p>
            </div>
            <div>
              <p className="font-medium">Authenticity</p>
              <p className="text-muted-foreground text-xs">Signatures prove identity</p>
            </div>
            <div>
              <p className="font-medium">Forward Secrecy</p>
              <p className="text-muted-foreground text-xs">Unique key per message</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
