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
    onTyping?.(e.target.value.length > 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim(), expiryMinutes);
      setMessage('');
      onTyping?.(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-card border-t border-border">
      <div className="flex items-center gap-2 mb-2">
        <Select 
          value={expiryMinutes?.toString() || 'none'} 
          onValueChange={(v) => setExpiryMinutes(v === 'none' ? null : parseFloat(v))}
        >
          <SelectTrigger className="w-32 h-7 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No expiry</SelectItem>
            <SelectItem value="0.5">30s</SelectItem>
            <SelectItem value="5">5m</SelectItem>
            <SelectItem value="60">1h</SelectItem>
          </SelectContent>
        </Select>
        {expiryMinutes && (
          <span className="text-xs text-muted-foreground">
            Expires in {expiryMinutes < 1 ? '30s' : `${expiryMinutes}m`}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={message}
          onChange={handleChange}
          onBlur={() => onTyping?.(false)}
          placeholder="Message..."
          disabled={disabled}
          className="flex-1"
        />
        <Button 
          type="submit" 
          size="icon"
          disabled={!message.trim() || disabled}
          className="btn-gold text-primary-foreground"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}
