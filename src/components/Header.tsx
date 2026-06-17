// Neural Obsidian header — glass nav bar, live status pill, gradient logo halo.

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Menu, X, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import universityLogo from '@/assets/university-logo.png';
import { ThemeToggle } from '@/components/ThemeToggle';

const navItems = [
  { label: 'Quizzes', to: '/quizzes' },
  { label: 'Materials', to: '/materials' },
  { label: 'Results', to: '/results' },
];

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? 'border-b border-foreground/8 bg-background/60 backdrop-blur-2xl'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      {/* Live system strip */}
      <div className="hidden md:flex items-center justify-between border-b border-foreground/8 px-6 py-1.5">
        <span className="eyebrow flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          System online · Kalaburagi
        </span>
        <span className="eyebrow">Neural learning OS · v5.0</span>
      </div>

      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-6 py-4">
        <Link to="/" className="group flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-foreground/10 bg-card/60 p-1.5 backdrop-blur-md transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-[0_0_24px_-2px_hsl(var(--primary)/0.6)]">
            <img src={universityLogo} alt="Sharnbasva University" className="h-full w-full object-contain" />
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-gradient-aurora">
              <Sparkles className="h-2 w-2 text-background" />
            </span>
          </div>
          <div className="leading-tight">
            <p className="font-heading text-[15px] font-semibold tracking-tight text-foreground">
              Sharnbasva <span className="display-serif font-normal">University</span>
            </p>
            <p className="eyebrow text-foreground/55">Computer Science &amp; Design</p>
          </div>
        </Link>

        {user && (
          <nav className="hidden items-center gap-1 md:flex rounded-full border border-foreground/10 bg-card/50 px-2 py-1.5 backdrop-blur-xl">
            {navItems.map((item) => {
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`eyebrow rounded-full px-4 py-2 transition-all ${
                    active
                      ? 'bg-foreground/10 text-foreground shadow-inner'
                      : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSignOut}
                className="hidden sm:inline-flex gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden rounded-full border border-foreground/15 bg-card/60 p-2 text-foreground backdrop-blur-md"
                aria-label="Menu"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-ink">
              Sign In
            </Link>
          )}
        </div>
      </div>

      {user && mobileOpen && (
        <div className="md:hidden border-t border-foreground/10 bg-background/90 backdrop-blur-xl">
          <nav className="mx-auto flex max-w-[1440px] flex-col px-6 py-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="eyebrow border-b border-foreground/8 py-3 text-foreground/75 hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="eyebrow flex items-center gap-2 py-3 text-left text-foreground/75 hover:text-primary"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}