import { cn } from '@/lib/utils';

interface PurdueLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PurdueLogo({ className, size = 'md' }: PurdueLogoProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  return (
    <div className={cn(
      "rounded-xl bg-primary flex items-center justify-center font-black text-primary-foreground",
      sizes[size],
      className
    )}>
      <span className={cn(
        "tracking-tight",
        size === 'sm' && 'text-lg',
        size === 'md' && 'text-xl',
        size === 'lg' && 'text-2xl',
      )}>
        P
      </span>
    </div>
  );
}

