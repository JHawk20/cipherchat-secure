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

export function UserList({ users, currentUser, selectedUser, onSelectUser }: UserListProps) {
  const otherUsers = users.filter(u => u.username !== currentUser);

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Contacts
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {otherUsers.filter(u => isUserOnline(u.last_seen)).length} online, {otherUsers.length} total
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {otherUsers.length === 0 ? (
            <div className="text-center py-8 px-4">
              <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                No other users online yet
              </p>
            </div>
          ) : (
            otherUsers.map((user) => {
              const online = isUserOnline(user.last_seen);
              return (
                <button
                  key={user.username}
                  onClick={() => onSelectUser(user.username)}
                  className={cn(
                    "w-full p-3 rounded-lg text-left transition-all duration-200",
                    "hover:bg-muted/50 group",
                    selectedUser === user.username && "bg-primary/10 border border-primary/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <Circle 
                        className={cn(
                          "absolute bottom-0 right-0 w-3 h-3",
                          online 
                            ? "text-verified fill-verified" 
                            : "text-muted-foreground fill-muted-foreground"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {user.username}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {online ? 'Online' : formatLastSeen(user.last_seen)}
                        </span>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-xs text-muted-foreground truncate font-mono-code cursor-help">
                              {user.safety_code.substring(0, 19)}...
                            </p>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-xs">
                            <p className="text-xs font-mono-code break-all">{user.safety_code}</p>
                            <p className="text-xs text-muted-foreground mt-1">Click user to see full safety code</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
