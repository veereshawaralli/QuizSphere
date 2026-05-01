// Modern editorial landing — aurora hero, glass cards, magnetic spotlight,
// scroll reveals and tactile micro-interactions. Built on the existing
// design tokens (paper / ink / electric coral).

import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight, BookOpen, Clock, Trophy, FileText,
  Sparkles, ShieldCheck, GraduationCap, Zap,
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

const tickerWords = [
  'Quizzes', 'Notes', 'Results', 'Leaderboards',
  'Certificates', 'Materials', 'Faculty', 'Students',
];

const highlights = [
  { icon: Sparkles,     label: 'Instant grading' },
  { icon: ShieldCheck,  label: 'Verified certificates' },
  { icon: GraduationCap,label: 'Faculty-authored' },
  { icon: Zap,          label: 'Built for focus' },
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

  // Live clock — quiet editorial detail
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Magnetic pointer halo — follows cursor inside the hero
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

      {/* ──────────────────────────────
        * HERO — aurora + glass + spotlight
        * ────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative grain spotlight overflow-hidden"
      >
        {/* Aurora blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="aurora-blob"
            style={{
              width: 520, height: 520, top: '-8%', left: '-6%',
              background: 'radial-gradient(circle, hsl(var(--accent) / 0.55), transparent 60%)',
              animationDelay: '0s',
            }}
          />
          <div
            className="aurora-blob"
            style={{
              width: 460, height: 460, top: '20%', right: '-8%',
              background: 'radial-gradient(circle, hsl(230 80% 60% / 0.35), transparent 60%)',
              animationDelay: '-6s',
            }}
          />
          <div
            className="aurora-blob"
            style={{
              width: 380, height: 380, bottom: '-10%', left: '30%',
              background: 'radial-gradient(circle, hsl(38 90% 60% / 0.35), transparent 60%)',
              animationDelay: '-12s',
            }}
          />
        </div>

        {/* Soft grid lines */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 75%)',
          }}
        />

        <div className="container mx-auto px-6 pt-12 pb-24 md:pt-20 md:pb-32">
          {/* Top meta row */}
          <div className="flex items-center justify-between border-b border-border pb-6">
            <p className="eyebrow text-muted-foreground rise rise-1">
              Issue №24 · AY 2025—26
            </p>
            <p className="hidden sm:flex items-center gap-3 eyebrow text-muted-foreground rise rise-1 pill glass">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Live · IST {time}
            </p>
          </div>

          <div className="grid gap-12 pt-10 md:grid-cols-12 md:gap-8">
            {/* Left — small column */}
            <div className="md:col-span-3 flex flex-col justify-between">
              <div className="rise rise-2">
                <div className="inline-flex items-center justify-center glass rounded-2xl p-3 float-y">
                  <img src={universityLogo} alt="Sharnbasva University" className="h-12 w-12 object-contain" />
                </div>
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
              <div className="rise rise-1 mb-6 flex flex-wrap gap-2">
                <span className="pill glass eyebrow text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-accent" /> New · Verified Certificates
                </span>
                <span className="pill glass eyebrow text-muted-foreground">
                  v2.4 — refreshed UI
                </span>
              </div>
              <h1 className="rise rise-2 font-heading text-[12vw] md:text-[8.5vw] lg:text-[7.5rem] leading-[0.92]">
                <span className="text-foreground">Learn deeply.</span><br />
                <span className="text-foreground">Test honestly. </span>
                <span className="text-gradient italic">Ship</span>
                <span className="text-foreground"> often</span>
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
                      className="btn-wipe group gap-3 rounded-none bg-foreground px-7 py-6 text-background hover:text-accent-foreground"
                    >
                      <span className="eyebrow">Enter Portal</span>
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Button>
                  </Link>
                  <Link to="/login?role=faculty">
                    <Button
                      size="lg"
                      variant="ghost"
                      className="rounded-none glass px-7 py-6 hover:bg-foreground hover:text-background"
                    >
                      <span className="eyebrow">Faculty</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Highlight chips */}
              <div className="mt-10 flex flex-wrap gap-2 rise rise-4">
                {highlights.map((h) => (
                  <span
                    key={h.label}
                    className="pill glass eyebrow text-foreground/70 transition-colors hover:text-accent"
                  >
                    <h.icon className="h-3.5 w-3.5 text-accent" strokeWidth={1.8} />
                    {h.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stat band — glass tiles */}
          <div className="mt-20 grid grid-cols-2 gap-3 md:grid-cols-4 rise rise-4">
            {stats.map((s, i) => (
              <div
                key={s.k}
                className="group relative glass rounded-2xl p-6 tilt"
              >
                <span className="absolute right-4 top-4 font-mono text-[10px] text-muted-foreground/70">
                  0{i + 1}
                </span>
                <p className="eyebrow text-muted-foreground">{s.k}</p>
                <p className="mt-2 font-heading text-2xl text-foreground">{s.v}</p>
                <span className="mt-4 block h-px w-6 bg-foreground/40 transition-all duration-500 group-hover:w-16 group-hover:bg-accent" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TICKER — calm editorial band over glass */}
      <div className="relative border-y border-border overflow-hidden bg-secondary/40 py-5">
        <div className="ticker-track whitespace-nowrap">
          {[...tickerWords, ...tickerWords].map((w, i) => (
            <span
              key={`${w}-${i}`}
              className="font-heading text-3xl md:text-4xl leading-none text-foreground/80 inline-flex items-center gap-6"
            >
              {w}
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
          ))}
        </div>
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
      </div>

      {/* ──────────────────────────────
        * CAPABILITIES — sticky column + glass cards grid
        * ────────────────────────────── */}
      <section className="relative border-t border-border bg-background overflow-hidden">
        {/* faint accent wash */}
        <div className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="container mx-auto px-6 py-24">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-4">
              <div className="md:sticky md:top-28 reveal">
                <p className="eyebrow text-accent">§ Capabilities</p>
                <h2 className="mt-4 font-heading text-5xl md:text-6xl leading-[0.95]">
                  <span className="text-foreground">Built for the way students </span>
                  <em className="text-gradient">actually</em>
                  <span className="text-foreground"> work.</span>
                </h2>
                <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  No clutter. No gimmicks. Four tools, each doing one thing well —
                  so the work itself stays in the foreground.
                </p>
                <div className="mt-8 hairline-coral max-w-[14rem]" />
                <p className="mt-4 font-mono text-[11px] text-muted-foreground">
                  04 essentials · 0 distractions
                </p>
              </div>
            </div>

            <div className="md:col-span-8">
              <div className="grid gap-5 sm:grid-cols-2">
                {capabilities.map((c, i) => (
                  <article
                    key={c.no}
                    className={`group reveal reveal-delay-${Math.min(i + 1, 3)} relative glass tilt rounded-2xl p-7 overflow-hidden`}
                  >
                    {/* corner glow on hover */}
                    <span className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/0 blur-2xl transition-all duration-700 group-hover:bg-accent/30" />
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-[11px] text-muted-foreground">{c.no}</span>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl glass-strong transition-all duration-500 group-hover:bg-accent group-hover:text-accent-foreground group-hover:rotate-[-6deg]">
                        <c.icon className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                    </div>
                    <h3 className="mt-10 font-heading text-3xl text-foreground transition-colors group-hover:text-accent">
                      {c.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {c.body}
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-foreground/60 transition-colors group-hover:text-accent">
                      <span className="h-px w-8 bg-current transition-all duration-500 group-hover:w-16" />
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUOTE / Manifesto */}
      <section className="relative border-t border-border bg-foreground text-background overflow-hidden">
        {/* Decorative grid lines */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(hsl(var(--background)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--background)) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        {/* aurora accent */}
        <div className="pointer-events-none absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-1/2 h-[2px] w-96 bg-accent/70 -rotate-[8deg]" />

        <div className="container relative mx-auto px-6 py-24 md:py-32">
          <div className="grid gap-8 md:grid-cols-12 reveal">
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
      <section className="relative border-t border-border accent-glow overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="aurora-blob"
            style={{
              width: 420, height: 420, left: '10%', top: '10%',
              background: 'radial-gradient(circle, hsl(var(--accent) / 0.45), transparent 60%)',
            }}
          />
        </div>
        <div className="container mx-auto px-6 py-20 reveal">
          <div className="glass-strong rounded-3xl p-10 md:p-14 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <p className="eyebrow text-accent">§ Begin</p>
              <h2 className="mt-3 font-heading text-4xl md:text-6xl leading-[0.95] text-foreground max-w-2xl">
                Ready when <em className="text-gradient not-italic">you</em> are<span className="text-accent">.</span>
              </h2>
              <p className="mt-4 max-w-md text-sm text-muted-foreground">
                Sign in with your university account to take quizzes, access materials and track your progress.
              </p>
            </div>
            <Link to="/login">
              <Button
                size="lg"
                className="btn-wipe group gap-3 rounded-none bg-foreground px-8 py-7 text-background hover:text-accent-foreground"
              >
                <span className="eyebrow">Sign in to begin</span>
                <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
