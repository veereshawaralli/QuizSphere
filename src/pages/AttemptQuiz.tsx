// Quiz attempt page - students take a quiz here
// Features: countdown timer, randomized questions, single attempt, auto-submit on timeout

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Clock, ChevronLeft, ChevronRight, Send, AlertTriangle, Eye, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CertificateGenerator } from '@/components/CertificateGenerator';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  marks: number;
  sort_order: number | null;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
}

export default function AttemptQuiz() {
  const { quizId } = useParams<{ quizId: string }>();
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [totalMarks, setTotalMarks] = useState<number | null>(null);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const submissionIdRef = useRef<string | null>(null);
  const fullscreenExitHandled = useRef(false);
  const handleSubmitRef = useRef<() => void>();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  // Enter fullscreen when quiz starts
  useEffect(() => {
    if (quizStarted && !submitted && !alreadyAttempted) {
      document.documentElement.requestFullscreen?.().then(() => {
        setFullscreenActive(true);
      }).catch((err) => {
        console.warn('Fullscreen request denied:', err);
      });
    }
  }, [quizStarted, submitted, alreadyAttempted]);

  // Listen for fullscreen exit → auto-submit
  useEffect(() => {
    if (!quizStarted || submitted) return;

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !fullscreenExitHandled.current) {
        fullscreenExitHandled.current = true;
        toast({
          title: 'Fullscreen exited',
          description: 'Your quiz has been automatically submitted.',
          variant: 'destructive',
        });
        handleSubmitRef.current?.();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && !fullscreenExitHandled.current) {
        fullscreenExitHandled.current = true;
        toast({
          title: 'Tab switched',
          description: 'Your quiz has been automatically submitted.',
          variant: 'destructive',
        });
        handleSubmitRef.current?.();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleVisibilityChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
    };
  }, [quizStarted, submitted, toast]);

  // Prevent copy, cut, paste, screenshot, right-click, print during quiz
  useEffect(() => {
    if (!quizStarted || submitted) return;

    const preventAction = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const preventKeys = (e: KeyboardEvent) => {
      // Block PrintScreen, Ctrl+C, Ctrl+A, Ctrl+P, Ctrl+S, Ctrl+Shift+I (DevTools)
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && ['c', 'a', 'p', 's', 'u'].includes(e.key.toLowerCase())) ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('copy', preventAction);
    document.addEventListener('cut', preventAction);
    document.addEventListener('paste', preventAction);
    document.addEventListener('contextmenu', preventAction);
    document.addEventListener('keydown', preventKeys);
    // Disable text selection via CSS
    document.body.style.userSelect = 'none';
    (document.body.style as any).webkitUserSelect = 'none';

    return () => {
      document.removeEventListener('copy', preventAction);
      document.removeEventListener('cut', preventAction);
      document.removeEventListener('paste', preventAction);
      document.removeEventListener('contextmenu', preventAction);
      document.removeEventListener('keydown', preventKeys);
      document.body.style.userSelect = '';
      (document.body.style as any).webkitUserSelect = '';
    };
  }, [quizStarted, submitted]);

  // Load quiz, questions, and check prior attempt
  useEffect(() => {
    if (!user || !quizId) return;

    async function load() {
      // Fetch quiz
      const { data: quizData, error: qErr } = await supabase
        .from('quizzes')
        .select('id, title, description, duration_minutes')
        .eq('id', quizId!)
        .single();

      if (qErr || !quizData) {
        toast({ title: 'Quiz not found', variant: 'destructive' });
        navigate('/quizzes');
        return;
      }
      setQuiz(quizData);

      // Check how many times already attempted (max 2 allowed)
      const { data: existingSubs, count } = await supabase
        .from('quiz_submissions')
        .select('id, score, total_marks, is_submitted', { count: 'exact' })
        .eq('quiz_id', quizId!)
        .eq('student_id', user!.id)
        .eq('is_submitted', true);

      const attemptsMade = count || 0;
      setAttemptCount(attemptsMade);

      if (attemptsMade >= 2) {
        // Already used both attempts - show last result
        setAlreadyAttempted(true);
        const lastSub = existingSubs?.[existingSubs.length - 1];
        if (lastSub) {
          setScore(lastSub.score);
          setTotalMarks(lastSub.total_marks);
          submissionIdRef.current = lastSub.id;
        }
        setSubmitted(true);
        setPageLoading(false);
        return;
      }

      // Fetch questions and shuffle
      const { data: qList } = await supabase
        .from('questions')
        .select('id, question_text, option_a, option_b, option_c, option_d, marks, sort_order')
        .eq('quiz_id', quizId!)
        .order('sort_order');

      const shuffled = (qList || []).sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
      setSecondsLeft(quizData.duration_minutes * 60);
      setQuizStarted(true);
      setPageLoading(false);
    }

    load();
  }, [user, quizId, navigate, toast]);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft === null || submitted) return;
    if (secondsLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => (s !== null ? s - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, submitted]);

  const handleSelect = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = useCallback(async () => {
    if (submitting || submitted || !quiz || !user) return;
    setSubmitting(true);

    try {
      // Create submission
      const { data: sub, error: subErr } = await supabase
        .from('quiz_submissions')
        .insert({
          quiz_id: quiz.id,
          student_id: user.id,
          is_submitted: true,
          submitted_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (subErr || !sub) throw subErr;
      submissionIdRef.current = sub.id;

      // Fetch correct answers
      const { data: correctAnswers } = await supabase
        .from('questions')
        .select('id, correct_option, marks')
        .eq('quiz_id', quiz.id);

      let calcScore = 0;
      let calcTotal = 0;
      const studentAnswers = (correctAnswers || []).map((q) => {
        const selected = answers[q.id] || null;
        const isCorrect = selected === q.correct_option;
        if (isCorrect) calcScore += q.marks;
        calcTotal += q.marks;
        return {
          submission_id: sub.id,
          question_id: q.id,
          selected_option: selected,
          is_correct: isCorrect,
        };
      });

      // Save answers
      if (studentAnswers.length > 0) {
        await supabase.from('student_answers').insert(studentAnswers);
      }

      // Update submission with score
      await supabase
        .from('quiz_submissions')
        .update({ score: calcScore, total_marks: calcTotal })
        .eq('id', sub.id);

      // Send result email to student
      const percentage = calcTotal > 0 ? (calcScore / calcTotal) * 100 : 0;
      try {
        await supabase.functions.invoke('send-result-email', {
          body: {
            submissionId: sub.id,
            studentEmail: user.email,
            studentName: user.user_metadata?.full_name || user.email?.split('@')[0],
            quizTitle: quiz.title,
            score: calcScore,
            totalMarks: calcTotal,
            percentage,
          },
        });
      } catch (emailErr) {
        console.error('Failed to send result email:', emailErr);
        // Don't block submission on email failure
      }

      setScore(calcScore);
      setTotalMarks(calcTotal);
      setSubmitted(true);
    } catch (err) {
      console.error('Submission error:', err);
      toast({ title: 'Failed to submit quiz', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [submitting, submitted, quiz, user, answers, toast]);

  // Keep ref in sync
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  // Exit fullscreen when submitted
  useEffect(() => {
    if (submitted && document.fullscreenElement) {
      document.exitFullscreen?.();
    }
  }, [submitted]);

  if (authLoading || pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!quiz) return null;

  // Results screen
  if (submitted) {
    const percentage = totalMarks ? Math.round((score! / totalMarks) * 100) : 0;
    const attemptsUsed = alreadyAttempted ? attemptCount : attemptCount + 1;
    const canRetry = attemptsUsed < 2 && percentage < 70;
    
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 px-4 py-8">
          <div className="container mx-auto max-w-lg">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  {alreadyAttempted ? 'Maximum Attempts Reached' : 'Quiz Submitted!'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                <p className="text-4xl font-bold text-primary">{percentage}%</p>
                <p className="text-muted-foreground">
                  Score: {score} / {totalMarks}
                </p>
                <p className="text-sm text-muted-foreground">
                  Attempts used: {attemptsUsed} / 2
                </p>
                {percentage < 70 && (
                  <p className="text-sm text-muted-foreground">
                    {canRetry 
                      ? 'You need at least 70% to earn a certificate. You have 1 more attempt!'
                      : 'You need at least 70% to earn a certificate. No more attempts remaining.'}
                  </p>
                )}
                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => navigate('/quizzes')} variant="outline">
                    Back to Quizzes
                  </Button>
                  {canRetry && (
                    <Button onClick={() => window.location.reload()}>
                      Try Again
                    </Button>
                  )}
                  <CertificateGenerator 
                    studentName={user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'}
                    quizTitle={quiz.title}
                    score={score || 0}
                    totalMarks={totalMarks || 0}
                    percentage={percentage}
                    date={new Date()}
                    submissionId={submissionIdRef.current || ''}
                    quizId={quiz.id}
                    studentId={user?.id || ''}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Quiz taking UI
  const currentQ = questions[currentIdx];
  const mm = String(Math.floor((secondsLeft || 0) / 60)).padStart(2, '0');
  const ss = String((secondsLeft || 0) % 60).padStart(2, '0');
  const isLowTime = (secondsLeft || 0) < 60;

  const options = [
    { key: 'A', text: currentQ?.option_a },
    { key: 'B', text: currentQ?.option_b },
    { key: 'C', text: currentQ?.option_c },
    { key: 'D', text: currentQ?.option_d },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-6">
        <div className="container mx-auto max-w-3xl">
          {/* Top bar: title + timer */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="font-heading text-xl font-bold">{quiz.title}</h1>
            <Badge
              variant={isLowTime ? 'destructive' : 'secondary'}
              className="flex items-center gap-1 text-base px-3 py-1"
            >
              <Clock className="h-4 w-4" />
              {mm}:{ss}
              {isLowTime && <AlertTriangle className="ml-1 h-4 w-4" />}
            </Badge>
          </div>

          {/* Question navigation dots */}
          <div className="mb-4 flex flex-wrap gap-2">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(i)}
                className={`h-8 w-8 rounded-full text-sm font-medium transition-colors ${
                  i === currentIdx
                    ? 'bg-primary text-primary-foreground'
                    : answers[q.id]
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Current question */}
          {currentQ && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    Q{currentIdx + 1}. {currentQ.question_text}
                  </CardTitle>
                  <Badge variant="outline">{currentQ.marks} marks</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {options.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => handleSelect(currentQ.id, opt.key)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      answers[currentQ.id] === opt.key
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <span className="mr-2 font-semibold">{opt.key}.</span>
                    {opt.text}
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Navigation + Submit */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => i - 1)}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>

            {currentIdx < questions.length - 1 ? (
              <Button onClick={() => setCurrentIdx((i) => i + 1)}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting}>
                <Send className="mr-1 h-4 w-4" />
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
