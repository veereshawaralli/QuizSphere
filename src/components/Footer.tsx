// Playful footer — gradient orb, animated marquee tagline, confetti dot grid.

import { Link } from 'react-router-dom';
import { Heart, Sparkles, Zap } from 'lucide-react';

const tagline = ['Learn', 'Build', 'Question', 'Iterate', 'Ship'];

export default function Footer() {
  return (
    <footer className="relative border-t border-border bg-background overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="pointer-events-none absolute -top-32 -left-20 h-80 w-80 rounded-full bg-gradient-candy opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-gradient-aurora opacity-20 blur-3xl" />

      {/* Banner with playful tagline */}
      <div className="relative border-b border-border/60">
        <div className="container mx-auto flex flex-col gap-6 px-6 py-12 md:flex-row md:items-end md:justify-between">
          <h3 className="font-heading text-4xl md:text-6xl font-bold leading-[1] max-w-2xl">
            <span className="text-foreground">A quiet place </span>
            <br className="hidden md:block" />
            <span className="text-foreground">for </span>
            <span className="text-gradient-candy italic">serious</span>
            <span className="text-foreground"> work</span>
            <span className="text-accent">.</span>
          </h3>
          <ul className="flex flex-wrap items-center gap-2">
            {tagline.map((w, i) => {
              const colors = [
                'bg-accent text-accent-foreground',
                'bg-primary text-primary-foreground',
                'bg-cyan-brand',
                'bg-lime',
                'bg-tangerine',
              ];
              return (
                <li key={w}>
                  <span className={`pill ${colors[i]} eyebrow font-semibold rounded-full px-4 py-1.5 shadow-soft`}>
                    {w}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="relative container mx-auto grid gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-accent" />
            <p className="eyebrow text-muted-foreground">Department</p>
          </div>
          <p className="font-heading text-2xl font-bold text-foreground">
            Computer Science <br /> &amp; Design
          </p>
          <p className="mt-3 text-sm text-muted-foreground">Sharnbasva University · Kalaburagi</p>
        </div>

        <div className="md:justify-self-center">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-primary" />
            <p className="eyebrow text-muted-foreground">Explore</p>
          </div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/quizzes" className="link-underline text-foreground/80">Quizzes</Link></li>
            <li><Link to="/materials" className="link-underline text-foreground/80">Study Materials</Link></li>
            <li><Link to="/results" className="link-underline text-foreground/80">Results</Link></li>
          </ul>
        </div>

        <div className="md:justify-self-end md:text-right">
          <div className="flex items-center gap-2 mb-3 md:justify-end">
            <Heart className="h-4 w-4 text-accent fill-accent" />
            <p className="eyebrow text-muted-foreground">Made with care</p>
          </div>
          <p className="font-mono text-xs text-foreground/70">
            v 3.0 — {new Date().getFullYear()}
          </p>
          <p className="mt-1 font-hand text-xl text-gradient-candy">
            by humans, for students
          </p>
        </div>
      </div>

      <div className="relative border-t border-border/60">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-6 py-5 md:flex-row">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            © {new Date().getFullYear()} Sharnbasva University
          </p>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Bengaluru · Karnataka · India
          </p>
        </div>
      </div>
    </footer>
  );
}
