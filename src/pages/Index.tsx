// Obsidian Neural landing — bento hero, aurora orbs, animated metrics,
// glass capability tiles, scrolling marquee, neural-grid footing.

import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  ArrowUpRight, ArrowRight, Sparkles, Brain, Zap, ShieldCheck,
  Library, GraduationCap, BarChart3, Cpu,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useReveal } from '@/hooks/use-reveal';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const figures = [
  { k: 'Active learners', v: '1,240+' },
  { k: 'Quizzes hosted', v: '320' },
  { k: 'Certificates issued', v: '880' },
  { k: 'Avg. pass rate', v: '78%' },
];

const tickerItems = [
  'Neural-grade assessments', 'Real-time grading', 'QR-verified certificates',
  'Adaptive difficulty', 'Faculty-authored', 'Anti-cheat protection',
  'Lecture materials', 'Performance analytics',
];

const capabilities = [
  { icon: Brain, title: 'Adaptive quizzes', body: 'Timed, faculty-authored assessments with instant transparent grading.' },
  { icon: Zap, title: 'Real-time grading', body: 'Auto-submit on time-up. Live feedback the moment you submit.' },
  { icon: ShieldCheck, title: 'Verified certificates', body: 'Cross 70% and earn a QR-verifiable PDF certificate.' },
  { icon: Library, title: 'Curated materials', body: 'Lecture notes, references, reading lists by course & semester.' },
  { icon: BarChart3, title: 'Progress analytics', body: 'Track attempts, scores and growth across the semester.' },
  { icon: Cpu, title: 'AI study buddy', body: 'Cosmo — your in-portal assistant powered by Gemini.' },
];

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());

  useReveal();

  useEffect(() => {
    if (!loading && user) navigate('/dashboard');
  }, [user, loading, navigate]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground overflow-x-clip">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="blob blob-violet h-[36rem] w-[36rem] -top-40 -left-40 float-y" />
        <div className="blob blob-cyan h-[32rem] w-[32rem] -top-20 right-[-10rem] float-x" />
        <div className="blob blob-magenta h-[24rem] w-[24rem] top-[80vh] left-1/3 opacity-40" />
      </div>

      <Header />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 neural-grid opacity-60" />

        <div className="relative mx-auto max-w-[1440px] px-6 pt-14 pb-24 md:pt-20 md:pb-32">
          {/* Status row */}
          <div className="flex flex-wrap items-center justify-between gap-3 reveal">
            <span className="pill"><Sparkles className="h-3 w-3 text-primary" /> Obsidian Neural · v5.0 release</span>
            <span className="eyebrow font-mono">IST {time}</span>
          </div>

          {/* Headline */}
          <h1 className="reveal reveal-delay-1 mt-12 font-heading font-semibold tracking-[-0.05em] leading-[0.86] text-[14vw] md:text-[10.2vw] lg:text-[9.5rem]">
            Learn like a<br />
            <span className="display-serif">neural</span> network.
          </h1>

          <div className="mt-10 grid gap-10 md:grid-cols-12 md:items-end reveal reveal-delay-2">
            <p className="md:col-span-7 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              The official quiz &amp; learning portal of the <span className="text-foreground">CSD Department</span>,
              Sharnbasva University. A focused operating system for assessments,
              study and the slow compounding of understanding.
            </p>

            <div className="md:col-span-5 flex flex-wrap items-center gap-3 md:justify-end">
              <Link to="/login" className="btn-ink">
                Enter portal <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/verify" className="btn-paper">
                Verify certificate
              </Link>
            </div>
          </div>

          {/* Bento grid */}
          <div className="mt-20 grid auto-rows-[minmax(0,_1fr)] gap-4 md:grid-cols-6 md:gap-5 reveal reveal-delay-3">
            {/* Featured tile */}
            <div className="md:col-span-4 md:row-span-2 relative overflow-hidden rounded-3xl border border-foreground/10 bg-card/60 backdrop-blur-xl p-8 md:p-10 lift">
              <div className="absolute inset-0 bg-gradient-aurora opacity-[0.08]" />
              <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
              <div className="relative">
                <p className="eyebrow text-primary">§ Flagship</p>
                <h3 className="mt-4 font-heading text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
                  Quizzes that<br />actually <span className="display-serif">teach</span>.
                </h3>
                <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">
                  Time-bound, full-screen, auto-submit on blur. Built so the questions
                  do the teaching — not the proctor.
                </p>
                <Link to="/quizzes" className="mt-8 inline-flex items-center gap-2 text-sm text-foreground link-underline">
                  Browse quizzes <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Metric tiles */}
            {figures.slice(0, 2).map((f) => (
              <div key={f.k} className="md:col-span-2 relative overflow-hidden rounded-3xl border border-foreground/10 bg-card/40 backdrop-blur-xl p-6 lift">
                <p className="eyebrow">{f.k}</p>
                <p className="mt-6 font-heading text-5xl font-semibold tracking-tight text-gradient-animated">{f.v}</p>
              </div>
            ))}

            {/* AI tile */}
            <div className="md:col-span-2 relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-aurora p-6 text-background lift">
              <Sparkles className="h-6 w-6" />
              <p className="mt-6 font-heading text-2xl font-semibold leading-tight tracking-tight">
                Cosmo · your AI study buddy
              </p>
              <p className="mt-2 text-sm opacity-90">Streaming answers, 24/7. Powered by Gemini.</p>
            </div>

            <div className="md:col-span-2 relative overflow-hidden rounded-3xl border border-foreground/10 bg-card/40 backdrop-blur-xl p-6 lift">
              <GraduationCap className="h-6 w-6 text-primary" />
              <p className="mt-6 font-heading text-2xl font-semibold leading-tight tracking-tight">
                Verified certificates
              </p>
              <p className="mt-2 text-sm text-muted-foreground">QR-verifiable. PDF or DOCX. Cross 70% to qualify.</p>
            </div>

            <div className="md:col-span-2 relative overflow-hidden rounded-3xl border border-foreground/10 bg-card/40 backdrop-blur-xl p-6 lift">
              <Library className="h-6 w-6 text-accent" />
              <p className="mt-6 font-heading text-2xl font-semibold leading-tight tracking-tight">
                Faculty materials
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Notes, references, reading by course &amp; semester.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ───────────────────────────────────────────────── */}
      <section className="relative border-y border-foreground/8 bg-background/40 backdrop-blur-md overflow-hidden">
        <div className="py-6">
          <div className="ticker-track whitespace-nowrap font-heading text-2xl font-semibold tracking-tight text-foreground/80 md:text-4xl">
            {[...tickerItems, ...tickerItems].map((t, i) => (
              <span key={i} className="inline-flex items-center gap-8">
                {t}
                <span className="text-primary">✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES ─────────────────────────────────────────── */}
      <section className="relative">
        <div className="mx-auto max-w-[1440px] px-6 py-24 md:py-32">
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-4">
              <div className="md:sticky md:top-32">
                <p className="section-num">§ 02 — Capabilities</p>
                <h2 className="reveal mt-6 font-heading text-5xl font-semibold leading-[0.95] tracking-tight md:text-6xl">
                  Six tools.<br />
                  One <span className="display-serif">brain</span>.
                </h2>
                <p className="reveal reveal-delay-1 mt-6 max-w-sm text-base leading-relaxed text-muted-foreground">
                  Each module does one thing brilliantly. Together they form a quiet,
                  serious environment where the learning leads and the portal recedes.
                </p>
                <div className="mt-10 hairline-coral max-w-[16rem]" />
              </div>
            </div>

            <ul className="md:col-span-8 grid gap-4 md:grid-cols-2">
              {capabilities.map((c, i) => (
                <li
                  key={c.title}
                  className={`reveal reveal-delay-${Math.min(i + 1, 4)} group relative overflow-hidden rounded-2xl border border-foreground/10 bg-card/50 p-7 backdrop-blur-xl transition-all hover:border-primary/40 hover:bg-card/70`}
                >
                  <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/20 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <c.icon className="relative h-6 w-6 text-primary" />
                  <h3 className="relative mt-6 font-heading text-2xl font-semibold leading-tight tracking-tight">
                    {c.title}
                  </h3>
                  <p className="relative mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    {c.body}
                  </p>
                  <ArrowUpRight className="absolute right-5 top-5 h-4 w-4 text-foreground/30 transition-all group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── METRICS BAND ─────────────────────────────────────────── */}
      <section className="relative border-y border-foreground/8 bg-background/40">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 px-6 md:grid-cols-4">
          {figures.map((f, i) => (
            <div key={f.k} className={`py-12 md:py-16 ${i > 0 ? 'md:border-l border-foreground/8 md:pl-8' : ''}`}>
              <p className="eyebrow">{f.k}</p>
              <p className="mt-4 font-heading text-4xl font-semibold tracking-tight md:text-5xl text-gradient-animated">
                {f.v}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MANIFESTO ────────────────────────────────────────────── */}
      <section className="relative">
        <div className="mx-auto max-w-[1440px] px-6 py-24 md:py-40">
          <div className="relative overflow-hidden rounded-3xl border border-foreground/10 bg-card/40 backdrop-blur-xl p-10 md:p-20">
            <div className="pointer-events-none absolute inset-0 neural-grid opacity-40" />
            <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-[42rem] rounded-full bg-primary/25 blur-3xl" />

            <div className="relative grid gap-10 md:grid-cols-12">
              <div className="md:col-span-3">
                <p className="eyebrow">§ 03 — Manifesto</p>
              </div>
              <blockquote className="md:col-span-9">
                <p className="font-heading text-3xl font-semibold leading-[1.15] tracking-tight md:text-5xl lg:text-6xl">
                  Knowledge is not a checkbox. It compounds quietly, in the
                  <span className="display-serif"> space between attempts</span> —
                  the wrong answers you sit with, the questions you return to.
                  This portal is built for that pace.
                </p>
                <footer className="mt-12 flex items-center gap-4">
                  <span className="h-px w-12 bg-gradient-to-r from-primary to-accent" />
                  <span className="eyebrow">Department of Computer Science &amp; Design</span>
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="relative">
        <div className="mx-auto max-w-[1440px] px-6 py-24 md:py-32">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-aurora p-12 md:p-20 text-background">
            <div className="pointer-events-none absolute inset-0 neural-grid opacity-25 mix-blend-overlay" />
            <div className="relative grid items-end gap-10 md:grid-cols-12">
              <div className="md:col-span-8">
                <p className="eyebrow opacity-80" style={{ color: 'inherit' }}>§ 04 — Begin</p>
                <h2 className="mt-6 font-heading text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl lg:text-8xl">
                  Ready when<br /><em className="font-light">you</em> are.
                </h2>
                <p className="mt-6 max-w-md text-base leading-relaxed opacity-90">
                  Sign in with your university account to take quizzes, access
                  materials and track your progress across the semester.
                </p>
              </div>
              <div className="md:col-span-4 flex flex-wrap items-center gap-3 md:justify-end">
                <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-background px-6 py-3.5 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-foreground transition hover:-translate-y-0.5">
                  Sign in to begin <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}