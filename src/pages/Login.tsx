// Login page for CSD Quiz Portal
// Handles both sign in and sign up with email/password

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { GraduationCap } from 'lucide-react';
import { lovable } from '@/integrations/lovable/index';

export default function Login() {
  const { user, role, loading: authLoading, signOut } = useAuth();
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

    if (user && role) {
      navigate('/dashboard');
    }
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
          title: 'Password reset email sent!',
          description: 'Check your email for a link to reset your password.',
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
          title: 'Account created!',
          description: 'Check your email to verify your account.',
        });
      } else {
        // Check if input is a USN (not an email)
        let loginEmail = email;
        const isEmail = email.includes('@');

        if (!isEmail) {
          // Look up email by USN
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 items-center justify-center bg-secondary/50 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="font-heading text-xl">
              {isResetPassword ? 'Reset Password' : isSignUp ? 'Create Account' : 'Sign In'}
            </CardTitle>
            <CardDescription>
              {isResetPassword
                ? 'Enter your email to receive a password reset link'
                : isSignUp
                  ? 'Register for the CSD Quiz Portal'
                  : `Welcome back${roleHint ? `, ${roleHint}` : ''}! Sign in to continue.`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && !isResetPassword && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="e.g. Rahul Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">{isSignUp ? 'Email' : 'Email or USN'}</Label>
                <Input
                  id="email"
                  type={isSignUp ? 'email' : 'text'}
                  placeholder={isSignUp ? 'student@sharnbasva.edu' : 'Email or USN (e.g. 1SH21CS001)'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {!isResetPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading 
                  ? 'Please wait...' 
                  : isResetPassword 
                    ? 'Send Reset Link'
                    : isSignUp 
                      ? 'Create Account' 
                      : 'Sign In'}
              </Button>
            </form>

            {!isResetPassword && !isSignUp && (
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => setIsResetPassword(true)}
                  className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            <div className="mt-4 text-center text-sm text-muted-foreground">
              {isResetPassword ? (
                <>
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => setIsResetPassword(false)}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <>
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
