// Create Quiz page - for faculty/admin
// Step 1: Set quiz title, description, duration
// Step 2: Add questions one by one

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ArrowLeft, Plus, Trash2, Save, Eye, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionForm {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  marks: number;
}

// Empty question template
const emptyQuestion: QuestionForm = {
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'A',
  marks: 1,
};

export default function CreateQuiz() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Quiz details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState('17:00');

  // Questions list
  const [questions, setQuestions] = useState<QuestionForm[]>([{ ...emptyQuestion }]);
  const [saving, setSaving] = useState(false);

  // Check permissions
  if (!loading && role !== 'faculty' && role !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  // Add a new blank question
  function addQuestion() {
    setQuestions([...questions, { ...emptyQuestion }]);
  }

  // Remove a question by index
  function removeQuestion(index: number) {
    if (questions.length <= 1) return; // keep at least one
    setQuestions(questions.filter((_, i) => i !== index));
  }

  // Update a specific question field
  function updateQuestion(index: number, field: keyof QuestionForm, value: string | number) {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  }

  // Save quiz + questions to the database
  async function handleSave(publish: boolean) {
    // Basic validation
    if (!title.trim()) {
      toast({ title: 'Error', description: 'Quiz title is required.', variant: 'destructive' });
      return;
    }

    // Check all questions are filled
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim() || !q.option_a.trim() || !q.option_b.trim() || !q.option_c.trim() || !q.option_d.trim()) {
        toast({ title: 'Error', description: `Question ${i + 1} is incomplete.`, variant: 'destructive' });
        return;
      }
    }

    setSaving(true);

    try {
      // Build start/end datetime
      let startDateTime: string | null = null;
      let endDateTime: string | null = null;

      if (startDate) {
        const [sh, sm] = startTime.split(':').map(Number);
        const sdt = new Date(startDate);
        sdt.setHours(sh, sm, 0, 0);
        startDateTime = sdt.toISOString();
      }

      if (endDate) {
        const [eh, em] = endTime.split(':').map(Number);
        const edt = new Date(endDate);
        edt.setHours(eh, em, 0, 0);
        endDateTime = edt.toISOString();
      }

      // Step 1: Create the quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          duration_minutes: durationMinutes,
          created_by: user!.id,
          is_published: publish,
          start_time: startDateTime,
          end_time: endDateTime,
        })
        .select()
        .single();

      if (quizError) throw quizError;

      // Step 2: Insert all questions
      const questionsToInsert = questions.map((q, index) => ({
        quiz_id: quiz.id,
        question_text: q.question_text.trim(),
        option_a: q.option_a.trim(),
        option_b: q.option_b.trim(),
        option_c: q.option_c.trim(),
        option_d: q.option_d.trim(),
        correct_option: q.correct_option,
        marks: q.marks,
        sort_order: index + 1,
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast({
        title: publish ? 'Quiz Published!' : 'Quiz Saved as Draft',
        description: `"${title}" with ${questions.length} question(s).`,
      });

      navigate('/quizzes');
    } catch (error: any) {
      console.error('Failed to save quiz:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-4 py-8">
        <div className="container mx-auto max-w-3xl">
          {/* Page header */}
          <div className="mb-6 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/quizzes')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-heading text-2xl font-bold">Create New Quiz</h1>
          </div>

          {/* Quiz details card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Quiz Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Quiz Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Data Structures - Unit 1 Test"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description (optional)</Label>
                <Textarea
                  id="desc"
                  placeholder="Brief description of this quiz..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={180}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                  className="w-32"
                />
              </div>
            </CardContent>
          </Card>

          {/* Questions section */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold">
              Questions ({questions.length})
            </h2>
            <Button variant="outline" size="sm" onClick={addQuestion}>
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </div>

          {questions.map((q, index) => (
            <Card key={index} className="mb-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Question {index + 1}</CardTitle>
                  {questions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Question text */}
                <div className="space-y-2">
                  <Label>Question Text *</Label>
                  <Textarea
                    placeholder="Enter your question..."
                    value={q.question_text}
                    onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Options grid */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                    const fieldKey = `option_${opt.toLowerCase()}` as keyof QuestionForm;
                    return (
                      <div key={opt} className="space-y-1">
                        <Label className="text-xs">Option {opt}</Label>
                        <Input
                          placeholder={`Option ${opt}`}
                          value={q[fieldKey] as string}
                          onChange={(e) => updateQuestion(index, fieldKey, e.target.value)}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Correct answer + marks */}
                <div className="flex items-end gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Correct Answer</Label>
                    <select
                      className="flex h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={q.correct_option}
                      onChange={(e) => updateQuestion(index, 'correct_option', e.target.value)}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Marks</Label>
                    <Input
                      type="number"
                      min={1}
                      value={q.marks}
                      onChange={(e) => updateQuestion(index, 'marks', parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => handleSave(false)} disabled={saving} variant="outline">
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving}>
              <Eye className="mr-2 h-4 w-4" />
              {saving ? 'Publishing...' : 'Publish Quiz'}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
