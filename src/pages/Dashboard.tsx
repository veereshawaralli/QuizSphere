// Editorial dashboard — large welcome, mono meta, oversized interactive cards.

import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { BookOpen, Trophy, FileText, LogOut, Shield, User, ArrowUpRight } from 'lucide-react';

const tiles = [
  {
    to: '/quizzes',
    no: '01',
    title: 'Quizzes',
    icon: BookOpen,
    studentCopy: 'Browse what’s available, then begin a timed attempt.',
    facultyCopy: 'Author new quizzes and manage live ones.',
  },
  {
    to: '/results',
    no: '02',
    title: 'Results',
    icon: Trophy,
    studentCopy: 'Review your scores, the answers you missed, and where you stand.',
    facultyCopy: 'Inspect performance, exports and analytics across cohorts.',
  },
  {
    to: '/materials',
    no: '03',
    title: 'Materials',
    icon: FileText,
    studentCopy: 'Notes, slides and reading lists shared by your faculty.',
    facultyCopy: 'Upload notes, PDFs and references for your students.',
  },
];

export default function Dashboard() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');

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
        <p className="eyebrow text-muted-foreground">Loading…</p>
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
        <section className="border-b border-border grain">
          <div className="container mx-auto px-6 pt-12 pb-16">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <p className="eyebrow text-muted-foreground rise rise-1">{today}</p>
              <p className="eyebrow text-muted-foreground rise rise-1">
                Role · <span className="text-accent">{role || 'student'}</span>
              </p>
            </div>

            <div className="mt-10 grid gap-8 md:grid-cols-12 md:items-end">
              <div className="md:col-span-9 rise rise-2">
                <p className="eyebrow text-accent">§ Welcome back</p>
                <h1 className="mt-3 font-heading text-5xl md:text-7xl lg:text-[6rem] leading-[0.95] text-foreground">
                  {displayName?.split(' ')[0] || 'Student'},<br />
                  let’s get back to it<span className="text-accent">.</span>
                </h1>
              </div>
              <div className="md:col-span-3 flex flex-wrap gap-3 md:justify-end rise rise-3">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/profile')}
                  className="rounded-none border border-border gap-2 hover:bg-foreground hover:text-background hover:border-foreground"
                >
                  <User className="h-4 w-4" />
                  <span className="eyebrow">Profile</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="rounded-none border border-border gap-2 hover:bg-accent hover:text-accent-foreground hover:border-accent"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="eyebrow">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Tiles */}
        <section className="container mx-auto px-6 py-16">
          <div className="flex items-end justify-between border-b border-border pb-4 mb-0">
            <p className="eyebrow text-muted-foreground">§ Your tools</p>
            <p className="eyebrow text-muted-foreground hidden sm:block">
              {tiles.length + (role === 'admin' ? 1 : 0)} sections
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border-x border-b border-border">
            {tiles.map((t, i) => (
              <Link
                to={t.to}
                key={t.to}
                className={`group bg-background p-8 lift block rise rise-${Math.min(i + 2, 5)}`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{t.no}</span>
                  <ArrowUpRight className="h-5 w-5 text-foreground/40 transition-all group-hover:text-accent group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <t.icon className="mt-12 h-7 w-7 text-foreground transition-colors group-hover:text-accent" strokeWidth={1.5} />
                <h3 className="mt-6 font-heading text-3xl text-foreground">{t.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground min-h-[3.5rem]">
                  {role === 'faculty' || role === 'admin' ? t.facultyCopy : t.studentCopy}
                </p>
                <div className="mt-8 h-px w-10 bg-foreground transition-all group-hover:w-24 group-hover:bg-accent" />
              </Link>
            ))}

            {role === 'admin' && (
              <Link
                to="/admin"
                className="group bg-foreground text-background p-8 lift block rise rise-5"
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs text-background/60">04</span>
                  <ArrowUpRight className="h-5 w-5 text-background/60 transition-all group-hover:text-accent group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <Shield className="mt-12 h-7 w-7 text-accent" strokeWidth={1.5} />
                <h3 className="mt-6 font-heading text-3xl">Admin Panel</h3>
                <p className="mt-3 text-sm leading-relaxed text-background/70 min-h-[3.5rem]">
                  Manage user roles — promote students to faculty.
                </p>
                <div className="mt-8 h-px w-10 bg-accent transition-all group-hover:w-24" />
              </Link>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
