import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MessageSquare, 
  Shield, 
  Lock, 
  Key, 
  Fingerprint,
  ArrowRight,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Home() {
  const { username } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: Lock,
      title: 'RSA-2048 Encryption',
      description: 'Asymmetric encryption for secure key exchange',
      color: 'from-cyan-400 to-blue-500',
    },
    {
      icon: Key,
      title: 'AES-256-GCM',
      description: 'Military-grade symmetric encryption for messages',
      color: 'from-purple-400 to-pink-500',
    },
    {
      icon: Fingerprint,
      title: 'Digital Signatures',
      description: 'RSA-PSS signatures verify message authenticity',
      color: 'from-green-400 to-cyan-500',
    },
    {
      icon: Shield,
      title: 'End-to-End Security',
      description: 'Private keys never leave your device',
      color: 'from-orange-400 to-red-500',
    },
  ];

  const stats = [
    { label: 'Key Size', value: '2048-bit', icon: Key },
    { label: 'Encryption', value: 'AES-256', icon: Lock },
    { label: 'Hash', value: 'SHA-256', icon: Fingerprint },
  ];

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Secure Messaging
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome back, <span className="gradient-text">{username}</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Your messages are protected with military-grade encryption. 
            Start a secure conversation or learn more about how CipherChat keeps you safe.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="btn-cyber glow-cyber rounded-xl h-12 px-8"
              onClick={() => navigate('/chat')}
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Start Chatting
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="rounded-xl h-12 px-8 border-border/50 hover:bg-muted/50"
              onClick={() => navigate('/about')}
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mb-12">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <stat.icon className="w-4 h-4 text-primary" />
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={cn(
                "p-6 rounded-2xl glass border border-border/50 hover:border-primary/30 transition-all duration-300",
                "group cursor-default"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4",
                "group-hover:scale-110 transition-transform duration-300",
                feature.color
              )}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Security Checklist */}
        <div className="glass rounded-2xl p-6 border border-border/50">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Your Security Status
          </h2>
          
          <div className="space-y-3">
            {[
              'RSA key pair generated locally',
              'Private keys stored in browser only',
              'Messages encrypted end-to-end',
              'Digital signatures enabled',
              'Safety codes available for verification',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-verified/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-verified" />
                </div>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

