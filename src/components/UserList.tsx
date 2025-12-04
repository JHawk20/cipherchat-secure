import { User, Circle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface UserItem {
  username: string;
  safety_code: string;
  last_seen: string;
}

interface UserListProps {
  users: UserItem[];
  currentUser: string;
  selectedUser: string | null;
  onSelectUser: (username: string) => void;
}

// Consider user online if seen in the last 5 minutes
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

function isUserOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  return now.getTime() - lastSeenDate.getTime() < ONLINE_THRESHOLD_MS;
}

function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return 'Never';
  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - lastSeenDate.getTime();
  
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// Generate a gradient based on username
function getAvatarGradient(username: string): string {
  const gradients = [
    'from-cyan-400 to-blue-500',
    'from-purple-400 to-pink-500',
    'from-green-400 to-cyan-500',
    'from-orange-400 to-red-500',
    'from-pink-400 to-purple-500',
    'from-blue-400 to-indigo-500',
    'from-teal-400 to-green-500',
    'from-yellow-400 to-orange-500',
  ];
  const index = username.charCodeAt(0) % gradients.length;
  return gradients[index];
}

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

export function UserList({ users, currentUser, selectedUser, onSelectUser }: UserListProps) {
  const otherUsers = users.filter(u => u.username !== currentUser);
  const onlineCount = otherUsers.filter(u => isUserOnline(u.last_seen)).length;

  return (
    <div className="h-full flex flex-col glass-strong">
      {/* Header */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 glow-subtle">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Contacts</h2>
            <p className="text-xs text-muted-foreground">
              <span className="text-verified font-medium">{onlineCount}</span> online · {otherUsers.length} total
            </p>
          </div>
        </div>
      </div>

      {/* User List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {otherUsers.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                No contacts yet
              </p>
              <p className="text-xs text-muted-foreground/70">
                Waiting for others to join...
              </p>
            </div>
          ) : (
            otherUsers.map((user) => {
              const online = isUserOnline(user.last_seen);
              const isSelected = selectedUser === user.username;
              
              return (
                <button
                  key={user.username}
                  onClick={() => onSelectUser(user.username)}
                  className={cn(
                    "w-full p-3 rounded-xl text-left transition-all duration-200 group",
                    "hover:bg-primary/5 hover:border-primary/20",
                    "border border-transparent",
                    isSelected && "bg-primary/10 border-primary/30 glow-subtle"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className={cn(
                        "w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center",
                        "font-semibold text-sm text-white shadow-lg",
                        "transition-transform duration-200 group-hover:scale-105",
                        getAvatarGradient(user.username)
                      )}>
                        {getInitials(user.username)}
                      </div>
                      {/* Online indicator */}
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card",
                        online 
                          ? "bg-verified pulse-online" 
                          : "bg-muted-foreground/50"
                      )} />
                    </div>

                    {/* User info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {user.username}
                        </p>
                        {online && (
                          <span className="text-[10px] font-medium text-verified bg-verified/10 px-1.5 py-0.5 rounded-full">
                            ONLINE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-[11px] text-muted-foreground truncate font-mono-code cursor-help opacity-70 group-hover:opacity-100 transition-opacity">
                                {user.safety_code.substring(0, 16)}...
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-xs glass">
                              <p className="text-xs font-mono-code break-all text-primary">{user.safety_code}</p>
                              <p className="text-[10px] text-muted-foreground mt-1.5">Safety code · Click to verify identity</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {!online && (
                          <span className="text-[10px] text-muted-foreground/70">
                            · {formatLastSeen(user.last_seen)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
