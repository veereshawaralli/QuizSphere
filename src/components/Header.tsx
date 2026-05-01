// Playful sticky header — gradient logo halo, animated underlines, glass blur on scroll.

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
          ? 'border-b border-border/60 glass-strong'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="container mx-auto flex items-center justify-between gap-6 px-6 py-4">
        <Link to="/" className="group flex items-center gap-3">
          <div className="relative">
            {/* Gradient halo behind logo */}
            <span className="absolute inset-0 rounded-2xl bg-gradient-candy opacity-60 blur-md transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl glass-strong p-1.5">
              <img
                src={universityLogo}
                alt="Sharnbasva University"
                className="h-full w-full object-contain transition-transform duration-500 group-hover:rotate-[12deg] group-hover:scale-110"
              />
            </div>
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="font-heading text-base font-bold text-foreground">Sharnbasva University</p>
            <p className="eyebrow text-gradient-aurora"> DEPT CS &amp; Design</p>
          </div>
        </Link>

        {user && (
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => {
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`eyebrow link-underline transition-colors ${
                    active ? 'text-gradient-candy font-semibold' : 'text-foreground/70 hover:text-foreground'
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
                variant="ghost"
                onClick={handleSignOut}
                className="hidden sm:inline-flex gap-2 rounded-full text-foreground/80 hover:bg-accent/10 hover:text-accent"
              >
                <LogOut className="h-4 w-4" />
                <span className="eyebrow">Sign Out</span>
              </Button>
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden rounded-full glass p-2 text-foreground"
                aria-label="Menu"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </>
          ) : (
            <Link to="/login">
              <Button
                size="sm"
                className="btn-candy gap-2 rounded-full px-5 text-white"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="eyebrow">Sign In</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {user && mobileOpen && (
        <div className="md:hidden glass-strong border-t border-border bounce-in">
          <nav className="container mx-auto flex flex-col px-6 py-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="eyebrow border-b border-border/50 py-3 text-foreground/80 hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="eyebrow flex items-center gap-2 py-3 text-left text-foreground/80 hover:text-accent"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
