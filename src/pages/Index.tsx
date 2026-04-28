// Editorial landing page — asymmetric, oversized serif, single coral accent.

import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ArrowUpRight, BookOpen, Clock, Trophy, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import universityLogo from '@/assets/university-logo.png';

const capabilities = [
  {
    no: '01',
    title: 'Live quizzes',
    body: 'Timed, multiple-choice assessments crafted by faculty with instant grading.',
    icon: BookOpen,
  },
  {
    no: '02',
    title: 'Time-bound rigor',
    body: 'Every attempt runs on a countdown. Auto-submit keeps it honest.',
    icon: Clock,
  },
  {
    no: '03',
    title: 'Honest results',
    body: 'See answers, scores, and where you stand on the leaderboard.',
    icon: Trophy,
  },
  {
    no: '04',
    title: 'Faculty notes',
    body: 'PDFs, references and reading lists, organised by course.',
    icon: FileText,
  },
];

const stats = [
  { k: 'Department', v: 'CS & Design' },
  { k: 'Founded', v: '1979' },
  { k: 'Programs', v: 'BE · ME · PhD' },
  { k: 'Campus', v: 'Kalaburagi' },
];

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/dashboard');
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      {/* HERO — editorial split */}
      <section className="relative grain overflow-hidden">
        <div className="container mx-auto px-6 pt-12 pb-24 md:pt-20 md:pb-32">
          {/* Top meta row */}
          <div className="flex items-center justify-between border-b border-border pb-6">
            <p className="eyebrow text-muted-foreground rise rise-1">
              Issue №24 · Academic Year 2025—26
            </p>
            <p className="hidden sm:block eyebrow text-muted-foreground rise rise-1">
              Sharnbasva University
            </p>
          </div>

          <div className="grid gap-12 pt-10 md:grid-cols-12 md:gap-8">
            {/* Left — small column */}
            <div className="md:col-span-3 flex flex-col justify-between">
              <div className="rise rise-2">
                <img src={universityLogo} alt="Sharnbasva University" className="h-16 w-16 object-contain" />
                <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  A learning portal built for the Department of
                  <span className="text-foreground"> Computer Science &amp; Design</span> —
                  for students who take their craft seriously.
                </p>
              </div>

              <div className="mt-10 hidden md:block rise rise-4">
                <p className="eyebrow text-muted-foreground">Index</p>
                <ul className="mt-3 space-y-1 font-mono text-xs text-foreground/70">
                  <li>01 — Quizzes</li>
                  <li>02 — Time</li>
                  <li>03 — Results</li>
                  <li>04 — Notes</li>
                </ul>
              </div>
            </div>

            {/* Right — display headline */}
            <div className="md:col-span-9">
              <h1 className="rise rise-2 font-heading text-[12vw] md:text-[8.5vw] lg:text-[7.5rem] leading-[0.92] text-foreground">
                Learn deeply.<br />
                Test honestly. <span className="text-accent italic">Ship</span> often
                <span className="text-accent caret">_</span>
              </h1>

              <div className="mt-10 grid gap-8 md:grid-cols-12 md:items-end rise rise-3">
                <p className="md:col-span-7 max-w-xl text-base md:text-lg leading-relaxed text-foreground/80">
                  The official quiz and learning portal of the CSD Department —
                  a quiet, focused space to take assessments, study, and watch your
                  understanding compound, week after week.
                </p>

                <div className="md:col-span-5 flex flex-wrap items-center gap-3 md:justify-end">
                  <Link to="/login">
                    <Button
                      size="lg"
                      className="group gap-3 rounded-none bg-foreground px-7 py-6 text-background hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <span className="eyebrow">Enter Portal</span>
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Button>
                  </Link>
                  <Link to="/login?role=faculty">
                    <Button
                      size="lg"
                      variant="ghost"
                      className="rounded-none border border-border px-7 py-6 hover:bg-foreground hover:text-background"
                    >
                      <span className="eyebrow">Faculty</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Stat band */}
          <div className="mt-20 grid grid-cols-2 gap-px overflow-hidden border border-border bg-border md:grid-cols-4 rise rise-4">
            {stats.map((s) => (
              <div key={s.k} className="bg-background p-6">
                <p className="eyebrow text-muted-foreground">{s.k}</p>
                <p className="mt-2 font-heading text-2xl text-foreground">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAPABILITIES — numbered list, editorial */}
      <section className="border-t border-border bg-secondary/40">
        <div className="container mx-auto px-6 py-24">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="eyebrow text-accent">§ Capabilities</p>
              <h2 className="mt-4 font-heading text-5xl md:text-6xl leading-[0.95] text-foreground">
                Built for the way students <em className="text-accent">actually</em> work.
              </h2>
              <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
                No clutter. No gimmicks. Four tools, each doing one thing well —
                so the work itself stays in the foreground.
              </p>
            </div>

            <div className="md:col-span-8">
              <ul className="divide-y divide-border border-y border-border">
                {capabilities.map((c) => (
                  <li
                    key={c.no}
                    className="group grid grid-cols-12 items-start gap-4 py-8 transition-colors hover:bg-background"
                  >
                    <span className="col-span-2 md:col-span-1 font-mono text-xs text-muted-foreground pt-1">
                      {c.no}
                    </span>
                    <div className="col-span-10 md:col-span-9">
                      <h3 className="font-heading text-2xl md:text-3xl text-foreground">
                        {c.title}
                      </h3>
                      <p className="mt-2 max-w-md text-sm text-muted-foreground">{c.body}</p>
                    </div>
                    <div className="col-span-12 md:col-span-2 md:justify-self-end">
                      <div className="flex h-12 w-12 items-center justify-center border border-border transition-all group-hover:border-accent group-hover:text-accent group-hover:rotate-6">
                        <c.icon className="h-5 w-5" />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* QUOTE / Manifesto */}
      <section className="border-t border-border bg-foreground text-background">
        <div className="container mx-auto px-6 py-24 md:py-32">
          <div className="grid gap-8 md:grid-cols-12">
            <p className="md:col-span-3 eyebrow text-background/60">Manifesto</p>
            <blockquote className="md:col-span-9">
              <p className="font-heading text-3xl md:text-5xl leading-[1.1] text-background">
                <span className="text-accent">“</span>
                Knowledge is not a checkbox. It compounds quietly, in the space
                between attempts —
                <span className="text-accent"> the wrong answers you sit with</span>,
                the questions you return to. This portal is built for that pace.
                <span className="text-accent">”</span>
              </p>
              <footer className="mt-10 flex items-center gap-4">
                <span className="h-px w-10 bg-accent" />
                <span className="eyebrow text-background/70">Department of CSD</span>
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="container mx-auto flex flex-col items-start justify-between gap-8 px-6 py-20 md:flex-row md:items-center">
          <h2 className="font-heading text-4xl md:text-6xl leading-[0.95] text-foreground max-w-2xl">
            Ready when you are.
          </h2>
          <Link to="/login">
            <Button
              size="lg"
              className="group gap-3 rounded-none bg-accent px-8 py-7 text-accent-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              <span className="eyebrow">Sign in to begin</span>
              <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
