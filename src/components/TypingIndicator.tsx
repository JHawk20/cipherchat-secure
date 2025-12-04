import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  username: string;
  className?: string;
}

export function TypingIndicator({ username, className }: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 animate-in fade-in-0 slide-in-from-left-2 duration-300",
        className
      )}
    >
      {/* Animated dots container */}
      <div className="flex items-center gap-1 px-3 py-2 rounded-full glass">
        <span 
          className="w-2 h-2 rounded-full bg-primary typing-dot" 
          style={{ animationDelay: '0ms' }}
        />
        <span 
          className="w-2 h-2 rounded-full bg-primary typing-dot" 
          style={{ animationDelay: '200ms' }}
        />
        <span 
          className="w-2 h-2 rounded-full bg-primary typing-dot" 
          style={{ animationDelay: '400ms' }}
        />
      </div>
      
      {/* Username */}
      <span className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{username}</span>
        {' '}is typing
      </span>
    </div>
  );
}
