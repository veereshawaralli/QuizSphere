// Editorial sticky header — paper background with ink type and a single coral accent.

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Menu, X } from 'lucide-react';
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
          ? 'border-b border-border/60 bg-background/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-background/0'
      }`}
    >
      <div className="container mx-auto flex items-center justify-between gap-6 px-6 py-4">
        <Link to="/" className="group flex items-center gap-3">
          <div className="relative">
            <img
              src={universityLogo}
              alt="Sharnbasva University"
              className="h-10 w-10 object-contain transition-transform duration-500 group-hover:rotate-[8deg]"
            />
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-accent" aria-hidden />
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="font-heading text-base text-foreground">Sharnbasva</p>
            <p className="eyebrow text-muted-foreground">CS &amp; Design</p>
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
                    active ? 'text-accent' : 'text-foreground/70 hover:text-foreground'
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
                className="hidden sm:inline-flex gap-2 rounded-none text-foreground/80 hover:bg-transparent hover:text-accent"
              >
                <LogOut className="h-4 w-4" />
                <span className="eyebrow">Sign Out</span>
              </Button>
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden rounded-none border border-border p-2 text-foreground"
                aria-label="Menu"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </>
          ) : (
            <Link to="/login">
              <Button
                size="sm"
                className="rounded-none bg-foreground text-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <span className="eyebrow">Sign In</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {user && mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
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
