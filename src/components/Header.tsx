// Editorial sticky header — hairline rule under, monospaced nav, ink-on-paper.

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
      className={`sticky top-0 z-50 w-full border-b transition-colors duration-300 ${
        scrolled
          ? 'border-foreground/15 bg-background/95 backdrop-blur-sm'
          : 'border-transparent bg-background'
      }`}
    >
      {/* Top meta strip */}
      <div className="hidden md:flex items-center justify-between border-b border-foreground/10 px-6 py-1.5 text-foreground/60">
        <span className="eyebrow">Sharnbasva University · Kalaburagi</span>
        <span className="eyebrow">CSD Department · Est. 2023</span>
      </div>

      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-6 py-4">
        <Link to="/" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border border-foreground/15 p-1">
            <img
              src={universityLogo}
              alt="Sharnbasva University"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="leading-tight">
            <p className="font-heading text-[15px] font-medium tracking-tight text-foreground">
              Sharnbasva <span className="display-serif">University</span>
            </p>
            <p className="eyebrow text-foreground/55">Dept. of CS &amp; Design</p>
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
                    active ? 'text-foreground' : 'text-foreground/55 hover:text-foreground'
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
                className="hidden sm:inline-flex gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden border border-foreground/20 p-2 text-foreground"
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

      {/* Mobile nav */}
      {user && mobileOpen && (
        <div className="md:hidden border-t border-foreground/15 bg-background">
          <nav className="mx-auto flex max-w-[1440px] flex-col px-6 py-4">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="eyebrow border-b border-foreground/10 py-3 text-foreground/75 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="eyebrow flex items-center gap-2 py-3 text-left text-foreground/75 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
