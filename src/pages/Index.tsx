// Playful landing — animated blobs, gradient typography, sticker cards, confetti motion.

import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, BookOpen, Clock, Trophy, FileText,
  Sparkles, ShieldCheck, GraduationCap, Zap, Star, Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useReveal } from '@/hooks/use-reveal';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import universityLogo from '@/assets/university-logo.png';

const capabilities = [
  {
    no: '01',
    title: 'Live quizzes',
    body: 'Timed, multiple-choice assessments crafted by faculty with instant grading.',
    icon: BookOpen,
    accent: 'bg-accent text-accent-foreground',
  },
  {
    no: '02',
    title: 'Time-bound rigor',
    body: 'Every attempt runs on a countdown. Auto-submit keeps it honest.',
    icon: Clock,
    accent: 'bg-primary text-primary-foreground',
  },
  {
    no: '03',
    title: 'Honest results',
    body: 'See answers, scores, and where you stand on the leaderboard.',
    icon: Trophy,
    accent: 'bg-lime',
  },
  {
    no: '04',
    title: 'Faculty notes',
    body: 'PDFs, references and reading lists, organised by course.',
    icon: FileText,
    accent: 'bg-cyan-brand',
  },
];

const stats = [
  { k: 'Department', v: 'CS & Design', color: 'bg-gradient-candy' },
  { k: 'Founded', v: '1979', color: 'bg-gradient-aurora' },
  { k: 'Programs', v: 'BE · ME · PhD', color: 'bg-gradient-sunset' },
  { k: 'Campus', v: 'Kalaburagi', color: 'bg-gradient-lime' },
];

const tickerWords = [
  'Quizzes ✨', 'Notes 📚', 'Results 🏆', 'Leaderboards ⚡',
  'Certificates 🎓', 'Materials 📖', 'Faculty 🧑‍🏫', 'Students 🎯',
];

const highlights = [
  { icon: Sparkles, label: 'Instant grading' },
  { icon: ShieldCheck, label: 'Verified certificates' },
  { icon: GraduationCap, label: 'Faculty-authored' },
  { icon: Zap, label: 'Built for focus' },
];

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());

  useReveal();

  useEffect(() => {
    if (!loading && user) navigate('/dashboard');
  }, [user, loading, navigate]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Magnetic spotlight
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    el.addEventListener('pointermove', onMove);
    return () => el.removeEventListener('pointermove', onMove);
  }, []);

  const time = now.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      {/* HERO */}
      <section ref={heroRef} className="relative spotlight overflow-hidden">
        {/* Animated blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="blob"
            style={{ width: 560, height: 560, top: '-10%', left: '-8%',
              background: 'radial-gradient(circle, hsl(var(--accent) / 0.7), transparent 60%)',
              animationDelay: '0s' }} />
          <div className="blob"
            style={{ width: 480, height: 480, top: '15%', right: '-10%',
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.6), transparent 60%)',
              animationDelay: '-7s' }} />
          <div className="blob"
            style={{ width: 400, height: 400, bottom: '-15%', left: '25%',
              background: 'radial-gradient(circle, hsl(var(--cyan) / 0.5), transparent 60%)',
              animationDelay: '-14s' }} />
        </div>

        {/* Dot grid */}
        <div className="pointer-events-none absolute inset-0 -z-10 dot-grid opacity-40"
          style={{
            maskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 75%)',
          }}
        />

        <div className="container mx-auto px-6 pt-12 pb-24 md:pt-20 md:pb-32">
          {/* Top meta row */}
          <div className="flex items-center justify-between pb-6">
            <span className="pill glass eyebrow text-muted-foreground rise rise-1">
              <Star className="h-3 w-3 text-accent fill-accent" />
              Issue №24 · AY 2025—26
            </span>
            <span className="hidden sm:flex pill glass eyebrow text-muted-foreground rise rise-1">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Live · IST {time}
            </span>
          </div>

          <div className="grid gap-12 pt-10 md:grid-cols-12 md:gap-8">
            {/* Left small column */}
            <div className="md:col-span-3 flex flex-col justify-between">
              <div className="rise rise-2">
                <div className="relative inline-flex float-y">
                  <span className="absolute inset-0 rounded-3xl bg-gradient-candy opacity-60 blur-xl" />
                  <div className="relative inline-flex items-center justify-center glass-strong rounded-3xl p-3">
                    <img src={universityLogo} alt="Sharnbasva University" className="h-14 w-14 object-contain" />
                  </div>
                </div>
                <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  A learning portal built for the Department of
                  <span className="text-foreground font-semibold"> Computer Science &amp; Design</span> —
                  for students who take their craft seriously.
                </p>
              </div>

              <div className="mt-10 hidden md:block rise rise-4">
                <p className="eyebrow text-gradient-candy">Index</p>
                <ul className="mt-3 space-y-1 font-mono text-xs text-foreground/70">
                  <li>01 — Quizzes</li>
                  <li>02 — Time</li>
                  <li>03 — Results</li>
                  <li>04 — Notes</li>
                </ul>
              </div>
            </div>

            {/* Right headline */}
            <div className="md:col-span-9">
              <div className="rise rise-1 mb-6 flex flex-wrap gap-2">
                <span className="pill glass eyebrow text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-accent" /> New · Verified Certificates
                </span>
                <span className="pill bg-gradient-candy text-white eyebrow font-semibold rounded-full px-3 py-1.5 shadow-pop">
                  v3.0 — fresh look ✨
                </span>
              </div>

              <h1 className="rise rise-2 font-heading font-bold text-[14vw] md:text-[9vw] lg:text-[7.5rem] leading-[0.9] tracking-tight">
                <span className="text-foreground">Learn </span>
                <span className="text-gradient-candy">deeply</span>
                <span className="text-foreground">.</span><br />
                <span className="text-foreground">Test </span>
                <span className="text-gradient-aurora">honestly</span>
                <span className="text-foreground">.</span><br />
                <span className="text-gradient-sunset italic">Ship</span>
                <span className="text-foreground"> often</span>
                <span className="text-accent caret">_</span>
              </h1>

              <div className="mt-10 grid gap-8 md:grid-cols-12 md:items-end rise rise-3">
                <p className="md:col-span-7 max-w-xl text-base md:text-lg leading-relaxed text-foreground/80">
                  The official quiz and learning portal of the CSD Department —
                  a vibrant, focused space to take assessments, study, and watch
                  your understanding compound, week after week.
                </p>

                <div className="md:col-span-5 flex flex-wrap items-center gap-3 md:justify-end">
                  <Link to="/login">
                    <Button size="lg"
                      className="btn-candy group gap-3 rounded-full px-7 py-6 text-white">
                      <Rocket className="h-4 w-4" />
                      <span className="eyebrow">Enter Portal</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/login?role=faculty">
                    <Button size="lg" variant="ghost"
                      className="rounded-full glass px-7 py-6 hover:bg-foreground hover:text-background">
                      <span className="eyebrow">Faculty</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Highlight chips */}
              <div className="mt-10 flex flex-wrap gap-2 rise rise-4">
                {highlights.map((h) => (
                  <span key={h.label}
                    className="pill glass eyebrow text-foreground/70 transition-all hover:text-accent hover:scale-105">
                    <h.icon className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
                    {h.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stat tiles */}
          <div className="mt-20 grid grid-cols-2 gap-4 md:grid-cols-4 rise rise-4">
            {stats.map((s, i) => (
              <div key={s.k}
                className="group relative glass rounded-3xl p-6 tilt overflow-hidden">
                <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${s.color} opacity-30 blur-2xl transition-opacity group-hover:opacity-60`} />
                <span className="absolute right-4 top-4 font-mono text-[10px] text-muted-foreground/70">
                  0{i + 1}
                </span>
                <p className="eyebrow text-muted-foreground">{s.k}</p>
                <p className="mt-2 font-heading text-2xl font-bold text-foreground">{s.v}</p>
                <span className={`mt-4 block h-1 w-8 rounded-full ${s.color} transition-all duration-500 group-hover:w-20`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee ticker */}
      <div className="relative border-y border-border overflow-hidden bg-gradient-cosmic py-6">
        <div className="ticker-track whitespace-nowrap">
          {[...tickerWords, ...tickerWords].map((w, i) => (
            <span key={`${w}-${i}`}
              className="font-heading text-3xl md:text-4xl font-bold leading-none inline-flex items-center gap-6">
              <span className={i % 4 === 0 ? 'text-gradient-candy' : i % 4 === 1 ? 'text-gradient-aurora' : i % 4 === 2 ? 'text-foreground' : 'text-gradient-sunset'}>
                {w}
              </span>
              <span className="h-2 w-2 rounded-full bg-accent" />
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent" />
      </div>

      {/* Capabilities */}
      <section className="relative border-t border-border bg-background overflow-hidden">
        <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-gradient-candy opacity-15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-gradient-aurora opacity-15 blur-3xl" />

        <div className="container mx-auto px-6 py-24">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-4">
              <div className="md:sticky md:top-28 reveal">
                <span className="pill glass eyebrow text-accent inline-flex">
                  <Sparkles className="h-3 w-3" /> Capabilities
                </span>
                <h2 className="mt-4 font-heading text-5xl md:text-6xl font-bold leading-[0.95]">
                  <span className="text-foreground">Built for the way </span>
                  <span className="text-gradient-candy italic">you</span>
                  <span className="text-foreground"> work.</span>
                </h2>
                <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  No clutter. No gimmicks. Four tools, each doing one thing brilliantly —
                  so the work itself stays in the foreground.
                </p>
                <div className="mt-8 hairline-coral max-w-[14rem]" />
                <p className="mt-4 font-hand text-2xl text-gradient-candy">
                  04 essentials · 0 distractions
                </p>
              </div>
            </div>

            <div className="md:col-span-8">
              <div className="grid gap-5 sm:grid-cols-2">
                {capabilities.map((c, i) => (
                  <article key={c.no}
                    className={`group reveal reveal-delay-${Math.min(i + 1, 3)} relative glass tilt rounded-3xl p-7 overflow-hidden`}>
                    <span className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full ${c.accent} opacity-0 blur-3xl transition-all duration-700 group-hover:opacity-50`} />
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-[11px] text-muted-foreground">{c.no}</span>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${c.accent} shadow-pop transition-all duration-500 group-hover:rotate-[-8deg] group-hover:scale-110`}>
                        <c.icon className="h-5 w-5" strokeWidth={2.2} />
                      </div>
                    </div>
                    <h3 className="mt-10 font-heading text-3xl font-bold text-foreground transition-colors group-hover:text-gradient-candy">
                      {c.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {c.body}
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-foreground/60 transition-colors group-hover:text-accent">
                      <span className="h-1 w-8 rounded-full bg-current transition-all duration-500 group-hover:w-16" />
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Manifesto */}
      <section className="relative border-t border-border bg-foreground text-background overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--background)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--background)) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        <div className="pointer-events-none absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-gradient-candy opacity-30 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-72 w-72 rounded-full bg-gradient-aurora opacity-25 blur-3xl" />

        <div className="container relative mx-auto px-6 py-24 md:py-32">
          <div className="grid gap-8 md:grid-cols-12 reveal">
            <p className="md:col-span-3 eyebrow text-background/60">§ Manifesto</p>
            <blockquote className="md:col-span-9">
              <p className="font-heading text-3xl md:text-5xl font-bold leading-[1.1] text-background">
                <span className="text-gradient-candy">"</span>
                Knowledge is not a checkbox. It compounds quietly, in the space
                between attempts —
                <span className="text-gradient-candy"> the wrong answers you sit with</span>,
                the questions you return to. This portal is built for that pace.
                <span className="text-gradient-candy">"</span>
              </p>
              <footer className="mt-10 flex items-center gap-4">
                <span className="h-1 w-12 rounded-full bg-gradient-candy" />
                <span className="eyebrow text-background/70">Department of CSD</span>
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-border accent-glow overflow-hidden">
        <div className="container mx-auto px-6 py-20 reveal">
          <div className="relative glass-strong rounded-3xl p-10 md:p-14 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center overflow-hidden">
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-candy opacity-30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-aurora opacity-25 blur-3xl" />

            <div className="relative">
              <span className="pill glass eyebrow text-accent inline-flex">
                <Rocket className="h-3 w-3" /> Begin
              </span>
              <h2 className="mt-3 font-heading text-4xl md:text-6xl font-bold leading-[0.95] max-w-2xl">
                <span className="text-foreground">Ready when </span>
                <span className="text-gradient-candy italic">you</span>
                <span className="text-foreground"> are</span>
                <span className="text-accent">.</span>
              </h2>
              <p className="mt-4 max-w-md text-sm text-muted-foreground">
                Sign in with your university account to take quizzes, access materials and track your progress.
              </p>
            </div>
            <Link to="/login" className="relative">
              <Button size="lg"
                className="btn-candy group gap-3 rounded-full px-8 py-7 text-white">
                <Sparkles className="h-5 w-5" />
                <span className="eyebrow">Sign in to begin</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
