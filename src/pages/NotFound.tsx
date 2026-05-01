import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, Sparkles } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="blob"
          style={{ width: 520, height: 520, top: '-10%', left: '-10%',
            background: 'radial-gradient(circle, hsl(var(--accent) / 0.6), transparent 60%)' }} />
        <div className="blob"
          style={{ width: 460, height: 460, bottom: '-15%', right: '-10%',
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.5), transparent 60%)',
            animationDelay: '-7s' }} />
      </div>
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-30" />

      <div className="relative text-center px-6 bounce-in">
        <span className="pill glass eyebrow text-accent inline-flex">
          <Sparkles className="h-3 w-3" /> Lost in space
        </span>
        <h1 className="mt-6 font-heading text-[20vw] md:text-[12rem] font-bold leading-none text-gradient-candy">
          404
        </h1>
        <p className="mt-4 text-xl md:text-2xl text-foreground font-semibold">Oops! This page doesn't exist.</p>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          The page you're looking for took a detour. Let's get you back home.
        </p>
        <Link to="/" className="inline-block mt-8">
          <Button size="lg" className="btn-candy gap-2 rounded-full px-8 text-white">
            <Home className="h-4 w-4" />
            <span className="eyebrow">Return home</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
