// Dashboard — immersive 3D Obsidian Neural cockpit. Live aurora hero with a
// neural core scene, glass command tiles, mini 3D ornaments and an ambient
// status rail. Designed so the user wants to stick around.

import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useReveal } from '@/hooks/use-reveal';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  BookOpen, Trophy, FileText, LogOut, Shield, User, ArrowUpRight,
  Sparkles, Zap, Activity, Brain,
} from 'lucide-react';

const DashboardScene = lazy(() => import('@/components/DashboardScene'));
const TileScene3D = lazy(() => import('@/components/TileScene3D'));

type TileVariant = 'torus' | 'octa' | 'knot' | 'cube';

const tiles: Array<{
  to: string; no: string; title: string; icon: typeof BookOpen;
  shape: TileVariant; color: string;
  studentCopy: string; facultyCopy: string;
}> = [
  {
    to: '/quizzes', no: '01', title: 'Quizzes', icon: BookOpen,
    shape: 'octa', color: '#7c3aed',
    studentCopy: 'Browse live assessments and begin a timed attempt.',
    facultyCopy: 'Author new quizzes and manage live ones.',
  },
  {
    to: '/results', no: '02', title: 'Results', icon: Trophy,
    shape: 'torus', color: '#22d3ee',
    studentCopy: 'Review scores, missed answers and your standing.',
    facultyCopy: 'Inspect performance, exports and cohort analytics.',
  },
  {
    to: '/materials', no: '03', title: 'Materials', icon: FileText,
    shape: 'knot', color: '#e879f9',
    studentCopy: 'Notes, slides and reading lists from your faculty.',
    facultyCopy: 'Upload notes, PDFs and references for students.',
  },
];

export default function Dashboard() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  useReveal();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/login'); return; }
    if (!role) void signOut().finally(() => navigate('/login'));
  }, [user, role, loading, navigate, signOut]);

  useEffect(() => {
    if (!user) { setDisplayName(''); return; }
    const fallback = (user.user_metadata?.full_name as string | undefined)?.trim() || user.email || 'User';
    setDisplayName(fallback);

    let ignore = false;
    (async () => {
      const { data, error } = await supabase
        .from('profiles').select('full_name').eq('user_id', user.id).maybeSingle();
      if (ignore || error) return;
      const saved = data?.full_name?.trim();
      if (saved) setDisplayName(saved);
    })();
    return () => { ignore = true; };
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="eyebrow text-gradient-candy">Loading…</p>
      </div>
    );
  }
  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

  const firstName = displayName?.split(' ')[0] || 'Student';
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground overflow-x-clip">
      {/* Ambient aurora orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="blob blob-violet h-[36rem] w-[36rem] -top-40 -left-40 float-y" />
        <div className="blob blob-cyan h-[32rem] w-[32rem] top-40 right-[-10rem] float-x" />
        <div className="blob blob-magenta h-[24rem] w-[24rem] top-[80vh] left-1/3 opacity-40" />
      </div>

      <Header />

      <main className="relative flex-1">
        {/* ── HERO: 3D cockpit ───────────────────────────────────── */}
        <section className="relative">
          <div className="pointer-events-none absolute inset-0 neural-grid opacity-50" />

          <div className="relative mx-auto max-w-[1440px] px-6 pt-10 pb-12 md:pt-14">
            {/* status row */}
            <div className="flex flex-wrap items-center justify-between gap-3 reveal">
              <span className="pill"><Sparkles className="h-3 w-3 text-primary" /> {today}</span>
              <div className="flex items-center gap-2">
                <span className="pill">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  Live · IST {time}
                </span>
                <span className="pill"><Activity className="h-3 w-3 text-accent" /> Role · <span className="text-gradient-aurora font-semibold">{role || 'student'}</span></span>
              </div>
            </div>

            {/* hero bento */}
            <div className="mt-8 grid gap-5 lg:grid-cols-12">
              {/* greeting */}
              <div className="lg:col-span-7 relative overflow-hidden rounded-3xl border border-foreground/10 bg-card/50 backdrop-blur-2xl p-8 md:p-10 rise rise-2">
                <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-aurora opacity-20 blur-3xl" />
                <span className="pill"><Sparkles className="h-3 w-3 text-primary" /> Welcome back</span>
                <h1 className="mt-5 font-heading font-semibold text-5xl md:text-6xl lg:text-7xl leading-[0.95] tracking-[-0.035em]">
                  Hello, <span className="text-gradient-aurora">{firstName}</span>
                  <span className="text-foreground">.</span>
                  <br />
                  <span className="italic font-light text-muted-foreground">your neural deck is online.</span>
                </h1>
                <p className="mt-6 max-w-xl text-muted-foreground leading-relaxed">
                  Continue where you left off, take a fresh quiz, or pull a study material.
                  Everything runs on the Obsidian Neural runtime.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button onClick={() => navigate('/quizzes')} className="gap-2">
                    <Zap className="h-4 w-4" /> Start a quiz
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/profile')} className="gap-2">
                    <User className="h-4 w-4" /> Profile
                  </Button>
                  <Button variant="ghost" onClick={handleSignOut} className="gap-2">
                    <LogOut className="h-4 w-4" /> Sign out
                  </Button>
                </div>
              </div>

              {/* live 3D scene */}
              <div className="lg:col-span-5 relative overflow-hidden rounded-3xl border border-foreground/10 bg-card/40 backdrop-blur-2xl min-h-[360px] rise rise-3">
                <Suspense fallback={<div className="absolute inset-0 grid place-items-center text-muted-foreground eyebrow">Booting neural core…</div>}>
                  <DashboardScene />
                </Suspense>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <div className="pointer-events-none absolute bottom-5 left-5 right-5 flex items-end justify-between">
                  <div>
                    <p className="eyebrow text-muted-foreground">Neural Core</p>
                    <p className="font-heading text-2xl font-semibold">v5.0 · stable</p>
                  </div>
                  <span className="pill"><Brain className="h-3 w-3 text-accent" /> Online</span>
                </div>
              </div>
            </div>

            {/* mini stats rail */}
            <div className="mt-5 grid gap-5 sm:grid-cols-3 rise rise-4">
              {[
                { k: 'Attempts this term', v: '12' },
                { k: 'Avg. score', v: '82%' },
                { k: 'Certificates earned', v: '3' },
              ].map((s) => (
                <div key={s.k} className="rounded-2xl border border-foreground/10 bg-card/50 backdrop-blur-xl p-5 flex items-baseline justify-between">
                  <span className="eyebrow text-muted-foreground">{s.k}</span>
                  <span className="font-heading text-3xl font-semibold text-gradient-aurora">{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMMAND TILES ──────────────────────────────────────── */}
        <section className="relative mx-auto max-w-[1440px] px-6 py-16">
          <div className="flex items-end justify-between pb-8">
            <div>
              <span className="pill"><Sparkles className="h-3 w-3 text-primary" /> Your toolkit</span>
              <h2 className="mt-4 font-heading text-4xl md:text-5xl font-semibold tracking-[-0.035em]">
                Command <span className="italic font-light text-muted-foreground">deck</span>
              </h2>
            </div>
            <span className="eyebrow text-muted-foreground hidden sm:block">
              {tiles.length + (role === 'admin' ? 1 : 0)} modules
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tiles.map((t, i) => (
              <Link
                to={t.to}
                key={t.to}
                className={`group relative overflow-hidden rounded-3xl border border-foreground/10 bg-card/50 backdrop-blur-xl p-8 block transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_30px_60px_-20px_hsl(var(--primary)/0.45)] rise rise-${Math.min(i + 2, 5)}`}
              >
                <span
                  className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full opacity-20 blur-3xl transition-all duration-700 group-hover:opacity-50"
                  style={{ background: `radial-gradient(circle, ${t.color}, transparent 65%)` }}
                />
                {/* mini 3D ornament */}
                <div className="absolute right-4 top-4 h-28 w-28 opacity-90 transition-transform duration-500 group-hover:scale-110">
                  <Suspense fallback={null}>
                    <TileScene3D variant={t.shape} color={t.color} />
                  </Suspense>
                </div>
                <div className="relative flex items-start justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{t.no}</span>
                </div>
                <div className="relative mt-24 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-foreground/15 bg-background/60 backdrop-blur-md transition-all duration-500 group-hover:border-primary/50">
                  <t.icon className="h-5 w-5 text-foreground" strokeWidth={2} />
                </div>
                <h3 className="relative mt-5 font-heading text-3xl font-semibold tracking-[-0.02em]">
                  {t.title}
                </h3>
                <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground min-h-[3.5rem]">
                  {role === 'faculty' || role === 'admin' ? t.facultyCopy : t.studentCopy}
                </p>
                <div className="relative mt-8 flex items-center justify-between">
                  <div className="h-px w-12 bg-gradient-aurora transition-all group-hover:w-24" />
                  <ArrowUpRight className="h-5 w-5 text-foreground/40 transition-all group-hover:text-primary group-hover:-translate-y-1 group-hover:translate-x-1" />
                </div>
              </Link>
            ))}

            {role === 'admin' && (
              <Link
                to="/admin"
                className="group relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 via-card/60 to-accent/20 backdrop-blur-xl p-8 block transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-20px_hsl(var(--primary)/0.6)] rise rise-5"
              >
                <span className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-gradient-aurora opacity-40 blur-3xl transition-all duration-700 group-hover:opacity-70" />
                <div className="absolute right-4 top-4 h-28 w-28 transition-transform duration-500 group-hover:scale-110">
                  <Suspense fallback={null}>
                    <TileScene3D variant="cube" color="#a78bfa" />
                  </Suspense>
                </div>
                <span className="relative font-mono text-xs text-muted-foreground">04</span>
                <div className="relative mt-24 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-foreground/15 bg-background/60 backdrop-blur-md">
                  <Shield className="h-5 w-5 text-foreground" strokeWidth={2} />
                </div>
                <h3 className="relative mt-5 font-heading text-3xl font-semibold tracking-[-0.02em]">Admin Panel</h3>
                <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground min-h-[3.5rem]">
                  Manage user roles — promote students to faculty.
                </p>
                <div className="relative mt-8 flex items-center justify-between">
                  <div className="h-px w-12 bg-gradient-aurora transition-all group-hover:w-24" />
                  <ArrowUpRight className="h-5 w-5 text-foreground/40 transition-all group-hover:text-primary group-hover:-translate-y-1 group-hover:translate-x-1" />
                </div>
              </Link>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
