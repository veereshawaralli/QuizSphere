// Dashboard - shows role-specific content

import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BookOpen, Trophy, FileText, LogOut, Shield, User } from 'lucide-react';

export default function Dashboard() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-4 py-8">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-heading text-2xl font-bold">
                Welcome, {user.user_metadata?.full_name || user.email}
              </h1>
              <p className="text-muted-foreground">
                Role: <span className="font-medium capitalize">{role || 'unassigned'}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                My Profile
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link to="/quizzes">
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <BookOpen className="h-5 w-5 text-accent" />
                  </div>
                  <CardTitle className="text-lg">Quizzes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {role === 'faculty' || role === 'admin'
                      ? 'Create and manage quizzes for students.'
                      : 'View available quizzes and start attempting them.'}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/results">
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <Trophy className="h-5 w-5 text-accent" />
                  </div>
                  <CardTitle className="text-lg">Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {role === 'faculty' || role === 'admin'
                      ? 'View student scores and performance analytics.'
                      : 'Check your quiz scores, answers, and leaderboard position.'}
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to="/materials">
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                    <FileText className="h-5 w-5 text-accent" />
                  </div>
                  <CardTitle className="text-lg">Study Materials</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {role === 'faculty' || role === 'admin'
                      ? 'Upload notes, PDFs, and other learning resources.'
                      : 'Access study materials shared by your faculty.'}
                  </p>
                </CardContent>
              </Card>
            </Link>

            {role === 'admin' && (
              <Link to="/admin">
                <Card className="cursor-pointer transition-shadow hover:shadow-md border-primary/30">
                  <CardHeader>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Admin Panel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Manage user roles – promote students to faculty.
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
