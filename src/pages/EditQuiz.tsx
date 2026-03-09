// Edit Quiz page - load existing quiz and its questions for editing
// Faculty can update details, add/remove questions, toggle publish

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft, Plus, Trash2, Save, Eye, EyeOff, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionForm {
  id?: string; // existing questions have an id
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  marks: number;
}

export default function EditQuiz() {
  const { quizId } = useParams<{ quizId: string }>();
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [isPublished, setIsPublished] = useState(false);
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load quiz data
  useEffect(() => {
    if (!quizId || !user) return;

    async function loadQuiz() {
      // Fetch quiz details
      const { data: quiz, error: quizErr } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizErr || !quiz) {
        toast({ title: 'Error', description: 'Quiz not found.', variant: 'destructive' });
        navigate('/quizzes');
        return;
      }

      setTitle(quiz.title);
      setDescription(quiz.description || '');
      setDurationMinutes(quiz.duration_minutes);
      setIsPublished(quiz.is_published || false);

      // Fetch questions
      const { data: qs } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('sort_order', { ascending: true });

      if (qs && qs.length > 0) {
        setQuestions(qs.map((q) => ({
          id: q.id,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option,
          marks: q.marks,
        })));
      } else {
        setQuestions([{
          question_text: '', option_a: '', option_b: '',
          option_c: '', option_d: '', correct_option: 'A', marks: 1,
        }]);
      }

      setLoadingQuiz(false);
    }

    loadQuiz();
  }, [quizId, user]);

  function addQuestion() {
    setQuestions([...questions, {
      question_text: '', option_a: '', option_b: '',
      option_c: '', option_d: '', correct_option: 'A', marks: 1,
    }]);
  }

  function removeQuestion(index: number) {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  }

  function updateQuestion(index: number, field: keyof QuestionForm, value: string | number) {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  }

  // Save changes
  async function handleSave(publish?: boolean) {
    if (!title.trim()) {
      toast({ title: 'Error', description: 'Quiz title is required.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const newPublishState = publish !== undefined ? publish : isPublished;

    try {
      // Update quiz details
      const { error: updateErr } = await supabase
        .from('quizzes')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          duration_minutes: durationMinutes,
          is_published: newPublishState,
        })
        .eq('id', quizId!);

      if (updateErr) throw updateErr;

      // Delete old questions and re-insert (simplest approach for editing)
      await supabase.from('questions').delete().eq('quiz_id', quizId!);

      const questionsToInsert = questions
        .filter((q) => q.question_text.trim()) // skip empty ones
        .map((q, index) => ({
          quiz_id: quizId!,
          question_text: q.question_text.trim(),
          option_a: q.option_a.trim(),
          option_b: q.option_b.trim(),
          option_c: q.option_c.trim(),
          option_d: q.option_d.trim(),
          correct_option: q.correct_option,
          marks: q.marks,
          sort_order: index + 1,
        }));

      if (questionsToInsert.length > 0) {
        const { error: insertErr } = await supabase.from('questions').insert(questionsToInsert);
        if (insertErr) throw insertErr;
      }

      setIsPublished(newPublishState);
      toast({ title: 'Saved!', description: 'Quiz updated successfully.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loadingQuiz) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-4 py-8">
        <div className="container mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/quizzes')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-heading text-2xl font-bold">Edit Quiz</h1>
          </div>

          {/* Quiz details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Quiz Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title *</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration" type="number" min={1} max={180}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                  className="w-32"
                />
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold">Questions ({questions.length})</h2>
            <Button variant="outline" size="sm" onClick={addQuestion}>
              <Plus className="mr-2 h-4 w-4" /> Add Question
            </Button>
          </div>

          {questions.map((q, index) => (
            <Card key={index} className="mb-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Question {index + 1}</CardTitle>
                  {questions.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeQuestion(index)}
                      className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Question Text *</Label>
                  <Textarea value={q.question_text}
                    onChange={(e) => updateQuestion(index, 'question_text', e.target.value)} rows={2} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                    const field = `option_${opt.toLowerCase()}` as keyof QuestionForm;
                    return (
                      <div key={opt} className="space-y-1">
                        <Label className="text-xs">Option {opt}</Label>
                        <Input value={q[field] as string}
                          onChange={(e) => updateQuestion(index, field, e.target.value)} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-end gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Correct Answer</Label>
                    <select className="flex h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={q.correct_option}
                      onChange={(e) => updateQuestion(index, 'correct_option', e.target.value)}>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Marks</Label>
                    <Input type="number" min={1} value={q.marks}
                      onChange={(e) => updateQuestion(index, 'marks', parseInt(e.target.value) || 1)}
                      className="w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => handleSave()} disabled={saving} variant="outline">
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            {isPublished ? (
              <Button onClick={() => handleSave(false)} disabled={saving} variant="secondary">
                <EyeOff className="mr-2 h-4 w-4" /> Unpublish
              </Button>
            ) : (
              <Button onClick={() => handleSave(true)} disabled={saving}>
                <Eye className="mr-2 h-4 w-4" /> Publish Quiz
              </Button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
