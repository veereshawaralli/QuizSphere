// Playful dashboard — gradient welcome, sticker-style tiles, animated reveals.

import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useReveal } from '@/hooks/use-reveal';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BookOpen, Trophy, FileText, LogOut, Shield, User, ArrowUpRight, Sparkles } from 'lucide-react';

const tiles = [
  {
    to: '/quizzes',
    no: '01',
    title: 'Quizzes',
    icon: BookOpen,
    color: 'bg-accent text-accent-foreground',
    gradient: 'bg-gradient-candy',
    studentCopy: 'Browse what’s available, then begin a timed attempt.',
    facultyCopy: 'Author new quizzes and manage live ones.',
  },
  {
    to: '/results',
    no: '02',
    title: 'Results',
    icon: Trophy,
    color: 'bg-primary text-primary-foreground',
    gradient: 'bg-gradient-aurora',
    studentCopy: 'Review your scores, the answers you missed, and where you stand.',
    facultyCopy: 'Inspect performance, exports and analytics across cohorts.',
  },
  {
    to: '/materials',
    no: '03',
    title: 'Materials',
    icon: FileText,
    color: 'bg-cyan-brand',
    gradient: 'bg-gradient-lime',
    studentCopy: 'Notes, slides and reading lists shared by your faculty.',
    facultyCopy: 'Upload notes, PDFs and references for your students.',
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Welcome band */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="blob"
              style={{ width: 480, height: 480, top: '-15%', right: '-10%',
                background: 'radial-gradient(circle, hsl(var(--accent) / 0.5), transparent 60%)' }} />
            <div className="blob"
              style={{ width: 380, height: 380, bottom: '-20%', left: '-5%',
                background: 'radial-gradient(circle, hsl(var(--primary) / 0.5), transparent 60%)',
                animationDelay: '-8s' }} />
          </div>
          <div className="pointer-events-none absolute inset-0 -z-10 dot-grid opacity-30" />

          <div className="container mx-auto px-6 pt-12 pb-16">
            <div className="flex items-center justify-between pb-4">
              <span className="pill glass eyebrow text-muted-foreground rise rise-1">
                <Sparkles className="h-3 w-3 text-accent" /> {today}
              </span>
              <span className="pill glass eyebrow text-muted-foreground rise rise-1">
                Role · <span className="text-gradient-candy font-bold">{role || 'student'}</span>
              </span>
            </div>

            <div className="mt-10 grid gap-8 md:grid-cols-12 md:items-end">
              <div className="md:col-span-9 rise rise-2">
                <span className="pill glass eyebrow text-accent inline-flex">
                  <Sparkles className="h-3 w-3" /> Welcome back
                </span>
                <h1 className="mt-3 font-heading font-bold text-5xl md:text-7xl lg:text-[6rem] leading-[0.95]">
                  <span className="text-gradient-candy">{displayName?.split(' ')[0] || 'Student'}</span>
                  <span className="text-foreground">,</span><br />
                  <span className="text-foreground">let's get back to it</span>
                  <span className="text-accent">.</span>
                </h1>
              </div>
              <div className="md:col-span-3 flex flex-wrap gap-3 md:justify-end rise rise-3">
                <Button variant="ghost" onClick={() => navigate('/profile')}
                  className="rounded-full glass gap-2 hover:bg-foreground hover:text-background">
                  <User className="h-4 w-4" />
                  <span className="eyebrow">Profile</span>
                </Button>
                <Button variant="ghost" onClick={handleSignOut}
                  className="rounded-full glass gap-2 hover:bg-accent hover:text-accent-foreground">
                  <LogOut className="h-4 w-4" />
                  <span className="eyebrow">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Tiles */}
        <section className="container mx-auto px-6 py-16">
          <div className="flex items-end justify-between pb-6">
            <span className="pill glass eyebrow text-muted-foreground inline-flex">
              <Sparkles className="h-3 w-3 text-primary" /> Your tools
            </span>
            <span className="eyebrow text-muted-foreground hidden sm:block">
              {tiles.length + (role === 'admin' ? 1 : 0)} sections
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tiles.map((t, i) => (
              <Link to={t.to} key={t.to}
                className={`group relative glass tilt rounded-3xl p-8 block rise rise-${Math.min(i + 2, 5)} overflow-hidden`}>
                <span className={`pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full ${t.gradient} opacity-20 blur-3xl transition-all duration-700 group-hover:opacity-50`} />
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{t.no}</span>
                  <ArrowUpRight className="h-5 w-5 text-foreground/40 transition-all group-hover:text-accent group-hover:-translate-y-1 group-hover:translate-x-1" />
                </div>
                <div className={`mt-12 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${t.color} shadow-pop transition-all duration-500 group-hover:rotate-[-8deg] group-hover:scale-110`}>
                  <t.icon className="h-6 w-6" strokeWidth={2.2} />
                </div>
                <h3 className="mt-6 font-heading text-3xl font-bold text-foreground transition-colors">
                  {t.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground min-h-[3.5rem]">
                  {role === 'faculty' || role === 'admin' ? t.facultyCopy : t.studentCopy}
                </p>
                <div className={`mt-8 h-1 w-12 rounded-full ${t.gradient} transition-all group-hover:w-24`} />
              </Link>
            ))}

            {role === 'admin' && (
              <Link to="/admin"
                className="group relative bg-foreground text-background tilt rounded-3xl p-8 block rise rise-5 overflow-hidden">
                <span className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-candy opacity-40 blur-3xl transition-all duration-700 group-hover:opacity-70" />
                <div className="flex items-start justify-between relative">
                  <span className="font-mono text-xs text-background/60">04</span>
                  <ArrowUpRight className="h-5 w-5 text-background/60 transition-all group-hover:text-accent group-hover:-translate-y-1 group-hover:translate-x-1" />
                </div>
                <div className="mt-12 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-candy shadow-pop transition-all duration-500 group-hover:rotate-[-8deg] group-hover:scale-110 relative">
                  <Shield className="h-6 w-6 text-white" strokeWidth={2.2} />
                </div>
                <h3 className="mt-6 font-heading text-3xl font-bold relative">Admin Panel</h3>
                <p className="mt-3 text-sm leading-relaxed text-background/70 min-h-[3.5rem] relative">
                  Manage user roles — promote students to faculty.
                </p>
                <div className="mt-8 h-1 w-12 rounded-full bg-gradient-candy transition-all group-hover:w-24 relative" />
              </Link>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
