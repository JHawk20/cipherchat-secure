import { CheckCircle2, AlertTriangle, Clock, Shield } from 'lucide-react';
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
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTimeRemaining = (expiryDate: Date) => {
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) return `${minutes}m`;
    if (seconds > 0) return `${seconds}s`;
    return 'Expired';
  };

  return (
    <div
      className={cn(
        "flex gap-2 max-w-[75%] message-in",
        isSent ? "ml-auto" : "mr-auto"
      )}
    >
      <div
        className={cn(
          "relative rounded-2xl px-4 py-3 shadow-lg",
          "transition-all duration-200 hover:shadow-xl",
          isSent 
            ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-br-md" 
            : "glass rounded-bl-md"
        )}
      >
        {/* Encryption indicator for received messages */}
        {!isSent && (
          <div className="absolute -left-1 -top-1">
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center",
              verified 
                ? "bg-verified/20 text-verified" 
                : "bg-unverified/20 text-unverified"
            )}>
              <Shield className="w-3 h-3" />
            </div>
          </div>
        )}

        {/* Message text */}
        <p className={cn(
          "text-sm leading-relaxed break-words",
          !isSent && "mt-1"
        )}>
          {message}
        </p>
        
        {/* Footer */}
        <div className={cn(
          "flex items-center gap-2 mt-2 text-[10px]",
          isSent ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          <span className="font-medium">
            {formatTime(timestamp)}
          </span>
          
          {/* Verification status for received messages */}
          {!isSent && (
            <>
              <span className="opacity-50">·</span>
              {verified ? (
                <div className="flex items-center gap-1 text-verified">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="font-semibold">Verified</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-unverified">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="font-semibold">Unverified</span>
                </div>
              )}
            </>
          )}

          {/* Sent indicator */}
          {isSent && (
            <>
              <span className="opacity-50">·</span>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Encrypted</span>
              </div>
            </>
          )}
          
          {/* Expiry timer */}
          {expiresAt && (
            <>
              <span className="opacity-50">·</span>
              <div className={cn(
                "flex items-center gap-1 font-semibold",
                isSent ? "text-primary-foreground/90" : "text-destructive"
              )}>
                <Clock className="w-3 h-3" />
                <span>{getTimeRemaining(expiresAt)}</span>
              </div>
            </>
          )}
        </div>

        {/* Subtle glow for sent messages */}
        {isSent && (
          <div className="absolute inset-0 rounded-2xl rounded-br-md bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  );
}
