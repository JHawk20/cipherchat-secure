import { Shield, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SafetyCodeProps {
  code: string;
  username: string;
}

export function SafetyCode({ code, username }: SafetyCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl glass border border-primary/20 hover:border-primary/40 transition-colors">
      {/* Icon */}
      <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 glow-subtle">
        <Shield className="w-4 h-4 text-primary" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {username}'s Safety Code
          </p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs glass">
                <p className="text-xs leading-relaxed">
                  Compare this code with <strong>{username}</strong> via another channel (phone, in person) to verify their identity. 
                  This is the SHA-256 hash of their public key.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Code display */}
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono-code text-primary tracking-wide leading-relaxed break-all select-all">
            {code}
          </code>
          
          {/* Copy button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleCopy}
                  className={cn(
                    "p-1.5 rounded-lg transition-all duration-200",
                    "hover:bg-primary/10 active:scale-95",
                    copied && "text-verified"
                  )}
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="glass">
                <p className="text-xs">{copied ? 'Copied!' : 'Copy code'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
