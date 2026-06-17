// Neural Obsidian footer — glassy panels, gradient rule, calm closing band.

import { Link } from 'react-router-dom';
import { Github, Mail, MapPin } from 'lucide-react';

const sitemap = [
  {
    label: 'Portal',
    items: [
      { label: 'Quizzes', to: '/quizzes' },
      { label: 'Study Materials', to: '/materials' },
      { label: 'Results', to: '/results' },
    ],
  },
  {
    label: 'Department',
    items: [
      { label: 'About CSD', to: '/' },
      { label: 'Faculty Access', to: '/login?role=faculty' },
      { label: 'Programs', to: '/' },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Sign In', to: '/login' },
      { label: 'Verify Certificate', to: '/verify' },
      { label: 'Reset Password', to: '/login' },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-20 border-t border-foreground/10">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      {/* Closing band */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 neural-grid opacity-50" />
        <div className="blob blob-violet h-72 w-72 -top-20 -left-20" />
        <div className="blob blob-cyan h-80 w-80 -bottom-32 right-0" />

        <div className="relative mx-auto max-w-[1440px] px-6 py-24 md:py-32">
          <p className="eyebrow">§ End of transmission</p>
          <h3 className="mt-4 font-heading text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl lg:text-[7.5rem]">
            Trained for <span className="display-serif">curiosity</span>.<br />
            Built for <span className="display-serif">rigor</span>.
          </h3>
        </div>
      </section>

      {/* Sitemap */}
      <section className="border-t border-foreground/8 bg-background/40">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-16 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="eyebrow">Colophon</p>
            <p className="mt-4 font-heading text-2xl font-semibold leading-tight tracking-tight">
              The CSD <span className="display-serif font-normal">Portal</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Set in Sora &amp; Manrope. A neural-learning instrument for the
              Department of Computer Science &amp; Design.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a href="#" className="rounded-full border border-foreground/12 p-2 text-foreground/60 transition hover:border-primary/50 hover:text-primary"><Github className="h-4 w-4" /></a>
              <a href="#" className="rounded-full border border-foreground/12 p-2 text-foreground/60 transition hover:border-primary/50 hover:text-primary"><Mail className="h-4 w-4" /></a>
              <a href="#" className="rounded-full border border-foreground/12 p-2 text-foreground/60 transition hover:border-primary/50 hover:text-primary"><MapPin className="h-4 w-4" /></a>
            </div>
          </div>

          {sitemap.map((col) => (
            <div key={col.label} className="md:col-span-2">
              <p className="eyebrow">{col.label}</p>
              <ul className="mt-4 space-y-2.5">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="link-underline text-sm text-foreground/80 hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-2">
            <p className="eyebrow">Location</p>
            <p className="mt-4 text-sm leading-relaxed text-foreground/80">
              Sharnbasva University<br />
              Kalaburagi, Karnataka<br />
              India · 585 102
            </p>
          </div>
        </div>
      </section>

      <div className="border-t border-foreground/8">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-2 px-6 py-5 md:flex-row md:items-center">
          <p className="eyebrow">© {year} Sharnbasva University. All rights reserved.</p>
          <p className="eyebrow">v5.0 · Obsidian Neural · AY 2025—26</p>
        </div>
      </div>
    </footer>
  );
}