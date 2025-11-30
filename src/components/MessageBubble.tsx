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
        "flex gap-2 max-w-[80%] animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        isSent ? "ml-auto" : "mr-auto"
      )}
    >
      <div
        className={cn(
          "rounded-2xl px-4 py-3 relative",
          isSent 
            ? "bg-primary text-primary-foreground ml-auto rounded-br-sm" 
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        <p className="text-sm leading-relaxed break-words">
          {message}
        </p>
        
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs opacity-70">
            {formatTime(timestamp)}
          </span>
          
          {!isSent && (
            <div className="flex items-center gap-1">
              {verified ? (
                <div className="flex items-center gap-1 text-verified">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="text-xs font-medium">Verified</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-unverified">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="text-xs font-medium">Unverified</span>
                </div>
              )}
            </div>
          )}
          
          {expiresAt && (
            <div className="flex items-center gap-1 text-xs opacity-70">
              <Clock className="w-3 h-3" />
              <span>{getTimeRemaining(expiresAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
