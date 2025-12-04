import { useState } from 'react';
import { Send, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MessageInputProps {
  onSend: (message: string, expiryMinutes: number | null) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, onTyping, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [expiryMinutes, setExpiryMinutes] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    // Broadcast typing status when user types
    if (onTyping) {
      onTyping(e.target.value.length > 0);
    }
  };

  const handleBlur = () => {
    // Stop typing indicator when input loses focus
    if (onTyping) {
      onTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim(), expiryMinutes);
      setMessage('');
      // Stop typing indicator when message is sent
      if (onTyping) {
        onTyping(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-card border-t border-border">
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Select 
              value={expiryMinutes?.toString() || 'none'} 
              onValueChange={(v) => setExpiryMinutes(v === 'none' ? null : parseInt(v))}
            >
              <SelectTrigger className="w-[180px] h-8 text-xs border-primary/30">
                <Clock className="w-3 h-3 mr-1" />
                <SelectValue placeholder="No auto-delete" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No auto-delete</SelectItem>
                <SelectItem value="0.5">30 seconds</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="1440">24 hours</SelectItem>
              </SelectContent>
            </Select>
            {expiryMinutes && (
              <span className="text-xs text-muted-foreground">
                Message expires in {expiryMinutes < 1 ? '30s' : 
                  expiryMinutes < 60 ? `${expiryMinutes}m` : 
                  `${Math.floor(expiryMinutes / 60)}h`}
              </span>
            )}
          </div>
          
          <Input
            value={message}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Type an encrypted message..."
            disabled={disabled}
            className="border-primary/30 focus:border-primary"
          />
        </div>
        
        <Button 
          type="submit" 
          size="icon"
          disabled={!message.trim() || disabled}
          className="gradient-cyber glow-cyber h-10 w-10"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}
