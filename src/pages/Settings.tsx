import { useAuth } from '@/contexts/AuthContext';
import { User, Shield, Key, Trash2, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { clearAllData } from '@/lib/indexeddb';

export default function Settings() {
  const { username, user } = useAuth();

  const handleClearData = async () => {
    if (confirm('Delete all local data including encryption keys?')) {
      await clearAllData();
      toast.success('Local data cleared');
    }
  };

  const handleCopy = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      toast.success('Copied');
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-8">Settings</h1>

        {/* Profile */}
        <div className="p-5 rounded-xl bg-card border border-border mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{username}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground">User ID</p>
              <p className="text-xs font-mono">{user?.id?.slice(0, 24)}...</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Security */}
        <div className="p-5 rounded-xl bg-card border border-border mb-4">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Security Status
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Encryption Keys</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-verified">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">E2E Encryption</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-verified">
                <CheckCircle2 className="w-3 h-3" />
                Enabled
              </div>
            </div>
          </div>
        </div>

        {/* Danger */}
        <div className="p-5 rounded-xl bg-destructive/5 border border-destructive/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-destructive">Clear Local Data</p>
              <p className="text-xs text-muted-foreground">Delete keys and cached data</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={handleClearData}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          BoilerChat v1.0
        </p>
      </div>
    </div>
  );
}
