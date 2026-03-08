// Site header with university branding

import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';
import universityLogo from '@/assets/university-logo.png';

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

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
          {user ? (
            <Button size="sm" variant="outline" onClick={handleSignOut} className="border-white/30 bg-white/10 text-primary-foreground hover:bg-white/20 gap-2 rounded-lg">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          ) : (
            <Link to="/login">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-lg">
                Sign In
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
