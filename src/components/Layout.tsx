import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Settings, Info, LogOut, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PurdueLogo } from './PurdueLogo';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/about', icon: Info, label: 'About' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function Layout({ children }: LayoutProps) {
  const { username, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <aside className="w-16 flex-shrink-0 bg-card border-r border-border flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center">
          <PurdueLogo size="sm" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col items-center gap-1 py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-colors relative group",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="w-5 h-5" />
                
                {/* Tooltip */}
                <span className="absolute left-full ml-2 px-2 py-1 rounded bg-card border border-border text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-2 flex flex-col items-center gap-2 border-t border-border">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
            {username?.slice(0, 2).toUpperCase()}
          </div>
          <button
            onClick={() => signOut()}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden bg-background">
        {children}
      </main>
    </div>
  );
}
