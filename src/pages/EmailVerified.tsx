import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

export default function EmailVerified() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="relative flex flex-1 items-center justify-center px-4 py-12 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="blob"
            style={{ width: 480, height: 480, top: '-10%', right: '-10%',
              background: 'radial-gradient(circle, hsl(var(--lime) / 0.5), transparent 60%)' }} />
          <div className="blob"
            style={{ width: 380, height: 380, bottom: '-15%', left: '-5%',
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.5), transparent 60%)',
              animationDelay: '-7s' }} />
        </div>

        <div className="relative w-full max-w-md glass-strong rounded-3xl p-10 text-center bounce-in">
          <div className="relative mx-auto inline-flex float-y mb-2">
            <span className="absolute inset-0 rounded-full bg-gradient-lime opacity-60 blur-xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-lime shadow-pop">
              <CheckCircle2 className="h-10 w-10 text-white" strokeWidth={2.2} />
            </div>
          </div>
          <span className="pill glass eyebrow text-success inline-flex mt-6">
            <Sparkles className="h-3 w-3" /> Success
          </span>
          <h1 className="mt-4 font-heading text-3xl md:text-4xl font-bold">
            <span className="text-foreground">Email </span>
            <span className="text-gradient-candy">verified!</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Your email has been successfully verified. You can now sign in to your account.
          </p>
          <Link to="/login" className="inline-block mt-8 w-full">
            <Button className="btn-candy w-full rounded-full py-6 gap-2 text-white">
              <span className="eyebrow">Go to Login</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
