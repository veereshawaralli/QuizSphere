// Editorial footer with marquee tagline and clean meta row.

import { Link } from 'react-router-dom';

const tagline = [
  'Learn',
  'Build',
  'Question',
  'Iterate',
  'Ship',
  'Repeat',
];

export default function Footer() {
  return (
    <footer className="relative border-t border-border bg-background">
      {/* Marquee */}
      <div className="overflow-hidden border-b border-border py-6">
        <div className="marquee">
          <div className="marquee-track">
            {[...tagline, ...tagline, ...tagline].map((word, i) => (
              <span
                key={i}
                className="font-heading text-5xl md:text-7xl leading-none text-foreground/85 whitespace-nowrap flex items-center gap-12"
              >
                {word}
                <span className="h-2 w-2 rounded-full bg-accent inline-block" />
              </span>
            ))}
          </div>
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
