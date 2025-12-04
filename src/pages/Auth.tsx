import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

// Validation rules
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const MIN_PASSWORD_LENGTH = 8;

interface ValidationResult {
  isValid: boolean;
  message: string;
}

function validateUsername(username: string): ValidationResult {
  if (!username.trim()) {
    return { isValid: false, message: 'Username is required' };
  }
  if (username.length < 3) {
    return { isValid: false, message: 'Username must be at least 3 characters' };
  }
  if (username.length > 20) {
    return { isValid: false, message: 'Username must be 20 characters or less' };
  }
  if (!USERNAME_REGEX.test(username)) {
    return { isValid: false, message: 'Username can only contain letters, numbers, and underscores' };
  }
  return { isValid: true, message: 'Username is valid' };
}

function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { isValid: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  return { isValid: true, message: 'Password is strong' };
}

function validateEmail(email: string): ValidationResult {
  if (!email.trim()) {
    return { isValid: false, message: 'Email is required' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  return { isValid: true, message: 'Email is valid' };
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

  // Validation states
  const emailValidation = useMemo(() => validateEmail(email), [email]);
  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const usernameValidation = useMemo(() => validateUsername(username), [username]);

  const isFormValid = useMemo(() => {
    if (isLogin) {
      return emailValidation.isValid && password.length > 0;
    }
    return emailValidation.isValid && passwordValidation.isValid && usernameValidation.isValid;
  }, [isLogin, emailValidation.isValid, passwordValidation.isValid, usernameValidation.isValid, password]);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({ email: true, password: true, username: true });

    if (!isFormValid) {
      if (!emailValidation.isValid) {
        toast.error(emailValidation.message);
      } else if (!isLogin && !usernameValidation.isValid) {
        toast.error(usernameValidation.message);
      } else if (!isLogin && !passwordValidation.isValid) {
        toast.error(passwordValidation.message);
      }
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Welcome back!');
        }
      } else {
        const { error } = await signUp(email, password, username.trim());
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Account created! Setting up encryption...');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-strong border-border/50 shadow-2xl">
        <CardHeader className="space-y-6 text-center pb-2">
          {/* Logo */}
          <div className="mx-auto">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center glow-cyber">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-verified flex items-center justify-center">
                <Lock className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
          
          {/* Title */}
          <div>
            <CardTitle className="text-3xl font-bold gradient-text">
              CipherChat
            </CardTitle>
            <CardDescription className="text-sm mt-3 leading-relaxed">
              Secure messaging with <span className="text-primary font-medium">RSA-2048</span> and <span className="text-accent font-medium">AES-256</span> encryption
            </CardDescription>
          </div>

          {/* Tab switcher */}
          <div className="flex p-1 bg-muted/30 rounded-xl">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                isLogin 
                  ? 'bg-primary text-primary-foreground shadow-lg' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                !isLogin 
                  ? 'bg-primary text-primary-foreground shadow-lg' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign Up
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Choose a username (3-20 chars)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, username: true }))}
                  className={`border-primary/30 focus:border-primary ${
                    touched.username && !usernameValidation.isValid ? 'border-destructive' : ''
                  }`}
                />
                {touched.username && username && (
                  <p className={`text-xs flex items-center gap-1 ${
                    usernameValidation.isValid ? 'text-verified' : 'text-destructive'
                  }`}>
                    {usernameValidation.isValid ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {usernameValidation.message}
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, email: true }))}
                className={`border-primary/30 focus:border-primary ${
                  touched.email && !emailValidation.isValid ? 'border-destructive' : ''
                }`}
              />
              {touched.email && email && !emailValidation.isValid && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {emailValidation.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, password: true }))}
                className={`border-primary/30 focus:border-primary ${
                  touched.password && !isLogin && !passwordValidation.isValid ? 'border-destructive' : ''
                }`}
              />
              {!isLogin && touched.password && password && (
                <p className={`text-xs flex items-center gap-1 ${
                  passwordValidation.isValid ? 'text-verified' : 'text-destructive'
                }`}>
                  {passwordValidation.isValid ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  {passwordValidation.message}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 btn-cyber text-primary-foreground font-semibold rounded-xl glow-cyber"
              disabled={loading || (!isLogin && !isFormValid)}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isLogin ? 'Signing in...' : 'Creating keys...'}
                </span>
              ) : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {/* Security info */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground mb-1">Your keys, your control</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  RSA keys are generated locally and stored only on your device. 
                  Private keys never leave your browser.
                </p>
              </div>
            </div>
          </div>

          {/* Encryption badges */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/30 text-[10px] text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-verified" />
              RSA-2048
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/30 text-[10px] text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              AES-256-GCM
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/30 text-[10px] text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              SHA-256
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
