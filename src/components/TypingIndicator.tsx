import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  username: string;
  className?: string;
}

export function TypingIndicator({ username, className }: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        className
      )}
    >
      <div className="flex gap-1">
        <span 
          className="w-2 h-2 rounded-full bg-primary animate-bounce" 
          style={{ animationDelay: '0ms' }}
        />
        <span 
          className="w-2 h-2 rounded-full bg-primary animate-bounce" 
          style={{ animationDelay: '150ms' }}
        />
        <span 
          className="w-2 h-2 rounded-full bg-primary animate-bounce" 
          style={{ animationDelay: '300ms' }}
        />
      </div>
      <span className="text-xs">
        <strong className="text-foreground">{username}</strong> is typing...
      </span>
    </div>
  );
}

