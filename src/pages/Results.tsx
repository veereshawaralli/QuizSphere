// Results page - Faculty sees all submissions, Students see their own

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Users, CheckCircle, XCircle } from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
}

interface Submission {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number | null;
  total_marks: number | null;
  is_submitted: boolean;
  submitted_at: string | null;
  started_at: string;
  student_email?: string;
  student_name?: string;
}

export default function Results() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<string>('all');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  // Fetch quizzes
  useEffect(() => {
    if (!user) return;
    async function fetchQuizzes() {
      const { data } = await supabase
        .from('quizzes')
        .select('id, title')
        .order('created_at', { ascending: false });
      setQuizzes(data || []);
    }
    fetchQuizzes();
  }, [user]);

  // Fetch submissions
  useEffect(() => {
    if (!user) return;
    async function fetchSubmissions() {
      setLoadingData(true);
      let query = supabase
        .from('quiz_submissions')
        .select('*')
        .eq('is_submitted', true)
        .order('submitted_at', { ascending: false });

      if (selectedQuiz !== 'all') {
        query = query.eq('quiz_id', selectedQuiz);
      }

      // Students only see their own
      if (role === 'student') {
        query = query.eq('student_id', user.id);
      }

      const { data } = await query;

      // For faculty, fetch student profiles
      if (data && (role === 'faculty' || role === 'admin')) {
        const studentIds = [...new Set(data.map((s) => s.student_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name');

        // Note: faculty can't read other profiles due to RLS. 
        // We'll use user metadata from submissions instead.
        const profileMap = new Map(
          (profiles || []).map((p) => [p.user_id, p.full_name])
        );

        const enriched = data.map((s) => ({
          ...s,
          student_name: profileMap.get(s.student_id) || 'Student',
        }));
        setSubmissions(enriched);
      } else {
        setSubmissions(data || []);
      }
      setLoadingData(false);
    }
    fetchSubmissions();
  }, [user, role, selectedQuiz]);

  if (loading || !user) return null;

  const quizTitle = (quizId: string) =>
    quizzes.find((q) => q.id === quizId)?.title || 'Unknown Quiz';

  const avgScore =
    submissions.length > 0
      ? Math.round(
          submissions.reduce(
            (sum, s) =>
              sum + ((s.score || 0) / (s.total_marks || 1)) * 100,
            0
          ) / submissions.length
        )
      : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-8">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold">
                {role === 'faculty' || role === 'admin' ? 'Student Results' : 'My Results'}
              </h1>
              <p className="text-muted-foreground">
                {role === 'faculty' || role === 'admin'
                  ? 'View all student quiz submissions and scores.'
                  : 'Your quiz scores and performance.'}
              </p>
            </div>

            <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filter by quiz" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quizzes</SelectItem>
                {quizzes.map((q) => (
                  <SelectItem key={q.id} value={q.id}>
                    {q.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{submissions.length}</p>
                  <p className="text-sm text-muted-foreground">Submissions</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Trophy className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{avgScore}%</p>
                  <p className="text-sm text-muted-foreground">Avg Score</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {submissions.filter(
                      (s) =>
                        s.total_marks && s.score && s.score / s.total_marks >= 0.5
                    ).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Passed (≥50%)</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submissions table */}
          {loadingData ? (
            <p className="text-center text-muted-foreground">Loading results...</p>
          ) : submissions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">No submissions found.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        {(role === 'faculty' || role === 'admin') && (
                          <th className="pb-3 pr-4 font-medium text-muted-foreground">Student</th>
                        )}
                        <th className="pb-3 pr-4 font-medium text-muted-foreground">Quiz</th>
                        <th className="pb-3 pr-4 font-medium text-muted-foreground">Score</th>
                        <th className="pb-3 pr-4 font-medium text-muted-foreground">Percentage</th>
                        <th className="pb-3 font-medium text-muted-foreground">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((s) => {
                        const pct = s.total_marks
                          ? Math.round(((s.score || 0) / s.total_marks) * 100)
                          : 0;
                        return (
                          <tr key={s.id} className="border-b last:border-0">
                            {(role === 'faculty' || role === 'admin') && (
                              <td className="py-3 pr-4 font-medium">
                                {(s as any).student_name || 'Student'}
                              </td>
                            )}
                            <td className="py-3 pr-4">{quizTitle(s.quiz_id)}</td>
                            <td className="py-3 pr-4">
                              {s.score ?? 0} / {s.total_marks ?? 0}
                            </td>
                            <td className="py-3 pr-4">
                              <Badge
                                variant={pct >= 50 ? 'default' : 'destructive'}
                                className={pct >= 50 ? 'bg-success text-success-foreground' : ''}
                              >
                                {pct}%
                              </Badge>
                            </td>
                            <td className="py-3 text-muted-foreground">
                              {s.submitted_at
                                ? new Date(s.submitted_at).toLocaleDateString()
                                : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
