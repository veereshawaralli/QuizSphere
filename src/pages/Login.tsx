// Editorial split-screen login. Left: brand canvas. Right: form.

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { lovable } from '@/integrations/lovable';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import universityLogo from '@/assets/university-logo.png';

export default function Login() {
  const { user, role, loading: authLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) return;
    if (user && role) navigate('/dashboard');
  }, [user, role, authLoading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (isResetPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({
          title: 'Password reset email sent',
          description: 'Check your inbox for a link to reset your password.',
        });
        setIsResetPassword(false);
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/email-verified`,
          },
        });
        if (error) throw error;
        toast({
          title: 'Account created',
          description: 'Check your email to verify your account.',
        });
      } else {
        let loginEmail = email;
        const isEmail = email.includes('@');

        if (!isEmail) {
          const { data: resolvedEmail, error: usnErr } = await supabase
            .rpc('get_email_by_usn', { _usn: email });
          if (usnErr || !resolvedEmail) {
            throw new Error('No account found with this USN. Please check your USN or use your email to sign in.');
          }
          loginEmail = resolvedEmail;
        }

        const { data: signInData, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });
        if (error) throw error;

        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', signInData.user.id)
          .maybeSingle();
        if (roleError) throw roleError;

        if (!userRole) {
          await supabase.auth.signOut();
          throw new Error('This account has been removed by admin. Please contact admin.');
        }
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const roleHint = searchParams.get('role');
  const title = isResetPassword ? 'Reset password' : isSignUp ? 'Create account' : 'Sign in';

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-12 bg-background">
      {/* Left — brand canvas */}
      <aside className="relative hidden lg:flex lg:col-span-5 ink-gradient grain text-background flex-col justify-between p-10 overflow-hidden">
        <div className="flex items-center justify-between">
          <Link to="/" className="group inline-flex items-center gap-2 eyebrow text-background/70 hover:text-accent">
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to home
          </Link>
          <p className="eyebrow text-background/50">№ 24</p>
        </div>

        <div className="rise rise-2">
          <img src={universityLogo} alt="" className="h-14 w-14 object-contain mb-8 opacity-90 slow-zoom" />
          <h2 className="font-heading text-5xl xl:text-7xl leading-[0.95] text-background">
            Show up. <br />
            <span className="text-accent italic">Sit down.</span> <br />
            Do the work
            <span className="text-accent caret">.</span>
          </h2>
          <p className="mt-8 max-w-sm text-sm leading-relaxed text-background/70">
            The CSD Quiz &amp; Learning Portal — a focused environment for
            assessments and study, used daily by students and faculty of
            Sharnbasva University.
          </p>
        </div>

        <div className="flex items-end justify-between">
          <p className="eyebrow text-background/50 max-w-[14rem]">
            Sharnbasva University · Department of Computer Science &amp; Design
          </p>
          <p className="font-mono text-[11px] text-background/40">v 2.4</p>
        </div>

        {/* Decorative coral stripe */}
        <div className="pointer-events-none absolute -right-20 top-1/3 h-[2px] w-80 bg-accent rotate-[-12deg]" />
        <div className="pointer-events-none absolute right-12 bottom-32 h-12 w-12 rounded-full border border-accent/60" />
      </aside>

      {/* Right — form */}
      <main className="lg:col-span-7 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rise rise-2">
          {/* Mobile back */}
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 eyebrow text-muted-foreground mb-8 hover:text-accent">
            <ArrowLeft className="h-3.5 w-3.5" /> Home
          </Link>

          <p className="eyebrow text-accent">
            {isResetPassword ? '§ Recovery' : isSignUp ? '§ Register' : '§ Welcome back'}
          </p>
          <h1 className="mt-3 font-heading text-5xl md:text-6xl leading-[0.95] text-foreground">
            {title}
            <span className="text-accent">.</span>
          </h1>
          <p className="mt-4 text-sm text-muted-foreground max-w-sm">
            {isResetPassword
              ? 'Enter your email and we’ll send you a link to set a new password.'
              : isSignUp
                ? 'Set up your portal account to begin attempting quizzes and accessing materials.'
                : `Sign in${roleHint ? ` as ${roleHint}` : ''} to continue your work.`}
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            {isSignUp && !isResetPassword && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="eyebrow text-muted-foreground">Full name</Label>
                <Input
                  id="fullName"
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="rounded-none border-0 border-b border-border bg-transparent px-0 text-lg focus-visible:ring-0 focus-visible:border-accent"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="eyebrow text-muted-foreground">
                {isSignUp ? 'Email' : 'Email or USN'}
              </Label>
              <Input
                id="email"
                type={isSignUp ? 'email' : 'text'}
                placeholder={isSignUp ? 'student@sharnbasva.edu' : 'you@sharnbasva.edu  ·  1SH21CS001'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-none border-0 border-b border-border bg-transparent px-0 text-lg focus-visible:ring-0 focus-visible:border-accent"
              />
            </div>

            {!isResetPassword && (
              <div className="space-y-2">
                <Label htmlFor="password" className="eyebrow text-muted-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="rounded-none border-0 border-b border-border bg-transparent px-0 text-lg focus-visible:ring-0 focus-visible:border-accent"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="group mt-4 w-full justify-between gap-3 rounded-none bg-foreground py-6 text-background hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <span className="eyebrow">
                {loading ? 'Please wait' : isResetPassword ? 'Send reset link' : isSignUp ? 'Create account' : 'Sign in'}
              </span>
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>

            {!isSignUp && !isResetPassword && (
              <>
                <div className="flex items-center gap-4 py-2">
                  <span className="h-px flex-1 bg-border" />
                  <span className="eyebrow text-muted-foreground">or</span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-none border-border py-6 hover:bg-foreground hover:text-background hover:border-foreground"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const result = await lovable.auth.signInWithOAuth('google', {
                        redirect_uri: window.location.origin,
                      });
                      if (result.error) throw result.error;
                      if (result.redirected) return;
                      navigate('/dashboard');
                    } catch (err: any) {
                      toast({
                        title: 'Error',
                        description: err.message || 'Google sign-in failed.',
                        variant: 'destructive',
                      });
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <svg className="mr-3 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="eyebrow">Continue with Google</span>
                </Button>
              </>
            )}
          </form>

          <div className="mt-8 flex flex-col gap-3 text-sm">
            {!isResetPassword && !isSignUp && (
              <button
                type="button"
                onClick={() => setIsResetPassword(true)}
                className="link-underline text-left text-muted-foreground hover:text-accent"
              >
                Forgot your password?
              </button>
            )}

            <p className="text-muted-foreground">
              {isResetPassword ? (
                <>
                  Remember it?{' '}
                  <button
                    type="button"
                    onClick={() => setIsResetPassword(false)}
                    className="link-underline font-medium text-foreground hover:text-accent"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="link-underline font-medium text-foreground hover:text-accent"
                  >
                    {isSignUp ? 'Sign in' : 'Sign up'}
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
