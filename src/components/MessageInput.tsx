import { useState } from 'react';
import { Send, Clock, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSend: (message: string, expiryMinutes: number | null) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, onTyping, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [expiryMinutes, setExpiryMinutes] = useState<number | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (onTyping) {
      onTyping(e.target.value.length > 0);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onTyping) {
      onTyping(false);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim(), expiryMinutes);
      setMessage('');
      if (onTyping) {
        onTyping(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 glass-strong border-t border-border/50">
      {/* Expiry selector row */}
      <div className="flex items-center gap-3 mb-3">
        <Select 
          value={expiryMinutes?.toString() || 'none'} 
          onValueChange={(v) => setExpiryMinutes(v === 'none' ? null : parseFloat(v))}
        >
          <SelectTrigger className="w-[160px] h-8 text-xs border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors">
            <Clock className="w-3 h-3 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="No auto-delete" />
          </SelectTrigger>
          <SelectContent className="glass">
            <SelectItem value="none">No auto-delete</SelectItem>
            <SelectItem value="0.5">30 seconds</SelectItem>
            <SelectItem value="5">5 minutes</SelectItem>
            <SelectItem value="60">1 hour</SelectItem>
            <SelectItem value="1440">24 hours</SelectItem>
          </SelectContent>
        </Select>
        
        {expiryMinutes && (
          <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded-full">
            <Clock className="w-3 h-3" />
            <span className="font-medium">
              Expires in {expiryMinutes < 1 ? '30s' : 
                expiryMinutes < 60 ? `${expiryMinutes}m` : 
                `${Math.floor(expiryMinutes / 60)}h`}
            </span>
          </div>
        )}

        {/* Encryption indicator */}
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Lock className="w-3 h-3 text-primary" />
          <span>End-to-end encrypted</span>
        </div>
      </div>

      {/* Input row */}
      <div className="flex gap-3 items-center">
        <div className={cn(
          "flex-1 relative rounded-xl transition-all duration-300",
          isFocused && "glow-subtle"
        )}>
          <Input
            value={message}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder="Type an encrypted message..."
            disabled={disabled}
            className={cn(
              "h-11 px-4 rounded-xl border-border/50 bg-muted/30",
              "placeholder:text-muted-foreground/50",
              "focus:border-primary/50 focus:bg-muted/50",
              "transition-all duration-200"
            )}
          />
        </div>
        
        <Button 
          type="submit" 
          size="icon"
          disabled={!message.trim() || disabled}
          className={cn(
            "h-11 w-11 rounded-xl btn-cyber",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all duration-200",
            message.trim() && "glow-cyber"
          )}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}
