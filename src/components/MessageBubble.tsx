import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: string;
  isSent: boolean;
  verified: boolean;
  timestamp: Date;
  expiresAt?: Date;
}

export function MessageBubble({ message, isSent, verified, timestamp, expiresAt }: MessageBubbleProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeRemaining = (exp: Date) => {
    const diff = exp.getTime() - Date.now();
    const mins = Math.floor(diff / 60000);
    if (mins > 0) return `${mins}m`;
    const secs = Math.floor((diff % 60000) / 1000);
    return secs > 0 ? `${secs}s` : 'Expired';
  };

  return (
    <div className={cn("flex max-w-[75%] message-in", isSent ? "ml-auto" : "mr-auto")}>
      <div className={cn(
        "rounded-2xl px-4 py-2.5",
        isSent 
          ? "bg-primary text-primary-foreground rounded-br-md" 
          : "bg-card border border-border rounded-bl-md"
      )}>
        <p className="text-sm">{message}</p>
        
        <div className={cn(
          "flex items-center gap-2 mt-1.5 text-[10px]",
          isSent ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          <span>{formatTime(timestamp)}</span>
          
          {!isSent && (
            <>
              <span>·</span>
              {verified ? (
                <span className="flex items-center gap-0.5 text-verified">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-unverified">
                  <AlertTriangle className="w-3 h-3" />
                  Unverified
                </span>
              )}
            </>
          )}
          
          {expiresAt && (
            <>
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {getTimeRemaining(expiresAt)}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
