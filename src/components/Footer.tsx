// Editorial footer — clean, calm, no marquee.

import { Link } from 'react-router-dom';

const tagline = ['Learn', 'Build', 'Question', 'Iterate', 'Ship'];

export default function Footer() {
  return (
    <footer className="relative border-t border-border bg-background">
      {/* Quiet editorial banner — replaces the marquee */}
      <div className="border-b border-border">
        <div className="container mx-auto flex flex-col gap-6 px-6 py-10 md:flex-row md:items-end md:justify-between">
          <h3 className="font-heading text-4xl md:text-5xl leading-[1] text-foreground max-w-2xl">
            A quiet place <br className="hidden md:block" />
            for serious work<span className="text-accent">.</span>
          </h3>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {tagline.map((w, i) => (
              <li key={w} className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-muted-foreground">
                  0{i + 1}
                </span>
                <span className="eyebrow text-foreground/80">{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="container mx-auto grid gap-8 px-6 py-12 md:grid-cols-3">
        <div>
          <p className="eyebrow text-muted-foreground">Department</p>
          <p className="mt-2 font-heading text-2xl text-foreground">
            Computer Science <br /> &amp; Design
          </p>
          <p className="mt-3 text-sm text-muted-foreground">Sharnbasva University</p>
        </div>

        <div className="md:justify-self-center">
          <p className="eyebrow text-muted-foreground">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/quizzes" className="link-underline text-foreground/80">Quizzes</Link></li>
            <li><Link to="/materials" className="link-underline text-foreground/80">Study Materials</Link></li>
            <li><Link to="/results" className="link-underline text-foreground/80">Results</Link></li>
          </ul>
        </div>

        <div className="md:justify-self-end md:text-right">
          <p className="eyebrow text-muted-foreground">Index</p>
          <p className="mt-3 font-mono text-xs text-foreground/70">
            v 2.4 — {new Date().getFullYear()}
          </p>
          <p className="mt-1 font-mono text-xs text-foreground/50">
            Built with care, by humans.
          </p>
        </div>
      </div>

      <div className="border-t border-border">
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
