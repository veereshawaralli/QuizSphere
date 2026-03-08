// Site header with university branding

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import universityLogo from '@/assets/university-logo.png';

export default function Header() {
  return (
    <header className="border-b border-white/10 bg-primary">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={universityLogo} alt="Sharnbasva University Logo" className="h-12 w-12 object-contain" />
          <div>
            <p className="text-sm font-semibold leading-tight text-primary-foreground">
              Sharnbasva University
            </p>
            <p className="text-xs text-primary-foreground/60">
              Computer Science &amp; Design
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-4">
          <Link to="/login">
            <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg">
              Sign In
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
