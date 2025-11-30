import { User, Circle } from 'lucide-react';
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
          {otherUsers.length} user{otherUsers.length !== 1 ? 's' : ''} online
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
            otherUsers.map((user) => (
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
                      className="absolute bottom-0 right-0 w-3 h-3 text-verified fill-verified" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {user.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate font-mono-code">
                      {user.safety_code.substring(0, 19)}...
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
