// Quizzes list page
// Shows all quizzes - faculty sees their own + create button, students see published ones

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Plus, Clock, FileQuestion, ArrowLeft, Trash2, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  is_published: boolean | null;
  created_at: string;
  created_by: string;
}

export default function Quizzes() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [fetching, setFetching] = useState(true);
  const { toast } = useToast();

  const handleDeleteQuiz = async (quizId: string, quizTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${quizTitle}"? This will also delete all questions, submissions, and answers.`)) return;

    const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
    if (error) {
      toast({ title: 'Failed to delete quiz', description: error.message, variant: 'destructive' });
    } else {
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      toast({ title: 'Quiz deleted successfully' });
    }
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  // Fetch quizzes from database
  useEffect(() => {
    if (!user) return;

    async function loadQuizzes() {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load quizzes:', error.message);
      } else {
        setQuizzes(data || []);
      }
      setFetching(false);
    }

    loadQuizzes();
  }, [user]);

  if (loading || !user) return null;

  const isFacultyOrAdmin = role === 'faculty' || role === 'admin';

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          {/* Page header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="font-heading text-2xl font-bold">Quizzes</h1>
            </div>

            {/* Only faculty/admin can create quizzes */}
            {isFacultyOrAdmin && (
              <Link to="/quizzes/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Quiz
                </Button>
              </Link>
            )}
          </div>

          {/* Quiz list */}
          {fetching ? (
            <p className="text-center text-muted-foreground">Loading quizzes...</p>
          ) : quizzes.length === 0 ? (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                {isFacultyOrAdmin
                  ? 'No quizzes yet. Create your first quiz!'
                  : 'No quizzes available right now. Check back later.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {quizzes.map((quiz) => (
                <Card key={quiz.id} className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{quiz.title}</CardTitle>
                        {quiz.description && (
                          <CardDescription className="mt-1">{quiz.description}</CardDescription>
                        )}
                      </div>
                      <Badge variant={quiz.is_published ? 'default' : 'secondary'}>
                        {quiz.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {quiz.duration_minutes} min
                        </span>
                        <span>
                          Created {new Date(quiz.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Faculty can edit, students can attempt */}
                      <div className="flex items-center gap-2">
                        {isFacultyOrAdmin && quiz.created_by === user.id ? (
                          <Link to={`/quizzes/${quiz.id}/edit`}>
                            <Button variant="outline" size="sm">
                              Edit Quiz
                            </Button>
                          </Link>
                        ) : quiz.is_published ? (
                          <Link to={`/quizzes/${quiz.id}/attempt`}>
                            <Button size="sm">Start Quiz</Button>
                          </Link>
                        ) : null}
                        {role === 'admin' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
