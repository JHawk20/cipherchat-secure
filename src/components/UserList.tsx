import { User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
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

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

function isUserOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_THRESHOLD_MS;
}

function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return '';
  const diff = Date.now() - new Date(lastSeen).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function UserList({ users, currentUser, selectedUser, onSelectUser }: UserListProps) {
  const otherUsers = users.filter(u => u.username !== currentUser);

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold">Contacts</h2>
        <p className="text-xs text-muted-foreground">
          {otherUsers.filter(u => isUserOnline(u.last_seen)).length} online
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {otherUsers.length === 0 ? (
            <div className="text-center py-12 px-4">
              <User className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No contacts yet</p>
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
                    "w-full p-3 rounded-lg text-left transition-colors mb-1",
                    isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                        {user.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card",
                        online ? "bg-verified" : "bg-muted-foreground/30"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.username}</p>
                      <p className="text-xs text-muted-foreground">
                        {online ? 'Online' : formatLastSeen(user.last_seen)}
                      </p>
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
