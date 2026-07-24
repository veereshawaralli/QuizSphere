// Reset Password page - allows users to set a new password
// Accessed via email link after requesting password reset

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authErrorMessage, supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Lock } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if this is a valid password reset session
  useEffect(() => {
    const hashFragment = window.location.hash;
    if (!hashFragment || !hashFragment.includes('type=recovery')) {
      toast({
        title: 'Invalid reset link',
        description: 'Please request a new password reset link.',
        variant: 'destructive',
      });
      navigate('/login');
    }
  }, [navigate, toast]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast({
        title: 'Password updated!',
        description: 'Your password has been successfully reset.',
      });

      // Redirect to dashboard after successful password reset
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: authErrorMessage(error, 'Failed to reset password.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 items-center justify-center bg-secondary/50 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Lock className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="font-heading text-xl">
              Set New Password
            </CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating Password...' : 'Update Password'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign In
              </button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}