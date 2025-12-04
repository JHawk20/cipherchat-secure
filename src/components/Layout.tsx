import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MessageSquare, 
  Shield, 
  Settings, 
  Info, 
  LogOut, 
  Home,
  Lock,
  Key
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <aside className="w-20 flex-shrink-0 glass-strong border-r border-border/50 flex flex-col">
        {/* Logo */}
        <div className="p-4 flex justify-center">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 glow-subtle">
            <Shield className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col items-center gap-2 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200",
                  "hover:bg-primary/10 group relative",
                  isActive && "bg-primary/15 glow-subtle"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                
                {/* Tooltip */}
                <span className="absolute left-full ml-3 px-2 py-1 rounded-md bg-card text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-border/50">
                  {item.label}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <span className="absolute left-0 w-1 h-6 rounded-r-full bg-primary" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 flex flex-col items-center gap-3 border-t border-border/50">
          {/* User avatar */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
            {username?.slice(0, 2).toUpperCase() || '??'}
          </div>
          
          {/* Sign out button */}
          <button
            onClick={handleSignOut}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

