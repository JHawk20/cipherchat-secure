import { useState } from 'react';
import { Shield, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SafetyCodeProps {
  code: string;
  username: string;
}

export function SafetyCode({ code, username }: SafetyCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium">{username}'s Safety Code</span>
      </div>
      <div className="flex items-center justify-between">
        <code className="text-xs font-mono text-muted-foreground break-all">
          {code}
        </code>
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">
        Compare via another channel to verify identity
      </p>
    </div>
  );
}
