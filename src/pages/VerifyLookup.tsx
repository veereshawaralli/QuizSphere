import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Sparkles } from 'lucide-react';

export default function VerifyLookup() {
  const [id, setId] = useState('');
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = id.trim();
    if (!trimmed) return;
    navigate(`/verify/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="relative flex-1 flex items-center justify-center px-4 py-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="blob" style={{ width: 460, height: 460, top: '-10%', right: '-10%',
            background: 'radial-gradient(circle, hsl(var(--accent) / 0.45), transparent 60%)' }} />
          <div className="blob" style={{ width: 380, height: 380, bottom: '-15%', left: '-5%',
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.45), transparent 60%)',
            animationDelay: '-7s' }} />
        </div>

        <div className="relative w-full max-w-md">
          <div className="glass-strong rounded-3xl p-8 text-center">
            <span className="pill glass eyebrow text-accent inline-flex">
              <Sparkles className="h-3 w-3" /> Verification
            </span>
            <div className="mx-auto mt-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-aurora shadow-pop">
              <ShieldCheck className="h-8 w-8 text-background" />
            </div>
            <h1 className="mt-4 font-heading text-3xl font-bold">
              Verify a <span className="text-gradient-candy">Certificate</span>
            </h1>
            <p className="mt-2 text-muted-foreground text-sm">
              Enter the certificate ID (found on the certificate) or scan the QR code to be redirected automatically.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-3 text-left">
              <label className="eyebrow text-muted-foreground">Certificate ID</label>
              <Input
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. 4b2a1e8c-…"
                className="font-mono"
                autoFocus
              />
              <Button type="submit" className="w-full" disabled={!id.trim()}>
                Verify Certificate
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}