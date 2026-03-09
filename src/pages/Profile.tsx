// Student Profile page - view and edit profile information
// Shows quiz history and performance stats

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { User, Save, Trophy, BookOpen, Percent, ArrowLeft } from 'lucide-react';

interface ProfileData {
  id: string;
  full_name: string;
  usn: string | null;
  department: string | null;
}

interface QuizResult {
  id: string;
  quiz_title: string;
  score: number;
  total_marks: number;
  percentage: number;
  submitted_at: string;
}

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [fullName, setFullName] = useState('');
  const [usn, setUsn] = useState('');
  const [department, setDepartment] = useState('');
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    async function loadProfile() {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || '');
        setUsn(profileData.usn || '');
        setDepartment(profileData.department || '');
      }

      // Fetch quiz results
      const { data: submissions } = await supabase
        .from('quiz_submissions')
        .select(`
          id,
          score,
          total_marks,
          submitted_at,
          quiz:quizzes(title)
        `)
        .eq('student_id', user!.id)
        .eq('is_submitted', true)
        .order('submitted_at', { ascending: false });

      if (submissions) {
        const results: QuizResult[] = submissions.map((s: any) => ({
          id: s.id,
          quiz_title: s.quiz?.title || 'Unknown Quiz',
          score: s.score || 0,
          total_marks: s.total_marks || 0,
          percentage: s.total_marks ? Math.round((s.score / s.total_marks) * 100) : 0,
          submitted_at: s.submitted_at,
        }));
        setQuizResults(results);
      }

      setLoading(false);
    }

    loadProfile();
  }, [user]);

  async function handleSave() {
    if (!profile || !user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || profile.full_name,
          usn: usn.trim() || null,
          department: department.trim() || null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'Profile updated!', description: 'Your changes have been saved.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  // Calculate stats
  const totalQuizzes = quizResults.length;
  const avgPercentage = totalQuizzes > 0
    ? Math.round(quizResults.reduce((sum, r) => sum + r.percentage, 0) / totalQuizzes)
    : 0;
  const passedQuizzes = quizResults.filter(r => r.percentage >= 70).length;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          {/* Page header */}
          <div className="mb-6 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                <User className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold">My Profile</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your profile details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usn">USN (University Seat Number)</Label>
                    <Input
                      id="usn"
                      placeholder="e.g. 1SH21CS001"
                      value={usn}
                      onChange={(e) => setUsn(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      placeholder="e.g. Computer Science & Design"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Stats sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Quizzes Attempted
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{totalQuizzes}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Average Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{avgPercentage}%</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Passed (≥70%)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{passedQuizzes}/{totalQuizzes}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Quiz history */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quiz History</CardTitle>
              <CardDescription>Your past quiz attempts</CardDescription>
            </CardHeader>
            <CardContent>
              {quizResults.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  You haven't attempted any quizzes yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {quizResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <p className="font-medium">{result.quiz_title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(result.submitted_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={result.percentage >= 70 ? 'default' : 'secondary'}>
                          {result.percentage}%
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {result.score}/{result.total_marks} marks
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
