import { Shield, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SafetyCodeProps {
  code: string;
  username: string;
}

export function SafetyCode({ code, username }: SafetyCodeProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-primary/20">
      <Shield className="w-5 h-5 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs font-medium text-muted-foreground">
            {username}'s Safety Code
          </p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3 h-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Compare this code with {username} via another channel to verify their identity.
                  This is the SHA-256 hash of their public key.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <code className="text-xs font-mono-code text-primary tracking-wide block">
          {code}
        </code>
      </div>
    </div>
  );
}
