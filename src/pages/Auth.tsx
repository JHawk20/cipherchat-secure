import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PurdueLogo } from '@/components/PurdueLogo';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const MIN_PASSWORD_LENGTH = 8;

function validateUsername(username: string) {
  if (!username.trim()) return { isValid: false, message: 'Required' };
  if (username.length < 3) return { isValid: false, message: 'Min 3 characters' };
  if (username.length > 20) return { isValid: false, message: 'Max 20 characters' };
  if (!USERNAME_REGEX.test(username)) return { isValid: false, message: 'Letters, numbers, underscores only' };
  return { isValid: true, message: '' };
}

function validatePassword(password: string) {
  if (!password) return { isValid: false, message: 'Required' };
  if (password.length < MIN_PASSWORD_LENGTH) return { isValid: false, message: `Min ${MIN_PASSWORD_LENGTH} characters` };
  if (!/[A-Z]/.test(password)) return { isValid: false, message: 'Need uppercase' };
  if (!/[a-z]/.test(password)) return { isValid: false, message: 'Need lowercase' };
  if (!/[0-9]/.test(password)) return { isValid: false, message: 'Need number' };
  return { isValid: true, message: '' };
}

function validateEmail(email: string) {
  if (!email.trim()) return { isValid: false, message: 'Required' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { isValid: false, message: 'Invalid email' };
  return { isValid: true, message: '' };
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false, username: false });
  const { signUp, signIn, user } = useAuth();
  const navigate = useNavigate();

  const emailValidation = useMemo(() => validateEmail(email), [email]);
  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const usernameValidation = useMemo(() => validateUsername(username), [username]);

  const isFormValid = useMemo(() => {
    if (isLogin) return emailValidation.isValid && password.length > 0;
    return emailValidation.isValid && passwordValidation.isValid && usernameValidation.isValid;
  }, [isLogin, emailValidation.isValid, passwordValidation.isValid, usernameValidation.isValid, password]);

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true, username: true });
    if (!isFormValid) return;

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) toast.error(error.message);
        else toast.success('Welcome back!');
      } else {
        const { error } = await signUp(email, password, username.trim());
        if (error) toast.error(error.message);
        else toast.success('Account created!');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <PurdueLogo size="lg" />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">BoilerChat</h1>
          <p className="text-sm text-muted-foreground mt-1">Secure encrypted messaging</p>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 p-1 bg-muted rounded-lg">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              isLogin ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              !isLogin ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <Label htmlFor="username" className="text-xs">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, username: true }))}
                placeholder="username"
                className="mt-1"
              />
              {touched.username && !usernameValidation.isValid && username && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {usernameValidation.message}
                </p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="email" className="text-xs">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              placeholder="you@purdue.edu"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-xs">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, password: true }))}
              placeholder="••••••••"
              className="mt-1"
            />
            {!isLogin && touched.password && password && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${passwordValidation.isValid ? 'text-verified' : 'text-destructive'}`}>
                {passwordValidation.isValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {passwordValidation.isValid ? 'Strong password' : passwordValidation.message}
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full btn-gold text-primary-foreground"
            disabled={loading || (!isLogin && !isFormValid)}
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        {/* Security note */}
        <div className="mt-6 p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-primary mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Your encryption keys are generated locally. Private keys never leave your device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
