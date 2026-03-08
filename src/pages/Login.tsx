// Login page for CSD Quiz Portal
// Handles both sign in and sign up with email/password
// Faculty can sign up with a secret code

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
import { GraduationCap, ShieldCheck } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export default function Login() {
  const { user, loading: authLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isFaculty, setIsFaculty] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [facultyCode, setFacultyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect already logged-in users to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  // Handle form submission for login or signup
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up new user
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) throw error;

        // Store faculty intent so we can assign role after email verification
        if (isFaculty && facultyCode) {
          localStorage.setItem('pending_faculty_code', facultyCode);
        }

        toast({
          title: 'Account created!',
          description: 'Check your email to verify your account.',
        });
      } else {
        // Sign in existing user
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Check if there's a pending faculty code to apply
        const pendingCode = localStorage.getItem('pending_faculty_code');
        if (pendingCode) {
          localStorage.removeItem('pending_faculty_code');
          const { data: fnData, error: fnError } = await supabase.functions.invoke('assign-faculty-role', {
            body: { secret_code: pendingCode },
          });

          if (fnError || fnData?.error) {
            toast({
              title: 'Warning',
              description: fnData?.error || 'Could not verify faculty code. You are registered as a student.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Faculty role assigned!',
              description: 'Welcome, faculty member!',
            });
          }
        }

        // Redirect to dashboard after login
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
              {isSignUp ? 'Create Account' : 'Sign In'}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? 'Register for the CSD Quiz Portal'
                : `Welcome back${roleHint ? `, ${roleHint}` : ''}! Sign in to continue.`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Only show signup fields */}
              {isSignUp && (
                <>
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

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="faculty"
                      checked={isFaculty}
                      onCheckedChange={(checked) => setIsFaculty(checked === true)}
                    />
                    <Label htmlFor="faculty" className="text-sm flex items-center gap-1 cursor-pointer">
                      <ShieldCheck className="h-4 w-4" />
                      I am a faculty member
                    </Label>
                  </div>

                  {isFaculty && (
                    <div className="space-y-2">
                      <Label htmlFor="facultyCode">Faculty Secret Code</Label>
                      <Input
                        id="facultyCode"
                        type="password"
                        placeholder="Enter faculty code"
                        value={facultyCode}
                        onChange={(e) => setFacultyCode(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email or USN</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@sharnbasva.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            {/* Toggle between login and signup */}
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
