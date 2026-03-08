// Landing page for CSD Quiz & Learning Portal

import { Link } from 'react-router-dom';
import { BookOpen, Clock, Trophy, FileText, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import universityLogo from '@/assets/university-logo.png';

const features = [
  {
    icon: BookOpen,
    title: 'Interactive Quizzes',
    description: 'Attempt department quizzes with multiple choice questions and timed sessions.',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: Clock,
    title: 'Timed Assessments',
    description: 'Each quiz has a countdown timer. Auto-submits when time runs out.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Trophy,
    title: 'Instant Results',
    description: 'See your score, correct answers, and rank on the leaderboard right away.',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  {
    icon: FileText,
    title: 'Study Materials',
    description: 'Access notes, PDFs, and learning resources uploaded by faculty.',
    color: 'text-success',
    bg: 'bg-success/10',
  },
];

export default function Index() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero section with gradient */}
      <section className="hero-gradient relative overflow-hidden px-4 pb-20 pt-16 text-center">
        {/* Decorative elements */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute -bottom-10 -right-20 h-60 w-60 rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="container relative mx-auto max-w-3xl">
          <img src={universityLogo} alt="Sharnbasva University Logo" className="mx-auto mb-6 h-28 w-28 object-contain drop-shadow-lg" />
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Sharnbasva University — CSD Department
          </div>

          <h1 className="font-heading text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
            CSD Quiz &amp; Learning Portal
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/75">
            The official quiz and learning platform for the Department of Computer Science &amp; Design.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/login">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 text-base px-8 py-6 rounded-xl shadow-lg shadow-accent/25">
                Student Login
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login?role=faculty">
              <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm text-base px-8 py-6 rounded-xl">
                Faculty Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="flex-1 px-4 py-20">
        <div className="container mx-auto max-w-5xl">
          <h2 className="mb-3 text-center font-heading text-3xl font-bold">
            What You Can Do
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-muted-foreground">
            Everything you need to learn, test your knowledge, and track progress — all in one place.
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="group text-center transition-all hover:shadow-lg hover:-translate-y-1 border-border/60">
                <CardContent className="pt-8 pb-6">
                  <div className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.bg} transition-transform group-hover:scale-110`}>
                    <feature.icon className={`h-7 w-7 ${feature.color}`} />
                  </div>
                  <h3 className="mb-2 font-heading text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick info banner */}
      <section className="border-t bg-secondary/50 px-4 py-14 text-center">
        <div className="container mx-auto max-w-2xl">
          <h2 className="font-heading text-2xl font-bold">For Students &amp; Faculty</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Students can take quizzes, view results, and access study materials. 
            Faculty can create quizzes, add questions, and monitor student performance.
          </p>
          <Link to="/login" className="mt-6 inline-block">
            <Button variant="outline" className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
