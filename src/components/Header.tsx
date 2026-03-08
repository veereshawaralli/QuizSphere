// Site header with university branding
// Shows on all public pages (landing, login, etc.)

import { Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="border-b bg-primary">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* University branding */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
            <GraduationCap className="h-6 w-6 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-primary-foreground">
              Sharnbasva University
            </p>
            <p className="text-xs text-primary-foreground/70">
              Computer Science &amp; Design
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="secondary" size="sm">
              Sign In
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
