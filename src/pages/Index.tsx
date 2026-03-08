// Landing page for CSD Quiz & Learning Portal
// Shows key features and a call to action for students/faculty

import { Link } from 'react-router-dom';
import { BookOpen, Clock, Trophy, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Feature cards data - keeps the JSX clean
const features = [
  {
    icon: BookOpen,
    title: 'Interactive Quizzes',
    description: 'Attempt department quizzes with multiple choice questions and timed sessions.',
  },
  {
    icon: Clock,
    title: 'Timed Assessments',
    description: 'Each quiz has a countdown timer. Auto-submits when time runs out.',
  },
  {
    icon: Trophy,
    title: 'Instant Results',
    description: 'See your score, correct answers, and rank on the leaderboard right away.',
  },
  {
    icon: FileText,
    title: 'Study Materials',
    description: 'Access notes, PDFs, and learning resources uploaded by faculty.',
  },
];

export default function Index() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero section */}
      <section className="bg-primary px-4 pb-16 pt-12 text-center">
        <div className="container mx-auto max-w-3xl">
          <h1 className="font-heading text-3xl font-bold leading-tight text-primary-foreground sm:text-4xl md:text-5xl">
            CSD Quiz &amp; Learning Portal
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
            The official quiz and learning platform for the Department of Computer Science &amp; Design, Sharnbasva University.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/login">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Student Login
              </Button>
            </Link>
            <Link to="/login?role=faculty">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                Faculty Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="flex-1 px-4 py-16">
        <div className="container mx-auto max-w-5xl">
          <h2 className="mb-8 text-center font-heading text-2xl font-bold">
            What You Can Do
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                    <feature.icon className="h-6 w-6 text-accent" />
                  </div>
                  <h3 className="mb-2 font-heading text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick info banner */}
      <section className="border-t bg-secondary px-4 py-10 text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="font-heading text-xl font-bold">For Students &amp; Faculty</h2>
          <p className="mt-2 text-muted-foreground">
            Students can take quizzes, view results, and access study materials. 
            Faculty can create quizzes, add questions, and monitor student performance.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
