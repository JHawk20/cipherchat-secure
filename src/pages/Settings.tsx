import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Settings as SettingsIcon, 
  User,
  Shield,
  Key,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle2,
  Copy,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { clearAllData } from '@/lib/indexeddb';
import { cn } from '@/lib/utils';

export default function Settings() {
  const { username, user } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);

  const handleClearData = async () => {
    if (confirm('Are you sure? This will delete all local data including your encryption keys. You will need to regenerate keys on next login.')) {
      await clearAllData();
      toast.success('Local data cleared');
    }
  };

  const handleCopyUserId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      toast.success('User ID copied');
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
              <SettingsIcon className="w-6 h-6 text-primary" />
            </div>
            Settings
          </h1>
          <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
        </div>

        {/* Profile Section */}
        <div className="glass rounded-2xl p-6 border border-border/50 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Profile
          </h2>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
              {username?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{username}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div>
                <p className="text-sm font-medium">User ID</p>
                <p className="text-xs text-muted-foreground font-mono">{user?.id?.slice(0, 20)}...</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCopyUserId}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="glass rounded-2xl p-6 border border-border/50 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Security
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-verified/20 flex items-center justify-center">
                  <Key className="w-4 h-4 text-verified" />
                </div>
                <div>
                  <p className="text-sm font-medium">Encryption Keys</p>
                  <p className="text-xs text-muted-foreground">RSA-2048 key pair active</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-verified text-xs">
                <CheckCircle2 className="w-4 h-4" />
                Active
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">End-to-End Encryption</p>
                  <p className="text-xs text-muted-foreground">All messages are encrypted</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-verified text-xs">
                <CheckCircle2 className="w-4 h-4" />
                Enabled
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="glass rounded-2xl p-6 border border-border/50 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-primary" />
            Preferences
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications" className="text-sm font-medium">Notifications</Label>
                <p className="text-xs text-muted-foreground">Show desktop notifications for new messages</p>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sounds" className="text-sm font-medium">Sound Effects</Label>
                <p className="text-xs text-muted-foreground">Play sounds for message events</p>
              </div>
              <Switch
                id="sounds"
                checked={sounds}
                onCheckedChange={setSounds}
              />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="glass rounded-2xl p-6 border border-destructive/30 bg-destructive/5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Clear Local Data</p>
                <p className="text-xs text-muted-foreground">Delete all locally stored data including keys</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={handleClearData}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Data
              </Button>
            </div>
          </div>
        </div>

        {/* Version info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            CipherChat v1.0.0 · Built with React + Supabase
          </p>
        </div>
      </div>
    </div>
  );
}

