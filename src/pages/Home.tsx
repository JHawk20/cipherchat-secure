import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Shield, Lock, Key, Fingerprint, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PurdueLogo } from '@/components/PurdueLogo';

export default function Home() {
  const { username } = useAuth();
  const navigate = useNavigate();

  const features = [
    { icon: Lock, title: 'RSA-2048', desc: 'Asymmetric key encryption' },
    { icon: Key, title: 'AES-256', desc: 'Symmetric message encryption' },
    { icon: Fingerprint, title: 'RSA-PSS', desc: 'Digital signatures' },
    { icon: Shield, title: 'SHA-256', desc: 'Safety code verification' },
  ];

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <PurdueLogo size="lg" />
          </div>
          
          <h1 className="text-4xl font-bold mb-3">
            Welcome, <span className="text-primary">{username}</span>
          </h1>
          <p className="text-muted-foreground">
            End-to-end encrypted messaging
          </p>
        </div>

        {/* Action */}
        <div className="flex justify-center mb-12">
          <Button 
            size="lg" 
            className="btn-gold text-primary-foreground h-12 px-8 rounded-xl"
            onClick={() => navigate('/chat')}
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Start Chatting
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="p-4 rounded-xl bg-card border border-border text-center">
              <f.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-semibold">{f.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
